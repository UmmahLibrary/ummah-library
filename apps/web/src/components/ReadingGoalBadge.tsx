"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeStreak, goalMet } from "@ummahlibrary/core";
import { READING_EVENT, activeDates, pagesToday, readGoal, today } from "../lib/reading-goals";

/** Home badge: today's streak and progress toward the daily reading goal. */
export function ReadingGoalBadge() {
  const [state, setState] = useState<{ streak: number; pages: number; goal: number } | null>(null);

  useEffect(() => {
    const update = () =>
      setState({
        streak: computeStreak(activeDates(), today()),
        pages: pagesToday(),
        goal: readGoal(),
      });
    update();
    window.addEventListener(READING_EVENT, update);
    return () => window.removeEventListener(READING_EVENT, update);
  }, []);

  if (!state) return null;
  const done = goalMet(state.pages, state.goal);

  return (
    <Link href="/goals" className="reading-badge" title="Reading goals">
      <span className="reading-badge-streak">🔥 {state.streak}</span>
      <span className={done ? "reading-badge-goal reading-badge-goal--done" : "reading-badge-goal"}>
        {done ? "✓ goal met" : `${state.pages}/${state.goal} pages today`}
      </span>
    </Link>
  );
}
