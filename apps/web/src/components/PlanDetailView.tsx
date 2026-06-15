"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ActivePlan,
  type DayPortion,
  computeTodayPortion,
  currentDay,
  daysAheadBehind,
  effectiveToday,
  isDayComplete,
  isPaused,
  isPlanComplete,
  percentComplete,
  planDuration,
  planEndDate,
  templateById,
} from "@ummahlibrary/core";
import { N, Khatam, Icon } from "@ummahlibrary/ui";
import { PlanCompletionCard } from "./PlanCompletionCard";
import {
  READING_PLAN_EVENT,
  clearPlan,
  extendPlanBy,
  pausePlan,
  readActivePlan,
  rebalancePlan,
  resumePlan,
  startPlan,
  todayStr,
} from "../lib/reading-plan";

const RING = 52;
const CIRC = 2 * Math.PI * RING;

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

const actionBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 14px",
  borderRadius: 12,
  border: `1px solid ${N.border}`,
  background: N.card,
  color: N.fg,
  fontFamily: N.ui,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
} as const;

export function PlanDetailView({ templateId }: { templateId: string }) {
  const [plan, setPlan] = useState<ActivePlan | null>(null);
  const [ready, setReady] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const refresh = () =>
      void readActivePlan().then((p) => {
        setPlan(p);
        setReady(true);
      });
    refresh();
    window.addEventListener(READING_PLAN_EVENT, refresh);
    return () => window.removeEventListener(READING_PLAN_EVENT, refresh);
  }, []);

  if (!ready) return null;

  const template = templateById(templateId);
  const isActive = !!plan && plan.template.id === templateId;

  // ── Active plan: the rich detail ──────────────────────────────────────────
  if (isActive && plan) {
    const paused = isPaused(plan);
    const today = effectiveToday(plan, todayStr());
    const total = planDuration(plan);
    const day = currentDay(plan, today);
    const pct = percentComplete(plan);
    const behind = daysAheadBehind(plan, today);
    const portion = computeTodayPortion(plan, today);

    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "8px 0 60px" }}>
        <Link href="/plans" style={{ color: N.muted, fontSize: 13, fontFamily: N.ui, textDecoration: "none" }}>
          ← All plans
        </Link>

        {isPlanComplete(plan) && (
          <div style={{ marginTop: 16 }}>
            <PlanCompletionCard plan={plan} />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "18px 0 22px" }}>
          <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
            <svg width={140} height={140} viewBox="0 0 140 140">
              <circle cx={70} cy={70} r={RING} fill="none" stroke={N.border} strokeWidth={10} />
              <circle
                cx={70}
                cy={70}
                r={RING}
                fill="none"
                stroke={N.gold}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - pct / 100)}
                transform="rotate(-90 70 70)"
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
                <div style={{ fontSize: 28, fontWeight: 800, color: N.fg, fontFamily: N.ui }}>{pct}%</div>
                <div style={{ fontSize: 12, color: N.faint, fontFamily: N.ui }}>
                  Day {day} of {total}
                </div>
              </div>
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Khatam size={26} color={N.gold} sw={1} opacity={0.7} />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: N.fg, fontFamily: N.ui }}>
                {plan.template.name}
              </h1>
            </div>
            <p style={{ margin: "6px 0 0", color: N.muted, fontSize: 13.5, fontFamily: N.ui }}>
              {plan.template.tag} · ends {planEndDate(plan)}
            </p>
            {paused && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: N.cardHi,
                  border: `1px solid ${N.border}`,
                  color: N.muted,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: N.ui,
                }}
              >
                ⏸ Paused
              </span>
            )}
          </div>
        </div>

        {/* Today's portion / paused notice */}
        {paused ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              padding: 16,
              borderRadius: 14,
              border: `1px solid ${N.border}`,
              background: N.card,
            }}
          >
            <span style={{ color: N.muted, fontSize: 13.5, fontFamily: N.ui }}>
              Paused on {plan.pausedOn}. Your place is held — resume any time.
            </span>
            <button type="button" className="noor-press" style={{ ...actionBtn, borderColor: N.gold, color: N.gold }} onClick={() => void resumePlan()}>
              <Icon name="play" size={14} color={N.gold} /> Resume
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              padding: 16,
              borderRadius: 14,
              border: `1px solid ${N.gold}`,
              background: N.goldSoft,
            }}
          >
            <div>
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: N.gold, fontWeight: 700, fontFamily: N.ui }}>
                Today
              </div>
              <div style={{ marginTop: 4, color: N.fg, fontSize: 15, fontWeight: 600, fontFamily: N.ui }}>{portion.label}</div>
            </div>
            <Link
              href={targetHref(portion)}
              className="noor-press"
              style={{ ...actionBtn, background: N.goldGrad, border: "none", color: N.ink, textDecoration: "none" }}
            >
              <Icon name="book" size={15} color={N.ink} sw={1.8} /> Read now
            </Link>
          </div>
        )}

        {!paused && behind < 0 && (
          <p style={{ marginTop: 12, color: N.muted, fontSize: 13, fontFamily: N.ui }}>
            You’re {Math.abs(behind)} {Math.abs(behind) === 1 ? "day" : "days"} behind — re-pace below to catch up gently.
          </p>
        )}

        {/* Heatmap */}
        <h2 style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint, fontWeight: 700, fontFamily: N.ui, margin: "28px 0 12px" }}>
          Your days
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(16px, 1fr))", gap: 5 }}>
          {Array.from({ length: total }, (_, i) => i + 1).map((d) => {
            const done = isDayComplete(plan, d);
            const isToday = d === day;
            const missed = d < day && !done;
            const bg = done ? N.gold : missed ? N.cardHi : "transparent";
            const border = isToday ? N.gold : done ? N.gold : N.border;
            return (
              <div
                key={d}
                title={`Day ${d}${done ? " · done" : missed ? " · missed" : isToday ? " · today" : ""}`}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: 4,
                  background: bg,
                  border: `1px solid ${border}`,
                  boxShadow: isToday ? `0 0 0 2px ${N.goldSoft}` : "none",
                }}
              />
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, color: N.faint, fontSize: 11.5, fontFamily: N.ui }}>
          <Legend swatch={N.gold} label="Done" />
          <Legend swatch={N.cardHi} label="Missed" />
          <Legend swatch="transparent" label="Upcoming" />
        </div>

        {/* Actions */}
        <h2 style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint, fontWeight: 700, fontFamily: N.ui, margin: "28px 0 12px" }}>
          Manage
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" className="noor-press" style={actionBtn} onClick={() => void rebalancePlan()}>
            <Icon name="repeat" size={14} color={N.fg} sw={1.8} /> Re-pace (keep end date)
          </button>
          <button type="button" className="noor-press" style={actionBtn} onClick={() => void extendPlanBy(7)}>
            <Icon name="plus" size={14} color={N.fg} sw={1.8} /> Extend +1 week
          </button>
          {paused ? (
            <button type="button" className="noor-press" style={actionBtn} onClick={() => void resumePlan()}>
              <Icon name="play" size={14} color={N.fg} /> Resume
            </button>
          ) : (
            <button type="button" className="noor-press" style={actionBtn} onClick={() => void pausePlan()}>
              <Icon name="pause" size={14} color={N.fg} /> Pause
            </button>
          )}
          {confirmAbandon ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: N.muted, fontSize: 13, fontFamily: N.ui }}>Abandon this plan?</span>
              <button
                type="button"
                className="noor-press"
                style={{ ...actionBtn, background: N.cardHi, color: N.fg }}
                onClick={() => {
                  void clearPlan();
                  router.push("/plans");
                }}
              >
                Yes, abandon
              </button>
              <button type="button" className="noor-press" style={actionBtn} onClick={() => setConfirmAbandon(false)}>
                Keep
              </button>
            </span>
          ) : (
            <button type="button" className="noor-press" style={{ ...actionBtn, color: N.muted }} onClick={() => setConfirmAbandon(true)}>
              <Icon name="close" size={14} color={N.muted} sw={1.8} /> Abandon
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── A known catalogue template, not yet started: preview + start ───────────
  if (template) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "8px 0 60px" }}>
        <Link href="/plans" style={{ color: N.muted, fontSize: 13, fontFamily: N.ui, textDecoration: "none" }}>
          ← All plans
        </Link>
        <div style={{ marginTop: 18, padding: 22, borderRadius: 16, border: `1px solid ${N.border}`, background: N.card }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Khatam size={28} color={N.gold} sw={1} opacity={0.7} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: N.fg, fontFamily: N.ui }}>{template.name}</h1>
          </div>
          <p style={{ margin: "8px 0 0", color: N.muted, fontSize: 13.5, fontFamily: N.ui }}>
            {template.tag} · {template.len}
          </p>
          <p style={{ margin: "12px 0 0", color: N.fg, fontSize: 14.5, lineHeight: 1.5, fontFamily: N.ui }}>{template.desc}</p>
          {plan && (
            <p style={{ margin: "14px 0 0", color: N.faint, fontSize: 12.5, fontFamily: N.ui }}>
              Starting this replaces your current plan ({plan.template.name}).
            </p>
          )}
          <button
            type="button"
            className="noor-press"
            style={{ ...actionBtn, marginTop: 18, background: N.goldGrad, border: "none", color: N.ink }}
            onClick={() => void startPlan(templateId)}
          >
            <Icon name="book" size={15} color={N.ink} sw={1.8} /> Start this plan
          </button>
        </div>
      </div>
    );
  }

  // ── Unknown id (e.g. a custom plan that isn't active) ─────────────────────
  return (
    <div style={{ maxWidth: 480, margin: "40px auto", textAlign: "center" }}>
      <p style={{ color: N.muted, fontSize: 14, fontFamily: N.ui }}>That plan isn’t available.</p>
      <Link href="/plans" style={{ color: N.gold, fontSize: 14, fontFamily: N.ui }}>
        Browse reading plans →
      </Link>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: swatch, border: `1px solid ${N.border}` }} />
      {label}
    </span>
  );
}
