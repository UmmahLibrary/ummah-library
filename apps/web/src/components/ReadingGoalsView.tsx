"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  type KhatmaPlan,
  TOTAL_PAGES_MADANI,
  addDays,
  computeStreak,
  daysBetween,
  goalMet,
  khatmaDailyTarget,
  progressFraction,
} from "@ummahlibrary/core";
import {
  READING_EVENT,
  activeDates,
  clearKhatma,
  pagesToday,
  readGoal,
  readKhatma,
  today,
  writeGoal,
  writeKhatma,
} from "../lib/reading-goals";

export function ReadingGoalsView() {
  const [goal, setGoal] = useState(4);
  const [streak, setStreak] = useState(0);
  const [pages, setPages] = useState(0);
  const [khatma, setKhatma] = useState<KhatmaPlan | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setGoal(readGoal());
      setStreak(computeStreak(activeDates(), today()));
      setPages(pagesToday());
      setKhatma(readKhatma());
    };
    refresh();
    setReady(true);
    window.addEventListener(READING_EVENT, refresh);
    return () => window.removeEventListener(READING_EVENT, refresh);
  }, []);

  function changeGoal(next: number) {
    setGoal(next);
    writeGoal(next);
  }

  function startKhatma(days: number) {
    const plan: KhatmaPlan = {
      totalPages: TOTAL_PAGES_MADANI,
      currentPage: khatma?.currentPage ?? 0,
      targetDate: addDays(today(), days),
    };
    setKhatma(plan);
    writeKhatma(plan);
  }

  function adjustKhatma(deltaPages: number) {
    if (!khatma) return;
    const currentPage = Math.min(
      khatma.totalPages,
      Math.max(0, khatma.currentPage + deltaPages),
    );
    const plan = { ...khatma, currentPage };
    setKhatma(plan);
    writeKhatma(plan);
  }

  if (!ready) return null;

  const goalDone = goalMet(pages, goal);

  return (
    <div className="goals">
      <div className={goalDone ? "goal-hero goal-hero--done" : "goal-hero"}>
        <div className="goal-streak">
          <span className="goal-streak-num">🔥 {streak}</span>
          <span className="goal-streak-label">day{streak === 1 ? "" : "s"} streak</span>
        </div>
        <div className="goal-today">
          <div className="goal-bar">
            <span style={{ width: `${progressFraction(pages, goal) * 100}%` }} />
          </div>
          <span className="goal-today-label">
            {goalDone ? "Today’s goal met ✓" : `${pages} / ${goal} pages today`}
          </span>
        </div>
      </div>

      <fieldset className="zakat-group">
        <legend>Daily goal</legend>
        <div className="hijri-adjust-row">
          {[2, 4, 8, 16, 20].map((n) => (
            <button
              key={n}
              type="button"
              className={n === goal ? "chip chip--active" : "chip"}
              onClick={() => changeGoal(n)}
            >
              {n} pages
            </button>
          ))}
        </div>
        <p className="hifz-muted goal-note">
          Pages you read in the <Link href="/page/1">Mushaf view</Link> count automatically. Reading
          anywhere keeps your streak.
        </p>
      </fieldset>

      <fieldset className="zakat-group">
        <legend>Khatma planner</legend>
        {!khatma ? (
          <>
            <p className="hifz-muted goal-note">Finish the whole Quran by a date — pick a pace:</p>
            <div className="hijri-adjust-row">
              {[
                { label: "30 days", days: 30 },
                { label: "60 days", days: 60 },
                { label: "90 days", days: 90 },
              ].map((o) => (
                <button key={o.days} type="button" className="chip" onClick={() => startKhatma(o.days)}>
                  {o.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="khatma">
            <div className="goal-bar">
              <span style={{ width: `${progressFraction(khatma.currentPage, khatma.totalPages) * 100}%` }} />
            </div>
            <p className="khatma-stat">
              Page <strong>{khatma.currentPage}</strong> of {khatma.totalPages} ·{" "}
              {Math.max(0, daysBetween(today(), khatma.targetDate))} days left ·{" "}
              <strong>{khatmaDailyTarget(khatma, today())}</strong> pages/day to stay on track
            </p>
            <div className="prayer-controls">
              <Link href={`/page/${Math.min(khatma.totalPages, khatma.currentPage + 1)}`} className="chip">
                Resume at page {Math.min(khatma.totalPages, khatma.currentPage + 1)}
              </Link>
              <button type="button" className="chip" onClick={() => adjustKhatma(-1)}>
                −1 page
              </button>
              <button type="button" className="chip" onClick={() => adjustKhatma(1)}>
                +1 page
              </button>
              <button type="button" className="chip" onClick={clearKhatma}>
                Clear plan
              </button>
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}
