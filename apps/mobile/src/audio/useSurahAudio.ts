/**
 * Sequential ayah recitation with word-by-word highlighting, built on
 * expo-audio. For reciters that have quran.com word timings (`quranComId`) we
 * play quran.com's audio so the segment timings line up, and highlight the
 * current word from `player.currentTime`; otherwise we fall back to the
 * reciter's own per-ayah MP3 (no word sync). A stall watchdog skips an ayah that
 * makes no progress within STALL_MS so a flaky connection degrades gracefully.
 */
import { useCallback, useRef, useState } from "react";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { reciterAudioUrl, type ReciterPlugin, type VerseKey } from "@ummahlibrary/core";

const STALL_MS = 8000;

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
  playFrom: (verses: VerseKey[], start: VerseKey, advance: boolean) => void;
  stop: () => void;
}

export function useSurahAudio(reciter: ReciterPlugin): SurahAudio {
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [activeWord, setActiveWord] = useState(-1);

  const playerRef = useRef<AudioPlayer | null>(null);
  const tokenRef = useRef(0);
  const settleRef = useRef<(() => void) | null>(null);

  const release = useCallback((player: AudioPlayer | null) => {
    if (player) {
      try {
        player.remove();
      } catch {
        /* already released */
      }
    }
  }, []);

  const stop = useCallback(() => {
    tokenRef.current += 1;
    settleRef.current?.();
    setPlayingKey(null);
    setBuffering(false);
    setActiveWord(-1);
    const player = playerRef.current;
    playerRef.current = null;
    release(player);
  }, [release]);

  const playFrom = useCallback(
    (verses: VerseKey[], start: VerseKey, advance: boolean) => {
      const startIdx = verses.findIndex((v) => v.sura === start.sura && v.aya === start.aya);
      if (startIdx < 0) return;
      const queue = advance ? verses.slice(startIdx) : [verses[startIdx]!];
      const token = ++tokenRef.current;

      void (async () => {
        setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
        release(playerRef.current);
        playerRef.current = null;

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

          const player = createAudioPlayer({ uri: src });
          playerRef.current = player;
          player.play();

          await new Promise<void>((resolve) => {
            let settled = false;
            let lastTime = -1;
            let lastWord = -1;
            let timer: ReturnType<typeof setTimeout>;
            const done = () => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              sub.remove();
              settleRef.current = null;
              resolve();
            };
            const arm = () => {
              clearTimeout(timer);
              timer = setTimeout(done, STALL_MS);
            };
            const sub = player.addListener("playbackStatusUpdate", (status) => {
              if (status.didJustFinish) {
                done();
                return;
              }
              if (status.playing && status.currentTime > 0) {
                setBuffering(false);
                if (status.currentTime !== lastTime) {
                  lastTime = status.currentTime;
                  arm();
                }
                if (segments) {
                  const ms = status.currentTime * 1000;
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
              }
            });
            settleRef.current = done;
            arm();
          });

          release(player);
          if (tokenRef.current !== token) return;
        }
        if (tokenRef.current === token) {
          setPlayingKey(null);
          setBuffering(false);
          setActiveWord(-1);
        }
      })();
    },
    [reciter, release],
  );

  return { playingKey, buffering, activeWord, playFrom, stop };
}
