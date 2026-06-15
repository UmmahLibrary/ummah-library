"use client";

import { useEffect, useState } from "react";
import { nextDailyReminder } from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import {
  DEFAULT_PLAN_REMINDER_TIME,
  readPlanReminderPref,
  setPlanReminderPref,
} from "../lib/plan-reminders";
import { WebNotifier } from "../lib/web-notifier";

const notifier = new WebNotifier();

const fmtTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDay = (d: Date) =>
  d.toDateString() === new Date().toDateString() ? "today" : "tomorrow";

/**
 * Opt-in daily reminder for the active plan (#71): a single nudge at a chosen
 * time, delivered locally while a tab is open. Lives in the active-plan card.
 */
export function PlanReminderToggle() {
  const [on, setOn] = useState(false);
  const [time, setTime] = useState(DEFAULT_PLAN_REMINDER_TIME);
  const [denied, setDenied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = readPlanReminderPref();
    setOn(p.on);
    setTime(p.time);
    setDenied(notifier.permission() === "denied");
    setReady(true);
  }, []);

  async function toggle() {
    if (!on) {
      if (notifier.permission() === "default") await notifier.requestPermission();
      setDenied(notifier.permission() === "denied");
      setPlanReminderPref({ on: true, time });
      setOn(true);
    } else {
      setPlanReminderPref({ on: false, time });
      setOn(false);
    }
  }

  function changeTime(next: string) {
    setTime(next);
    setPlanReminderPref({ on, time: next });
  }

  if (!ready) return null;
  const next = on ? nextDailyReminder(time, new Date()) : null;

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="bell" size={17} color={on ? N.gold : N.muted} sw={1.8} />
          <div>
            <strong style={{ color: N.fg, fontFamily: N.ui, fontSize: 14 }}>Daily reminder</strong>
            <p style={{ margin: "2px 0 0", color: N.muted, fontSize: 12.5, fontFamily: N.ui }}>
              A gentle nudge for today’s portion. Works while Ummah Library is open.
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
            padding: "7px 14px",
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
          {on ? "🔔 On" : "🔕 Off"}
        </button>
      </div>

      {on && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: N.muted, fontSize: 13, fontFamily: N.ui }}>
            Remind me at
            <input
              type="time"
              value={time}
              onChange={(e) => changeTime(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: `1px solid ${N.border}`,
                background: N.cardHi,
                color: N.fg,
                fontFamily: N.ui,
                fontSize: 13,
              }}
            />
          </label>
          {next && (
            <span style={{ color: N.faint, fontSize: 12.5, fontFamily: N.ui }}>
              Next: {fmtDay(next)} at {fmtTime(next)}
            </span>
          )}
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
