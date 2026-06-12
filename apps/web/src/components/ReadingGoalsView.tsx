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
  readingLog,
  readKhatma,
  today,
  writeGoal,
  writeKhatma,
} from "../lib/reading-goals";
import { N } from "./noor";

const lcard = { background: N.card, border: `1px solid ${N.border}`, borderRadius: 16 } as const;
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

const pillLabel = {
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: N.faint,
  fontWeight: 700,
  fontFamily: N.ui,
} as const;

function pill(active: boolean) {
  return {
    padding: "7px 14px",
    borderRadius: 999,
    border: `1px solid ${active ? N.gold : N.border}`,
    background: active ? N.goldSoft : "transparent",
    color: active ? N.gold : N.muted,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: N.ui,
    textDecoration: "none",
  } as const;
}

/** Pages read on each of the last 7 days (oldest → today), with weekday labels. */
function lastSevenDays(log: Record<string, number>) {
  const out: { label: string; pages: number; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = today(d);
    out.push({ label: DAY_LABELS[d.getDay()]!, pages: log[key] ?? 0, isToday: i === 0 });
  }
  return out;
}

export function ReadingGoalsView() {
  const [goal, setGoal] = useState(4);
  const [streak, setStreak] = useState(0);
  const [pages, setPages] = useState(0);
  const [week, setWeek] = useState<{ label: string; pages: number; isToday: boolean }[]>([]);
  const [khatma, setKhatma] = useState<KhatmaPlan | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setGoal(readGoal());
      setStreak(computeStreak(activeDates(), today()));
      setPages(pagesToday());
      setWeek(lastSevenDays(readingLog()));
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
    const currentPage = Math.min(khatma.totalPages, Math.max(0, khatma.currentPage + deltaPages));
    const plan = { ...khatma, currentPage };
    setKhatma(plan);
    writeKhatma(plan);
  }

  if (!ready) return null;

  const pct = Math.min(1, goal > 0 ? pages / goal : 0);
  const done = goalMet(pages, goal);
  const remaining = Math.max(0, goal - pages);
  const R = 80;
  const C = 2 * Math.PI * R;
  const maxWeek = Math.max(1, ...week.map((d) => d.pages));
  const khatmaPct = khatma
    ? Math.round(progressFraction(khatma.currentPage, khatma.totalPages) * 100)
    : 0;

  return (
    <div>
      {/* Hero: ring + week/streak */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))",
          gap: 16,
        }}
      >
        {/* Circular progress */}
        <div
          style={{
            ...lcard,
            padding: 26,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", width: 200, height: 200 }}>
            <svg
              width="200"
              height="200"
              style={{ transform: "rotate(-90deg)" }}
              aria-hidden="true"
            >
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                strokeWidth="14"
                style={{ stroke: N.border }}
              />
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct)}
                style={{ stroke: N.gold, transition: "stroke-dashoffset .4s ease" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    color: N.gold,
                    letterSpacing: -1.5,
                    fontFamily: N.ui,
                  }}
                >
                  {pages}
                </div>
                <div style={{ fontSize: 13, color: N.faint, fontFamily: N.ui }}>
                  of {goal} pages today
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 14,
              color: N.muted,
              marginTop: 16,
              textAlign: "center",
              fontFamily: N.ui,
            }}
          >
            {done
              ? "Today’s goal met — māshāʾAllāh ✓"
              : `${remaining} page${remaining === 1 ? "" : "s"} to reach today’s goal`}
          </div>
        </div>

        {/* Week + streak */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...lcard, padding: 24 }}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: N.faint,
                fontWeight: 700,
                marginBottom: 16,
                fontFamily: N.ui,
              }}
            >
              This week
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110 }}>
              {week.map((d, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    title={`${d.pages} page${d.pages === 1 ? "" : "s"}`}
                    style={{
                      width: "100%",
                      height: `${Math.max(4, (d.pages / maxWeek) * 84)}px`,
                      background: d.isToday ? N.goldGrad : N.border,
                      borderRadius: 6,
                      transition: "height .3s",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11.5,
                      color: d.isToday ? N.gold : N.faint,
                      fontFamily: N.ui,
                    }}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              ...lcard,
              padding: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: N.gold, fontFamily: N.ui }}>
                {streak} day{streak === 1 ? "" : "s"}
              </div>
              <div style={{ fontSize: 13, color: N.faint, fontFamily: N.ui }}>
                Current streak 🔥
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>
                {khatma ? `${khatmaPct}%` : "—"}
              </div>
              <div style={{ fontSize: 12.5, color: N.faint, fontFamily: N.ui }}>
                {khatma ? "to khatm" : "no khatma yet"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Light controls — the design dashboard shows the goal/khatma as already set;
          we keep them adjustable here without competing with the hero. */}
      <div
        style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
      >
        <span style={pillLabel}>Daily goal</span>
        {[2, 4, 8, 16, 20].map((n) => (
          <button key={n} onClick={() => changeGoal(n)} style={pill(n === goal)}>
            {n} pages
          </button>
        ))}
      </div>

      <div
        style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
      >
        <span style={pillLabel}>Khatma</span>
        {!khatma ? (
          [30, 60, 90].map((d) => (
            <button key={d} onClick={() => startKhatma(d)} style={pill(false)}>
              {d} days
            </button>
          ))
        ) : (
          <>
            <span style={{ fontSize: 13, color: N.muted, fontFamily: N.ui }}>
              Page <strong style={{ color: N.fg }}>{khatma.currentPage}</strong>/{khatma.totalPages}{" "}
              · {Math.max(0, daysBetween(today(), khatma.targetDate))}d left ·{" "}
              <strong style={{ color: N.fg }}>{khatmaDailyTarget(khatma, today())}</strong>/day
            </span>
            <Link
              href={`/page/${Math.min(khatma.totalPages, khatma.currentPage + 1)}`}
              style={pill(true)}
            >
              Resume p{Math.min(khatma.totalPages, khatma.currentPage + 1)}
            </Link>
            <button onClick={() => adjustKhatma(1)} style={pill(false)}>
              +1
            </button>
            <button onClick={() => adjustKhatma(-1)} style={pill(false)}>
              −1
            </button>
            <button onClick={clearKhatma} style={pill(false)}>
              Clear
            </button>
          </>
        )}
      </div>

      <p
        style={{
          fontSize: 12.5,
          color: N.faint,
          lineHeight: 1.6,
          margin: "16px 0 0",
          fontFamily: N.ui,
        }}
      >
        Pages you read in the{" "}
        <Link href="/page/1" style={{ color: N.gold, fontWeight: 600 }}>
          Mushaf view
        </Link>{" "}
        count automatically — reading anywhere keeps your streak.
      </p>
    </div>
  );
}
