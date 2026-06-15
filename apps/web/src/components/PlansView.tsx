"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  type DayTarget,
  PLANS,
  type PlanProgress,
  currentPlanDay,
  planById,
  planPercent,
  planWeekWindow,
} from "@ummahlibrary/core";
import { N, Khatam, Icon } from "@ummahlibrary/ui";
import { READING_PLAN_EVENT, clearPlan, readPlanProgress, startPlan, toggleDay } from "../lib/reading-plan";

const R = 30;
const C = 2 * Math.PI * R;

function targetHref(t: DayTarget): string {
  return t.kind === "juz" ? `/juz/${t.juz}` : `/surah/${t.surah}`;
}

const sectionLabel = {
  fontSize: 12,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: N.faint,
  fontWeight: 700,
  fontFamily: N.ui,
  margin: "26px 0 12px",
} as const;

/** Reading plans — structured journeys, mirroring the mobile screen and the
 *  Noor design. Definitions + pure progress live in core; persistence is local. */
export function PlansView() {
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => setProgress(readPlanProgress());
    refresh();
    setReady(true);
    window.addEventListener(READING_PLAN_EVENT, refresh);
    return () => window.removeEventListener(READING_PLAN_EVENT, refresh);
  }, []);

  const active = progress ? planById(progress.planId) : undefined;
  const day = active && progress ? currentPlanDay(active, progress) : 0;
  const todayDay = active ? active.days[day - 1] : undefined;
  const pct = active && progress ? planPercent(active, progress) : 0;

  if (!ready) return <div style={{ minHeight: 240 }} />;

  return (
    <div>
      {active && progress && todayDay && (
        <>
          {/* Active plan */}
          <div
            style={{
              borderRadius: 16,
              padding: 24,
              background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`,
              border: `1px solid ${N.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div aria-hidden="true" style={{ position: "absolute", right: -30, top: -30, pointerEvents: "none" }}>
              <Khatam size={150} color={N.gold} sw={1.1} opacity={0.08} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
                <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                  <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
                    <circle cx="36" cy="36" r={R} fill="none" strokeWidth="7" style={{ stroke: N.border }} />
                    <circle
                      cx="36"
                      cy="36"
                      r={R}
                      fill="none"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={C}
                      strokeDashoffset={C * (1 - pct / 100)}
                      style={{ stroke: N.gold, transition: "stroke-dashoffset .4s ease" }}
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 16,
                      fontWeight: 800,
                      color: N.gold,
                      fontFamily: N.ui,
                    }}
                  >
                    {pct}%
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11.5,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      color: N.faint,
                      fontWeight: 700,
                      fontFamily: N.ui,
                    }}
                  >
                    Active · Day {day} of {active.days.length}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: N.fg, fontFamily: N.ui }}>
                    {active.name}
                  </div>
                  <div style={{ fontSize: 13.5, color: N.muted, marginTop: 3, fontFamily: N.ui }}>
                    Today: <span style={{ color: N.fg, fontWeight: 600 }}>{todayDay.label}</span> · {todayDay.est}
                  </div>
                </div>
              </div>
              <Link
                href={targetHref(todayDay.target)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 18px",
                  borderRadius: 11,
                  background: N.goldGrad,
                  color: N.ink,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  fontFamily: N.ui,
                  flexShrink: 0,
                }}
              >
                <Icon name="book" size={16} color={N.ink} sw={1.8} /> Read today
              </Link>
            </div>
          </div>

          {/* Day controls */}
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 14 }}>
            <button
              type="button"
              onClick={() => toggleDay(day - 1)}
              className="noor-press"
              style={{
                padding: "9px 16px",
                borderRadius: 999,
                border: `1px solid ${progress.completed.includes(day - 1) ? N.gold : N.border}`,
                background: progress.completed.includes(day - 1) ? N.goldSoft : N.card,
                color: progress.completed.includes(day - 1) ? N.gold : N.muted,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: N.ui,
              }}
            >
              {progress.completed.includes(day - 1) ? "✓ Day done" : `Mark Day ${day} done`}
            </button>
            <button
              type="button"
              onClick={() => clearPlan()}
              className="noor-press"
              style={{
                padding: "9px 16px",
                borderRadius: 999,
                border: `1px solid ${N.border}`,
                background: N.card,
                color: N.muted,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: N.ui,
              }}
            >
              Leave plan
            </button>
          </div>

          {/* This week */}
          <div style={sectionLabel}>This week</div>
          <div style={{ display: "flex", gap: 8 }}>
            {planWeekWindow(active, day).map((n) => {
              const done = progress.completed.includes(n - 1);
              const isToday = n === day;
              return (
                <div
                  key={n}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 4px",
                    borderRadius: 12,
                    border: `1px solid ${isToday ? N.gold : N.border}`,
                    background: isToday ? N.goldSoft : N.card,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: isToday ? N.gold : N.faint, fontFamily: N.ui }}>
                    D{n}
                  </span>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      display: "grid",
                      placeItems: "center",
                      background: done ? N.goldGrad : "transparent",
                      border: `1px solid ${done ? N.gold : N.border}`,
                      color: done ? N.ink : N.faint,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {done ? <Icon name="check" size={13} color={N.ink} sw={2} /> : n}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {ready && !active && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            padding: "40px 20px",
            border: `1px solid ${N.border}`,
            borderRadius: 16,
            background: N.card,
          }}
        >
          <Khatam size={56} color={N.goldDim} sw={1.2} />
          <div style={{ fontSize: 15, color: N.muted, textAlign: "center", maxWidth: 360, fontFamily: N.ui }}>
            No active plan yet. Choose one below to begin a journey through the Book.
          </div>
        </div>
      )}

      {/* Browse plans */}
      <div style={sectionLabel}>Browse plans</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {PLANS.map((pl) => {
          const isActive = active?.id === pl.id;
          const plPct = isActive ? pct : 0;
          const done = plPct >= 100;
          return (
            <button
              key={pl.id}
              type="button"
              onClick={() => {
                if (isActive && todayDay) window.location.href = targetHref(todayDay.target);
                else startPlan(pl.id);
              }}
              className="noor-press"
              style={{
                textAlign: "left",
                background: N.card,
                border: `1px solid ${isActive ? N.gold : N.border}`,
                borderRadius: 14,
                padding: 18,
                cursor: "pointer",
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: N.gold,
                    background: N.goldSoft,
                    border: `1px solid ${N.border}`,
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontFamily: N.ui,
                  }}
                >
                  {pl.tag}
                </span>
                <span style={{ fontSize: 12, color: N.faint, fontFamily: N.ui }}>{pl.len}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>{pl.name}</div>
              <div style={{ fontSize: 13, color: N.muted, lineHeight: 1.5, marginTop: 5, fontFamily: N.ui }}>
                {pl.desc}
              </div>
              {isActive ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ height: 5, borderRadius: 3, background: N.border, overflow: "hidden" }}>
                    <div style={{ width: `${plPct}%`, height: "100%", background: N.goldGrad }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
                    <span style={{ fontSize: 12, color: N.faint, fontFamily: N.ui }}>
                      {done ? "Completed" : "In progress"}
                    </span>
                    <span style={{ fontSize: 12, color: N.gold, fontWeight: 600, fontFamily: N.ui }}>Continue →</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14 }}>
                  <Icon name="plus" size={15} color={N.gold} sw={2} />
                  <span style={{ fontSize: 13, color: N.gold, fontWeight: 600, fontFamily: N.ui }}>Start plan</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
