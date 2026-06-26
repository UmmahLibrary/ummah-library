/**
 * Sequential ayah recitation with word-by-word highlighting, built on
 * expo-audio. For reciters that have quran.com word timings (`quranComId`) we
 * play quran.com's audio so the segment timings line up, and highlight the
 * current word from `player.currentTime`; otherwise we fall back to the
 * reciter's own per-ayah MP3 (no word sync). A stall watchdog skips an ayah that
 * makes no progress within STALL_MS so a flaky connection degrades gracefully.
 *
 * A single AudioPlayer is kept for the hook's lifetime and re-sourced with
 * `replace()` for each āyah. Because there is only ever one player, two
 * recitations can never sound in parallel (a rapid re-tap just re-sources the
 * same player), and we avoid allocating/freeing a native player every āyah.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import {
  clampPlaybackRate,
  reciterAudioUrl,
  repeatRange,
  type ReciterPlugin,
  type VerseKey,
} from "@ummahlibrary/core";
import { KEYS, getString, setString } from "../storage";

const STALL_MS = 8000;
const POLL_MS = 60;

/** quran.com word-timing segment: [wordIndex, position, startMs, endMs]. */
type Segment = [number, number, number, number];
interface Timing {
  url: string;
  segments: Segment[];
}

export const verseKeyOf = (v: VerseKey): string => `${v.sura}:${v.aya}`;

const timingCache = new Map<string, Promise<Timing | null>>();
function fetchTiming(recitationId: number, verseKey: string): Promise<Timing | null> {
  const cacheKey = `${recitationId}:${verseKey}`;
  let pending = timingCache.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      try {
        const res = await fetch(
          `https://api.quran.com/api/v4/verses/by_key/${verseKey}?audio=${recitationId}`,
        );
        if (!res.ok) return null;
        const data = (await res.json()) as {
          verse?: { audio?: { url: string; segments: Segment[] } };
        };
        const audio = data.verse?.audio;
        return audio
          ? { url: `https://verses.quran.com/${audio.url}`, segments: audio.segments }
          : null;
      } catch {
        return null;
      }
    })();
    timingCache.set(cacheKey, pending);
  }
  return pending;
}

export interface SurahAudio {
  playingKey: string | null;
  buffering: boolean;
  activeWord: number;
  loop: boolean;
  setLoop: (on: boolean) => void;
  /** Playback speed (clamped to [0.5, 2]); persisted across sessions. */
  rate: number;
  setRate: (rate: number) => void;
  playFrom: (verses: VerseKey[], start: VerseKey, advance: boolean) => void;
  /** Loop the inclusive A→B range `count` times (Infinity = until stopped). */
  playRange: (verses: VerseKey[], from: VerseKey, to: VerseKey, count: number) => void;
  /** Tap-a-word-to-hear (#145): play just one word of a verse, from its timing segment. */
  playWord: (verse: VerseKey, wordIndex: number) => void;
  stop: () => void;
}

