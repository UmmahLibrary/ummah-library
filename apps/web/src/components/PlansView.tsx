"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  type ActivePlan,
  type DayPortion,
  type PlanTemplate,
  type ScheduleStrategy,
  PLAN_TEMPLATES,
  activatePlan,
  catchUpPortion,
  computeTodayPortion,
  currentDay,
  daysAheadBehind,
  isDayComplete,
  isPlanComplete,
  percentComplete,
  planDuration,
  planEndDate,
  planWeekWindow,
  rangeOfPages,
  validatePlanDraft,
} from "@ummahlibrary/core";
import { N, Khatam, Icon, Seg } from "@ummahlibrary/ui";
import { PlanReminderToggle } from "./PlanReminderToggle";
import { PlanCompletionCard } from "./PlanCompletionCard";
import {
  READING_PLAN_EVENT,
  clearPlan,
  extendPlanBy,
  readActivePlan,
  rebalancePlan,
  resumePlan,
  startCustomPlan,
  startPlan,
  todayStr,
  toggleDay,
} from "../lib/reading-plan";

const R = 30;
const C = 2 * Math.PI * R;

function targetHref(p: DayPortion): string {
  switch (p.target.kind) {
    case "juz":
      return `/juz/${p.target.juz}`;
    case "surah":
      return `/surah/${p.target.surah}`;
    default:
      return `/surah/${p.startRef.sura}`;
  }
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
 *  Noor design. The catalogue + pure schedule maths live in core; persistence
 *  is local. */
export function PlansView() {
  const [plan, setPlan] = useState<ActivePlan | null>(null);
  const [ready, setReady] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [mode, setMode] = useState<"date" | "pace">("date");
  const [endDate, setEndDate] = useState("");
  const [perDay, setPerDay] = useState("2");

  useEffect(() => {
    const refresh = () => {
      void readActivePlan().then((p) => {
        setPlan(p);
        setReady(true);
      });
    };
    refresh();
    window.addEventListener(READING_PLAN_EVENT, refresh);
    return () => window.removeEventListener(READING_PLAN_EVENT, refresh);
  }, []);

  const today = todayStr();
  // While paused the clock is frozen at the pause day (#68), so a break never
  // reads as "behind". The custom creator below still uses the real `today`.
  const viewToday = plan?.pausedOn ?? today;
  const paused = !!plan?.pausedOn;
  const totalDays = plan ? planDuration(plan) : 0;
  const day = plan ? currentDay(plan, viewToday) : 0;
  const portion = plan ? computeTodayPortion(plan, viewToday) : undefined;
  const pct = plan ? percentComplete(plan) : 0;
  const behind = plan ? daysAheadBehind(plan, viewToday) : 0;
  const catchUp = plan ? catchUpPortion(plan, viewToday) : undefined;

  // Custom plan draft — whole Quran by pages; validate + preview the pace live.
  const customRange = rangeOfPages(1, 604);
  const customSchedule: ScheduleStrategy =
    mode === "date"
      ? { kind: "targetDate", endDate }
      : { kind: "fixed", unitsPerDay: Number(perDay) || 0 };
  const customErrors = validatePlanDraft({ range: customRange, schedule: customSchedule, startDate: today });
  const customPreview =
    customErrors.length === 0
      ? (() => {
          const draft = activatePlan(
            { id: "custom", name: "", tag: "", len: "", desc: "", range: customRange, schedule: customSchedule },
            today,
          );
          const days = planDuration(draft);
          return { days, end: planEndDate(draft), perDay: Math.ceil(customRange.units.length / days) };
        })()
      : null;

  function createCustom() {
    if (!customPreview) return;
    const template: PlanTemplate = {
      id: "custom",
      name: "Your plan",
      tag: `${customPreview.days} days`,
      len: mode === "date" ? `≈ ${customPreview.perDay} pages a day` : `${perDay} pages a day`,
      desc:
        mode === "date"
          ? `Finish the Quran by ${customPreview.end}.`
          : `${perDay} pages a day through the whole Quran.`,
      range: customRange,
      schedule: customSchedule,
    };
    void startCustomPlan(template);
    setCustomOpen(false);
  }

  if (!ready) return <div style={{ minHeight: 240 }} />;

  return (
    <div>
      {plan && isPlanComplete(plan) && <PlanCompletionCard plan={plan} />}

      {plan && portion && !isPlanComplete(plan) && (
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
                    {paused ? "⏸ Paused" : "Active"} · Day {day} of {totalDays}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: N.fg, fontFamily: N.ui }}>
                    {plan.template.name}
                  </div>
                  <div style={{ fontSize: 13.5, color: N.muted, marginTop: 3, fontFamily: N.ui }}>
                    Today: <span style={{ color: N.fg, fontWeight: 600 }}>{portion.label}</span> · {portion.est}
                  </div>
                </div>
              </div>
              <Link
                href={targetHref(portion)}
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
              onClick={() => void toggleDay(day)}
              className="noor-press"
              style={{
                padding: "9px 16px",
                borderRadius: 999,
                border: `1px solid ${isDayComplete(plan, day) ? N.gold : N.border}`,
                background: isDayComplete(plan, day) ? N.goldSoft : N.card,
                color: isDayComplete(plan, day) ? N.gold : N.muted,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: N.ui,
              }}
            >
              {isDayComplete(plan, day) ? "✓ Day done" : `Mark Day ${day} done`}
            </button>
            <button
              type="button"
              onClick={() => void clearPlan()}
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
            {paused && (
              <button
                type="button"
                onClick={() => void resumePlan()}
                className="noor-press"
                style={{
                  padding: "9px 16px",
                  borderRadius: 999,
                  border: `1px solid ${N.gold}`,
                  background: N.goldSoft,
                  color: N.gold,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: N.ui,
                }}
              >
                ▶ Resume
              </button>
            )}
            <Link
              href={`/plans/${plan.template.id}`}
              className="noor-press"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "9px 16px",
                borderRadius: 999,
                border: `1px solid ${N.border}`,
                background: N.card,
                color: N.muted,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: N.ui,
                textDecoration: "none",
              }}
            >
              Details →
            </Link>
          </div>

          {/* Behind-state + recovery (#70) */}
          {behind < 0 && catchUp && (
            <div
              style={{
                marginTop: 14,
                padding: 16,
                borderRadius: 14,
                border: `1px solid ${N.gold}`,
                background: N.goldSoft,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>
                You’re {Math.abs(behind)} {Math.abs(behind) === 1 ? "day" : "days"} behind
              </div>
              <div style={{ fontSize: 13, color: N.muted, fontFamily: N.ui, margin: "4px 0 12px" }}>
                Catch up on the backlog, re-pace to keep your finish date, or give yourself more time.
              </div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                <Link
                  href={targetHref(catchUp)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "9px 16px",
                    borderRadius: 999,
                    background: N.goldGrad,
                    color: N.ink,
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "none",
                    fontFamily: N.ui,
                  }}
                >
                  <Icon name="book" size={15} color={N.ink} sw={1.8} /> Catch up · {catchUp.label}
                </Link>
                <button type="button" onClick={() => void rebalancePlan()} className="noor-press" style={repaceBtn}>
                  Rebalance
                </button>
                <button type="button" onClick={() => void extendPlanBy(7)} className="noor-press" style={repaceBtn}>
                  Extend +1 week
                </button>
              </div>
            </div>
          )}

          {/* This week */}
          <div style={sectionLabel}>This week</div>
          <div style={{ display: "flex", gap: 8 }}>
            {planWeekWindow(plan, day).map((n) => {
              const done = isDayComplete(plan, n);
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

          <PlanReminderToggle />
        </>
      )}

      {ready && !plan && (
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
        {PLAN_TEMPLATES.map((pl) => {
          const isActive = plan?.template.id === pl.id;
          const plPct = isActive ? pct : 0;
          const done = plPct >= 100;
          return (
            <button
              key={pl.id}
              type="button"
              onClick={() => {
                if (isActive && portion) window.location.href = targetHref(portion);
                else void startPlan(pl.id);
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

      {/* Create your own */}
      <div style={sectionLabel}>Create your own</div>
      {!customOpen ? (
        <button
          type="button"
          onClick={() => setCustomOpen(true)}
          className="noor-press"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 16,
            borderRadius: 14,
            border: `1px dashed ${N.border}`,
            background: N.card,
            color: N.gold,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: N.ui,
            cursor: "pointer",
          }}
        >
          <Icon name="plus" size={16} color={N.gold} sw={2} /> Create a custom plan
        </button>
      ) : (
        <div style={{ border: `1px solid ${N.border}`, borderRadius: 14, padding: 18, background: N.card }}>
          <Seg
            options={[
              { value: "date", label: "By date" },
              { value: "pace", label: "Pages a day" },
            ]}
            value={mode}
            onChange={(v) => setMode(v as "date" | "pace")}
            size="sm"
          />
          <label style={{ display: "block", marginTop: 14 }}>
            <span style={{ fontSize: 13, color: N.muted, fontFamily: N.ui }}>
              {mode === "date" ? "Finish the Quran by" : "Pages a day"}
            </span>
            {mode === "date" ? (
              <input
                type="date"
                min={today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyle}
              />
            ) : (
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={perDay}
                onChange={(e) => setPerDay(e.target.value)}
                style={inputStyle}
              />
            )}
          </label>

          <div style={{ marginTop: 12, minHeight: 20, fontSize: 13, fontFamily: N.ui }}>
            {customPreview ? (
              <span style={{ color: N.muted }}>
                {mode === "date" ? (
                  <>
                    ≈ <span style={{ color: N.fg, fontWeight: 600 }}>{customPreview.perDay} pages a day</span> ·{" "}
                    {customPreview.days} days
                  </>
                ) : (
                  <>
                    <span style={{ color: N.fg, fontWeight: 600 }}>{customPreview.days} days</span> · finishes{" "}
                    {customPreview.end}
                  </>
                )}
              </span>
            ) : (
              <span style={{ color: N.goldDim }}>{customErrors[0]}</span>
            )}
          </div>

          <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
            <button
              type="button"
              disabled={!customPreview}
              onClick={createCustom}
              className="noor-press"
              style={{
                padding: "10px 18px",
                borderRadius: 11,
                background: customPreview ? N.goldGrad : N.card,
                color: customPreview ? N.ink : N.faint,
                border: `1px solid ${customPreview ? "transparent" : N.border}`,
                fontWeight: 700,
                fontSize: 14,
                fontFamily: N.ui,
                cursor: customPreview ? "pointer" : "not-allowed",
              }}
            >
              Start plan
            </button>
            <button
              type="button"
              onClick={() => setCustomOpen(false)}
              className="noor-press"
              style={{
                padding: "10px 16px",
                borderRadius: 11,
                background: N.card,
                color: N.muted,
                border: `1px solid ${N.border}`,
                fontWeight: 600,
                fontSize: 14,
                fontFamily: N.ui,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: "11px 14px",
  borderRadius: 10,
  border: `1px solid ${N.border}`,
  background: N.cardHi,
  color: N.fg,
  fontFamily: N.ui,
  fontSize: 15,
  boxSizing: "border-box",
} as const;

const repaceBtn = {
  padding: "9px 16px",
  borderRadius: 999,
  border: `1px solid ${N.border}`,
  background: N.card,
  color: N.muted,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: N.ui,
  cursor: "pointer",
} as const;
