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
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { reciterAudioUrl, type ReciterPlugin, type VerseKey } from "@ummahlibrary/core";

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
  playFrom: (verses: VerseKey[], start: VerseKey, advance: boolean) => void;
  stop: () => void;
}

export function useSurahAudio(reciter: ReciterPlugin): SurahAudio {
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [activeWord, setActiveWord] = useState(-1);
  const [loop, setLoopState] = useState(false);

  const playerRef = useRef<AudioPlayer | null>(null);
  const tokenRef = useRef(0);
  const settleRef = useRef<(() => void) | null>(null);
  // A ref so the running playback loop reads the latest value, not a stale closure.
  const loopRef = useRef(false);

  const setLoop = useCallback((on: boolean) => {
    loopRef.current = on;
    setLoopState(on);
  }, []);

  // The one persistent player, created lazily and re-sourced with replace().
  const ensurePlayer = useCallback((src: string): AudioPlayer => {
    if (!playerRef.current) {
      playerRef.current = createAudioPlayer({ uri: src });
    } else {
      playerRef.current.replace({ uri: src });
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
    } catch {
      /* not playing */
    }
  }, []);

  const playFrom = useCallback(
    (verses: VerseKey[], start: VerseKey, advance: boolean) => {
      const startIdx = verses.findIndex((v) => v.sura === start.sura && v.aya === start.aya);
      if (startIdx < 0) return;
      const queue = advance ? verses.slice(startIdx) : [verses[startIdx]!];
      const token = ++tokenRef.current;
      // Settle any in-flight āyah loop now so its poll/listener tear down at
      // once, and flip the UI to "playing" immediately (the audio itself still
      // has to fetch timings/buffer, but the button responds instantly).
      settleRef.current?.();
      setPlayingKey(verseKeyOf(start));
      setBuffering(true);
      setActiveWord(-1);

      void (async () => {
        setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

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

            await new Promise<void>((resolve) => {
              let settled = false;
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
                if (status.didJustFinish) done();
              });
              const poll = setInterval(() => {
                let t: number;
                try {
                  t = player.currentTime;
                } catch {
                  return;
                }
                if (typeof t !== "number" || Number.isNaN(t) || t <= 0) return;
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
                  if (index !== lastWord) {
                    lastWord = index;
                    setActiveWord(index);
                  }
                }
              }, POLL_MS);
              settleRef.current = done;
              player.play();
              arm();
            });

            if (tokenRef.current !== token) return;
          }
          // Repeat the whole range while loop is on (read live via the ref).
        } while (loopRef.current && tokenRef.current === token);

        if (tokenRef.current === token) {
          try {
            playerRef.current?.pause();
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

  // Tear the player down when the screen leaves so no poll/interval lingers.
  useEffect(() => {
    return () => {
      tokenRef.current += 1;
      settleRef.current?.();
      try {
        playerRef.current?.remove();
      } catch {
        /* already gone */
      }
      playerRef.current = null;
    };
  }, []);

  return { playingKey, buffering, activeWord, loop, setLoop, playFrom, stop };
}