export function useSurahAudio(reciter: ReciterPlugin): SurahAudio {
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [activeWord, setActiveWord] = useState(-1);
  const [loop, setLoopState] = useState(false);
  const [rate, setRateState] = useState(1);

  const playerRef = useRef<AudioPlayer | null>(null);
  const tokenRef = useRef(0);
  const settleRef = useRef<(() => void) | null>(null);
  // A ref so the running playback loop reads the latest value, not a stale closure.
  const loopRef = useRef(false);
  const rateRef = useRef(1);
  // Set when the app returns to the foreground so the next poll tick force-pushes
  // the word highlight. While backgrounded the JS poll is throttled and React
  // never commits its `setActiveWord` calls, so on return the highlight can sit
  // stale (right word value, nothing painted) until the audio crosses into the
  // next word. Re-asserting it on resume re-syncs the highlight to live audio.
  const resyncRef = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") resyncRef.current = true;
    });
    return () => sub.remove();
  }, []);

  // Restore the saved playback speed once.
  useEffect(() => {
    void getString(KEYS.audioRate).then((saved) => {
      if (saved === null) return;
      const r = clampPlaybackRate(Number(saved));
      rateRef.current = r;
      setRateState(r);
    });
  }, []);

  const setLoop = useCallback((on: boolean) => {
    loopRef.current = on;
    setLoopState(on);
  }, []);

  const setRate = useCallback((next: number) => {
    const r = clampPlaybackRate(next);
    rateRef.current = r;
    setRateState(r);
    void setString(KEYS.audioRate, String(r));
    try {
      // Apply to the live player at once (pitch-corrected so the voice keeps its tone).
      if (playerRef.current) {
        playerRef.current.shouldCorrectPitch = true;
        playerRef.current.playbackRate = r;
      }
    } catch {
      /* no active player */
    }
  }, []);

  // The one persistent player, created lazily and re-sourced with replace().
  const ensurePlayer = useCallback((src: string): AudioPlayer => {
    if (!playerRef.current) {
      playerRef.current = createAudioPlayer({ uri: src });
    } else {
      playerRef.current.replace({ uri: src });
    }
    try {
      // Re-assert the chosen speed after every (re-)source — replace() can reset it.
      playerRef.current.shouldCorrectPitch = true;
      playerRef.current.playbackRate = rateRef.current;
    } catch {
      /* rate unsupported on this platform */
    }
    return playerRef.current;
  }, []);

  const stop = useCallback(() => {
    // Bump the token and settle the in-flight āyah loop so it halts at once,
    // then pause the single player — pausing is immediate, so the audio stops
    // the instant the button is tapped.
    tokenRef.current += 1;
    settleRef.current?.();
    setPlayingKey(null);
    setBuffering(false);
    setActiveWord(-1);
    try {
      playerRef.current?.pause();
      // Tear down the lock-screen / notification controls — playback is over.
      playerRef.current?.setActiveForLockScreen(false);
    } catch {
      /* not playing */
    }
  }, []);

  // One playback session over `queue`, repeated per `repeat`: null = a whole-list
  // loop driven live by `loopRef`; a number = that many passes (Infinity = until
  // stopped). The per-āyah engine below is shared by "play from here" and "loop A→B".
  const startSession = useCallback(
    (queue: VerseKey[], startKey: VerseKey, repeat: number | null) => {
      if (queue.length === 0) return;
      const token = ++tokenRef.current;
      // Settle any in-flight āyah loop now so its poll/listener tear down at
      // once, and flip the UI to "playing" immediately (the audio itself still
      // has to fetch timings/buffer, but the button responds instantly).
      settleRef.current?.();
      setPlayingKey(verseKeyOf(startKey));
      setBuffering(true);
      setActiveWord(-1);

      void (async () => {
        // Keep the audio session alive when the app backgrounds (the screen
        // turns off, the user switches away) so recitation keeps playing
        // instead of expo-audio auto-pausing it. `playsInSilentMode` is the
        // iOS counterpart.
        setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(
          () => {},
        );

        // Bring the notification/lock-screen controls up exactly once per
        // session (see below) — rebuilding them per āyah would flicker.
        let lockActive = false;
        let plays = 0;

        do {
          for (const v of queue) {
            if (tokenRef.current !== token) return;
            const key = verseKeyOf(v);
            setPlayingKey(key);
            setBuffering(true);
            setActiveWord(-1);

            let src: string | undefined;
            let segments: Segment[] | null = null;
            if (reciter.quranComId) {
              const timing = await fetchTiming(reciter.quranComId, key);
              if (tokenRef.current !== token) return;
              if (timing) {
                src = timing.url;
                segments = timing.segments;
              }
            }
            src ??= reciterAudioUrl(reciter, v);

            const player = ensurePlayer(src);
            if (tokenRef.current !== token) return;

            // Bring up the lock-screen / notification media controls (foreground
            // service) once per session. This is what lets recitation keep
            // playing — under a visible, controllable notification — when the
            // screen turns off or the user switches apps, matching how Quran
            // audio apps behave. The session binds to the persistent ExoPlayer,
            // so it survives the per-āyah replace(); we deliberately do NOT
            // re-arm it per āyah because that rebuilds the MediaSession and
            // flickers the notification. It exposes only play/pause (next/prev
            // are stripped natively), so it can't fight our queue — an external
            // pause is handled by the pause-aware watchdog below.
            if (!lockActive) {
              try {
                player.setActiveForLockScreen(true, {
                  title: "Holy Quran",
                  artist: reciter.name,
                  albumTitle: "Ummah Library",
                });
                lockActive = true;
              } catch {
                /* lock-screen controls unavailable on this platform */
              }
            }

            await new Promise<void>((resolve) => {
              let settled = false;
              // The one reused player lingers in the previous āyah's STATE_ENDED
              // until replace()+prepare() finishes asynchronously, and expo-audio
              // reports didJustFinish as a *level* (playbackState === ENDED), not
              // a one-shot edge. So a freshly-attached listener can observe the
              // *previous* āyah's leftover "finished" and skip this one in
              // silence. Gate every advance on this āyah having actually begun:
              // honour didJustFinish (and the word/stall poll) only once we have
              // seen real playback — the player report `playing`, or the position
              // genuinely move forward (a single leaked end-position stays
              // constant, so it never trips the progress check).
              let started = false;
              let lastTime = -1;
              let lastWord = -1;
              let timer: ReturnType<typeof setTimeout>;
              const done = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                clearInterval(poll);
                sub.remove();
                settleRef.current = null;
                resolve();
              };
              const arm = () => {
                clearTimeout(timer);
                timer = setTimeout(done, STALL_MS);
              };
              // End-of-āyah advance comes from the status event; the word
              // highlight and stall detection are driven by a tight poll of the
              // real playback position so the highlight tracks the audio
              // instead of lagging behind the coarse status-update cadence.
              const sub = player.addListener("playbackStatusUpdate", (status) => {
                if (status.didJustFinish && started) {
                  done();
                  return;
                }
                if (status.playing) {
                  // Genuinely playing: mark this āyah started and (re)start the
                  // stall countdown.
                  started = true;
                  arm();
                } else if (started && status.isLoaded && !status.isBuffering) {
                  // Paused after it had been playing, and not mid-buffer — the
                  // screen went off, a call came in, or the system took audio
                  // focus. Freeze the stall watchdog so we hold on this āyah and
                  // its highlight instead of skipping ahead; playback (and the
                  // poll below) resumes us when audio comes back. A stuck
                  // *load* (started/buffering) deliberately keeps the watchdog
                  // armed so it still degrades a flaky connection gracefully.
                  clearTimeout(timer);
                }
              });
              const poll = setInterval(() => {
                let t: number;
                try {
                  t = player.currentTime;
                } catch {
                  return;
                }
                if (typeof t !== "number" || Number.isNaN(t) || t <= 0) return;
                if (!started) {
                  // Two increasing samples confirm the new source is really
                  // advancing (not a stale end-position leaked from the last
                  // āyah). Until then, ignore the position entirely.
                  if (lastTime >= 0 && t > lastTime) started = true;
                  lastTime = t;
                  if (!started) return;
                }
                setBuffering(false);
                if (t !== lastTime) {
                  lastTime = t;
                  arm();
                }
                if (segments) {
                  const ms = t * 1000;
                  let index = -1;
                  for (const seg of segments) {
                    if (ms >= seg[2] && ms < seg[3]) {
                      index = seg[0];
                      break;
                    }
                  }
                  // Re-push on app-resume even if the index is unchanged, so a
                  // highlight that went stale in the background snaps back to
                  // the live audio position.
                  const resync = resyncRef.current;
                  if (index !== lastWord || resync) {
                    lastWord = index;
                    setActiveWord(index);
                  }
                  if (resync) resyncRef.current = false;
                }
              }, POLL_MS);
              settleRef.current = done;
              player.play();
              arm();
            });

            if (tokenRef.current !== token) return;
          }
          plays += 1;
          // Repeat: a whole-list loop reads `loopRef` live; an A→B range runs a
          // fixed number of passes (Infinity ⇒ until stopped).
        } while (
          tokenRef.current === token &&
          (repeat === null ? loopRef.current : plays < repeat)
        );

        if (tokenRef.current === token) {
          try {
            playerRef.current?.pause();
            // Recitation finished — clear the lock-screen / notification controls.
            playerRef.current?.setActiveForLockScreen(false);
          } catch {
            /* already paused */
          }
          setPlayingKey(null);
          setBuffering(false);
          setActiveWord(-1);
        }
      })();
    },
    [reciter, ensurePlayer],
  );

  const playFrom = useCallback(
    (verses: VerseKey[], start: VerseKey, advance: boolean) => {
      const startIdx = verses.findIndex((v) => v.sura === start.sura && v.aya === start.aya);
      if (startIdx < 0) return;
      const queue = advance ? verses.slice(startIdx) : [verses[startIdx]!];
      startSession(queue, start, null);
    },
    [startSession],
  );

  const playRange = useCallback(
    (verses: VerseKey[], from: VerseKey, to: VerseKey, count: number) => {
      const queue = repeatRange(verses, verseKeyOf(from), verseKeyOf(to));
      if (queue[0]) startSession(queue, queue[0], count);
    },
    [startSession],
  );

  // Tap-a-word-to-hear (#145): seek the verse audio to one word's timing segment
  // and play just that word, pausing at its segment end. Needs a reciter with
  // quran.com word timings — a no-op otherwise. The off-by-default toggle gates it.
  const playWord = useCallback(
    (verse: VerseKey, wordIndex: number) => {
      const recitationId = reciter.quranComId;
      if (!recitationId) return;
      const token = ++tokenRef.current; // cancels any running session
      settleRef.current?.();
      setActiveWord(-1);
      void (async () => {
        const key = verseKeyOf(verse);
        const timing = await fetchTiming(recitationId, key);
        if (tokenRef.current !== token || !timing) return;
        const seg = timing.segments.find((s) => s[0] === wordIndex);
        if (!seg) return;
        const player = ensurePlayer(timing.url);
        if (tokenRef.current !== token) return;
        setPlayingKey(key);
        const endSec = seg[3] / 1000;
        try {
          await player.seekTo(seg[2] / 1000);
        } catch {
          /* seek unsupported — falls back to playing from the verse start */
        }
        if (tokenRef.current !== token) return;
        setActiveWord(wordIndex);
        player.play();
        // Pause once playback reaches the word's segment end.
        const poll = setInterval(() => {
          if (tokenRef.current !== token) {
            clearInterval(poll);
            return;
          }
          let t: number;
          try {
            t = player.currentTime;
          } catch {
            return;
          }
          if (typeof t === "number" && t >= endSec) {
            clearInterval(poll);
            try {
              player.pause();
            } catch {
              /* already paused */
            }
            setActiveWord(-1);
            setPlayingKey(null);
          }
        }, POLL_MS);
        settleRef.current = () => clearInterval(poll);
      })();
    },
    [reciter, ensurePlayer],
  );

  // Tear the player down when the screen leaves so no poll/interval lingers,
  // and clear the notification so it can't outlive the reader.
  useEffect(() => {
    return () => {
      tokenRef.current += 1;
      settleRef.current?.();
      try {
        playerRef.current?.setActiveForLockScreen(false);
        playerRef.current?.remove();
      } catch {
        /* already gone */
      }
      playerRef.current = null;
    };
  }, []);

  return {
    playingKey,
    buffering,
    activeWord,
    loop,
    setLoop,
    rate,
    setRate,
    playFrom,
    playRange,
    playWord,
    stop,
  };
}
