"use client";

import { useEffect, useState } from "react";
import { type PrayerTimings, isPrayerAnchor, resolveReminderTime } from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import {
  DEFAULT_PLAN_REMINDER_TIME,
  readPlanReminderPref,
  setPlanReminderPref,
} from "../lib/plan-reminders";
import { WebNotifier } from "../lib/web-notifier";
import { webPrayerTimingsProvider } from "../lib/prayer-timings-provider";
import { onRadioGroupKeyDown, radioTabIndex } from "../lib/radio-group";

/** When the daily nudge comes: anchored to a prayer, or a clock time (ADR 0041). */
const ANCHORS: { value: string; label: string }[] = [
  { value: "after:fajr", label: "After Fajr" },
  { value: "after:maghrib", label: "After Maghrib" },
  { value: "after:isha", label: "After ʿIshāʾ" },
  { value: "clock", label: "At a time I choose" },
];

const notifier = new WebNotifier();

const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDay = (d: Date) => (d.toDateString() === new Date().toDateString() ? "today" : "tomorrow");

/**
 * Opt-in daily reminder for the active plan (#71): a single nudge at a chosen
 * time, delivered locally while a tab is open. Lives in the active-plan card.
 */
export function PlanReminderToggle() {
  const [on, setOn] = useState(false);
  const [time, setTime] = useState(DEFAULT_PLAN_REMINDER_TIME);
  const [denied, setDenied] = useState(false);
  const [ready, setReady] = useState(false);
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  // The last clock time, kept while an anchor is selected so switching back restores it.
  const [clock, setClock] = useState(DEFAULT_PLAN_REMINDER_TIME);

  useEffect(() => {
    void webPrayerTimingsProvider.getTodaysTimings().then((t) => setTimings(t ?? null));
    void readPlanReminderPref().then((p) => {
      if (!isPrayerAnchor(p.time)) setClock(p.time);
      setOn(p.on);
      setTime(p.time);
      setDenied(notifier.permission() === "denied");
      setReady(true);
    });
  }, []);

  async function toggle() {
    if (!on) {
      if (notifier.permission() === "default") await notifier.requestPermission();
      setDenied(notifier.permission() === "denied");
      await setPlanReminderPref({ on: true, time });
      setOn(true);
    } else {
      await setPlanReminderPref({ on: false, time });
      setOn(false);
    }
  }

  function changeTime(next: string) {
    setTime(next);
    void setPlanReminderPref({ on, time: next });
  }

  if (!ready) return null;
  const next = on ? resolveReminderTime(time, timings, new Date()) : null;
  const anchorValue = isPrayerAnchor(time) ? time : "clock";

  return (
    <div
      style={{
        marginTop: 18,
        border: `1px solid ${N.border}`,
        borderRadius: 14,
        padding: 16,
        background: N.card,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="bell" size={17} color={on ? N.gold : N.muted} sw={1.8} />
          <div>
            <strong style={{ color: N.fg, fontFamily: N.ui, fontSize: 14 }}>Daily reminder</strong>
            <p style={{ margin: "2px 0 0", color: N.muted, fontSize: 12.5, fontFamily: N.ui }}>
              One gentle nudge a day for today’s portion, at a time you choose. Works while Ummah
              Library is open.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="noor-press"
          aria-pressed={on}
          onClick={() => void toggle()}
          style={{
            flexShrink: 0,
            minHeight: 44,
            padding: "7px 16px",
            borderRadius: 999,
            border: `1px solid ${on ? N.gold : N.border}`,
            background: on ? N.goldSoft : N.card,
            color: on ? N.gold : N.muted,
            fontWeight: 700,
            fontSize: 13,
            fontFamily: N.ui,
            cursor: "pointer",
          }}
        >
          {on ? "On" : "Off"}
        </button>
      </div>

      {on && (
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <div
            role="radiogroup"
            aria-label="When to remind me"
            onKeyDown={onRadioGroupKeyDown}
            style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            {ANCHORS.map((a, i) => {
              const active = anchorValue === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={radioTabIndex(
                    active,
                    i,
                    ANCHORS.some((x) => x.value === anchorValue),
                  )}
                  onClick={() => changeTime(a.value === "clock" ? clock : a.value)}
                  style={{
                    minHeight: 44,
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: `1px solid ${active ? N.gold : N.border}`,
                    background: active ? N.goldSoft : N.card,
                    color: active ? N.gold : N.fg,
                    fontFamily: N.ui,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
          {anchorValue === "clock" && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: N.fg,
                fontSize: 14,
                fontFamily: N.ui,
              }}
            >
              Remind me at
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  setClock(e.target.value);
                  changeTime(e.target.value);
                }}
                style={{
                  minHeight: 44,
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: `1px solid ${N.border}`,
                  background: N.cardHi,
                  color: N.fg,
                  fontFamily: N.ui,
                  fontSize: 15,
                }}
              />
            </label>
          )}
          {next ? (
            <span style={{ color: N.muted, fontSize: 14, fontFamily: N.ui }}>
              Next: {fmtDay(next)} at {fmtTime(next)}
            </span>
          ) : isPrayerAnchor(time) ? (
            <span style={{ color: N.muted, fontSize: 14, fontFamily: N.ui }}>
              Set your location in Prayer Times so we know when{" "}
              {ANCHORS.find((a) => a.value === time)?.label.replace("After ", "")} is.
            </span>
          ) : null}
        </div>
      )}

      {on && denied && (
        <p style={{ margin: "12px 0 0", color: N.faint, fontSize: 12.5, fontFamily: N.ui }}>
          Notifications are blocked in your browser — enable them in site settings to get the nudge.
        </p>
      )}
    </div>
  );
}
