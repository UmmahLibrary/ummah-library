"use client";

import { useEffect, useRef, useState } from "react";
import { type ReciterPlugin, reciterAudioUrl } from "@ummahlibrary/core";

const RECITER_KEY = "ul.reciter";

export function SurahAudio({
  surah,
  ayahCount,
  reciters,
}: {
  surah: number;
  ayahCount: number;
  reciters: ReciterPlugin[];
}) {
  const [reciterId, setReciterId] = useState(reciters[0]?.id ?? "");
  const [current, setCurrent] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(RECITER_KEY);
    if (saved && reciters.some((r) => r.id === saved)) setReciterId(saved);
  }, [reciters]);

  function highlight(aya: number | null) {
    document
      .querySelectorAll(".ayah--playing")
      .forEach((el) => el.classList.remove("ayah--playing"));
    if (aya === null) return;
    const el = document.getElementById(`${surah}:${aya}`);
    el?.classList.add("ayah--playing");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function stop() {
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrent(null);
    highlight(null);
  }

  // The reciter is read at call time so handlers stay correct after a change.
  function playFrom(aya: number) {
    const reciter = reciters.find((r) => r.id === reciterId) ?? reciters[0];
    if (!reciter || aya < 1 || aya > ayahCount) {
      stop();
      return;
    }
    const audio = (audioRef.current ??= new Audio());
    audio.src = reciterAudioUrl(reciter, { sura: surah, aya });
    audio.onended = () => playFrom(aya + 1);
    audio.onerror = () => stop();
    void audio.play().then(
      () => {
        setCurrent(aya);
        setIsPlaying(true);
        highlight(aya);
      },
      () => stop(),
    );
  }

  function toggle() {
    const audio = audioRef.current;
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else if (current !== null && audio) {
      void audio.play();
      setIsPlaying(true);
    } else {
      playFrom(1);
    }
  }

  // Delegate clicks on per-ayah play buttons to start there.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-play-aya]");
      if (!target) return;
      event.preventDefault();
      playFrom(Number(target.dataset.playAya));
    }
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      audioRef.current?.pause();
    };
  }, [reciterId, surah, ayahCount]);

  if (reciters.length === 0) return null;

  return (
    <div className="audio-bar">
      <button type="button" className="audio-play" onClick={toggle} aria-pressed={isPlaying}>
        {isPlaying ? "❚❚ Pause" : "▶ Play surah"}
      </button>
      <span className="audio-status" aria-live="polite">
        {current !== null ? `Playing āyah ${current}` : "Tap an āyah number to play"}
      </span>
      {reciters.length > 1 && (
        <select
          className="audio-reciter"
          aria-label="Reciter"
          value={reciterId}
          onChange={(e) => {
            setReciterId(e.target.value);
            localStorage.setItem(RECITER_KEY, e.target.value);
            stop();
          }}
        >
          {reciters.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
