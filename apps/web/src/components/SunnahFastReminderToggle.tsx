"use client";

import { useEffect, useMemo, useState } from "react";
import { type UpcomingSunnahFast, upcomingSunnahFasts } from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";
import { HIJRI_ADJUST_KEY, readHijriAdjust } from "../lib/hijri";
import { WebNotifier } from "../lib/web-notifier";
import { remindersEnabled, setRemindersEnabled, syncSunnahFastReminder } from "../lib/sunnah-fast-reminders";

const notifier = new WebNotifier();

const lcard = { background: N.card, border: `1px solid ${N.border}`, borderRadius: 16 } as const;
const sectionLabel = {
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: N.faint,
  fontWeight: 700,
  fontFamily: N.ui,
} as const;

function localToday(): { year: number; month: number; day: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function countdownLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `in ${daysUntil} days`;
}

function gregorianFull(g: { year: number; month: number; day: number }): string {
  return new Date(Date.UTC(g.year, g.month - 1, g.day)).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const GLYPH: Record<UpcomingSunnahFast["kind"], string> = {
  "white-day": "🌕",
  monday: "🌙",
  thursday: "🌙",
};

export function SunnahFastReminderToggle() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [adjust, setAdjust] = useState(0);

  useEffect(() => {
    const update = () => setAdjust(readHijriAdjust());
    update();
    window.addEventListener(HIJRI_ADJUST_KEY, update);
    void remindersEnabled().then((on) => {
      setEnabled(on);
      setReady(true);
    });
    return () => window.removeEventListener(HIJRI_ADJUST_KEY, update);
  }, []);

  const fasts = useMemo<UpcomingSunnahFast[]>(
    () => upcomingSunnahFasts(localToday(), 6, adjust),
    [adjust],
  );
  const next = fasts[0];

  async function toggle() {
    if (!enabled) {
      if (notifier.permission() === "default") await notifier.requestPermission();
      await setRemindersEnabled(true);
      setEnabled(true);
      await syncSunnahFastReminder(notifier);
    } else {
      await setRemindersEnabled(false);
      setEnabled(false);
      await syncSunnahFastReminder(notifier);
    }
  }

  if (!ready) return null;

  return (
    <div>
      <div style={{ ...sectionLabel, marginBottom: 12 }}>Sunnah fasting</div>

      <div style={{ ...lcard, padding: "16px 18px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>Reminders</div>
            <p style={{ fontSize: 12.5, color: N.faint, lineHeight: 1.6, marginTop: 4, fontFamily: N.ui }}>
              A nudge the evening before Mondays &amp; Thursdays and the white days (Ayyām al-Bīḍ,
              13–15 of each month), so you can make the intention and plan suhoor. Works while Ummah
              Library is open.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void toggle()}
            aria-pressed={enabled}
            style={{
              flexShrink: 0,
              padding: "8px 14px",
              borderRadius: 999,
              border: `1px solid ${enabled ? N.gold : N.border}`,
              background: enabled ? N.goldSoft : "transparent",
              color: enabled ? N.gold : N.muted,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: N.ui,
              whiteSpace: "nowrap",
            }}
          >
            {enabled ? "🔔 On" : "🔕 Off"}
          </button>
        </div>
        {enabled && next && (
          <p style={{ fontSize: 12.5, color: N.gold, fontWeight: 600, marginTop: 12, fontFamily: N.ui }}>
            Next: {next.name} · {countdownLabel(next.daysUntil)}
          </p>
        )}
      </div>

      <div style={{ ...sectionLabel, margin: "22px 0 12px" }}>Upcoming fasts</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {fasts.map((f) => (
          <div
            key={`${f.gregorian.year}-${f.gregorian.month}-${f.gregorian.day}`}
            style={{
              ...lcard,
              padding: "14px 16px",
              display: "flex",
              gap: 14,
              alignItems: "center",
              borderColor: f === next ? N.gold : N.border,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: N.goldSoft,
                border: `1px solid ${N.gold}`,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                fontSize: 20,
              }}
            >
              {GLYPH[f.kind]}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>{f.name}</div>
              <div style={{ fontSize: 12.5, color: N.faint, marginTop: 1, fontFamily: N.ui }}>
                {gregorianFull(f.gregorian)} · {f.note}
              </div>
            </div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: N.gold,
                fontFamily: N.ui,
                whiteSpace: "nowrap",
              }}
            >
              {countdownLabel(f.daysUntil)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
