"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type HijriDate,
  type MonthlyIslamicEvent,
  gregorianToHijri,
  hijriMonth,
  hijriMonthLength,
  hijriToGregorian,
  islamicEventsForMonth,
} from "@ummahlibrary/core";
import { readHijriAdjust, writeHijriAdjust } from "../lib/hijri";
import { N, Icon } from "@ummahlibrary/ui";
import { WebNotifier } from "../lib/web-notifier";
import { readEventReminders, setEventReminder, syncIslamicEventReminders } from "../lib/islamic-event-reminders";

const notifier = new WebNotifier();

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
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

/** "Today" / "Tomorrow" / "in N days" for an event countdown. */
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

/** JS weekday (0=Sun) for a Gregorian civil date, via UTC to avoid DST drift. */
function weekdayOf(g: { year: number; month: number; day: number }): number {
  return new Date(Date.UTC(g.year, g.month - 1, g.day)).getUTCDay();
}

function gregorianLabel(g: { year: number; month: number; day: number }): string {
  return new Date(Date.UTC(g.year, g.month - 1, g.day)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function HijriCalendar() {
  const [adjust, setAdjust] = useState(0);
  const [todayHijri, setTodayHijri] = useState<HijriDate | null>(null);
  const [view, setView] = useState<{ year: number; month: number } | null>(null);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const a = readHijriAdjust();
    setAdjust(a);
    const t = gregorianToHijri(localToday(), a);
    setTodayHijri(t);
    setView({ year: t.year, month: t.month });
    void readEventReminders().then(setReminders);
  }, []);

  async function toggleReminder(eventId: string) {
    const turningOn = !reminders[eventId];
    if (turningOn && notifier.permission() === "default") await notifier.requestPermission();
    setReminders(await setEventReminder(eventId, turningOn));
    await syncIslamicEventReminders(notifier);
  }

  function changeAdjust(next: number) {
    setAdjust(next);
    writeHijriAdjust(next);
    setTodayHijri(gregorianToHijri(localToday(), next));
  }

  function step(delta: number) {
    setView((v) => {
      if (!v) return v;
      let month = v.month + delta;
      let year = v.year;
      if (month < 1) {
        month = 12;
        year -= 1;
      } else if (month > 12) {
        month = 1;
        year += 1;
      }
      return { year, month };
    });
  }

  const cells = useMemo(() => {
    if (!view) return [];
    const length = hijriMonthLength(view.year, view.month);
    const firstWeekday = weekdayOf(
      hijriToGregorian({ year: view.year, month: view.month, day: 1 }, adjust),
    );
    const out: ({ day: number; greg: string } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let day = 1; day <= length; day++) {
      out.push({
        day,
        greg: gregorianLabel(hijriToGregorian({ year: view.year, month: view.month, day }, adjust)),
      });
    }
    return out;
  }, [view, adjust]);

  // The viewed month's observances, resolved to dates + countdowns — the single
  // labelled source for both the grid markers and the panel beside it.
  const monthly = useMemo<MonthlyIslamicEvent[]>(
    () => (view ? islamicEventsForMonth(view.year, view.month, localToday(), adjust) : []),
    [view, adjust],
  );

  if (!view || !todayHijri) return <p style={{ color: N.muted, fontFamily: N.ui }}>Loading the calendar…</p>;

  const month = hijriMonth(view.month);
  const eventDays = new Set(monthly.map((m) => m.event.day));
  // The soonest still-upcoming observance in this month, highlighted as "next".
  const nextId = monthly
    .filter((m) => m.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)[0]?.event.id;
  const isToday = (d: number) =>
    todayHijri.year === view.year && todayHijri.month === view.month && todayHijri.day === d;

  return (
    <div>
      {/* Month nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <button
          onClick={() => step(-1)}
          aria-label="Previous month"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            border: `1px solid ${N.border}`,
            background: N.card,
            color: N.muted,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            fontSize: 18,
          }}
        >
          ‹
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: N.fg, fontFamily: N.ui, letterSpacing: -0.3 }}>
            {month.name} {view.year} AH
          </div>
          <div className="noor-ar" style={{ fontSize: 15, color: N.gold, marginTop: 1 }}>
            {month.arabic}
          </div>
        </div>
        <button
          onClick={() => step(1)}
          aria-label="Next month"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            border: `1px solid ${N.border}`,
            background: N.card,
            color: N.muted,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            fontSize: 18,
          }}
        >
          ›
        </button>
      </div>

      {/* Two-pane: grid + this month's observances */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))",
          gap: 18,
          alignItems: "start",
        }}
      >
        {/* Calendar grid */}
        <div style={{ ...lcard, padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                style={{ textAlign: "center", fontSize: 11.5, color: N.faint, fontWeight: 700, padding: "4px 0", fontFamily: N.ui }}
              >
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {cells.map((cell, i) => {
              if (!cell) return <div key={`pad-${i}`} />;
              const today = isToday(cell.day);
              const ev = eventDays.has(cell.day);
              return (
                <div
                  key={cell.day}
                  title={ev ? `${cell.greg} · observance` : cell.greg}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 10,
                    display: "grid",
                    placeItems: "center",
                    position: "relative",
                    background: today ? N.goldGrad : "transparent",
                    border: `1px solid ${today ? "transparent" : N.borderSoft}`,
                    color: today ? N.ink : N.fg,
                    fontWeight: today ? 800 : 500,
                    fontSize: 14.5,
                    fontFamily: N.ui,
                  }}
                >
                  {cell.day}
                  {ev && !today && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 5,
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        background: N.gold,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: 18,
              marginTop: 16,
              fontSize: 12,
              color: N.faint,
              fontFamily: N.ui,
              alignItems: "center",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: N.gold }} />
              Observance
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{ width: 12, height: 12, borderRadius: 4, background: N.goldGrad }}
              />
              Today
            </span>
          </div>
        </div>

        {/* This month's observances + sighting adjustment */}
        <div>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>Observances this month</div>
          {monthly.length === 0 ? (
            <div style={{ ...lcard, padding: "16px 18px", fontSize: 13.5, color: N.faint, fontFamily: N.ui }}>
              No major observances fall in this month.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {monthly.map((m) => {
                const isNext = m.event.id === nextId;
                const upcoming = m.daysUntil >= 0;
                return (
                  <div
                    key={m.event.id}
                    style={{
                      ...lcard,
                      padding: "14px 16px",
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      borderColor: isNext ? N.gold : N.border,
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
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 800, color: N.gold, fontFamily: N.ui }}>
                        {m.event.day}
                      </span>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>
                        {m.event.name}
                      </div>
                      <div style={{ fontSize: 12.5, color: N.faint, marginTop: 1, fontFamily: N.ui }}>
                        {gregorianFull(m.gregorian)} · {m.event.note}
                      </div>
                    </div>
                    {upcoming && (
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: N.gold,
                          fontFamily: N.ui,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {countdownLabel(m.daysUntil)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => void toggleReminder(m.event.id)}
                      aria-pressed={!!reminders[m.event.id]}
                      aria-label={`${reminders[m.event.id] ? "Turn off" : "Turn on"} reminder for ${m.event.name}`}
                      title="Remind me the evening before"
                      style={{
                        flexShrink: 0,
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        border: `1px solid ${reminders[m.event.id] ? N.gold : N.border}`,
                        background: reminders[m.event.id] ? N.goldSoft : "transparent",
                      }}
                    >
                      <Icon name="bell" size={16} color={reminders[m.event.id] ? N.gold : N.faint} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sighting adjustment */}
          <div style={{ ...sectionLabel, margin: "22px 0 12px" }}>
            Date adjustment ({adjust > 0 ? `+${adjust}` : adjust} day{Math.abs(adjust) === 1 ? "" : "s"})
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[-2, -1, 0, 1, 2].map((n) => {
              const active = n === adjust;
              return (
                <button
                  key={n}
                  onClick={() => changeAdjust(n)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: `1px solid ${active ? N.gold : N.border}`,
                    background: active ? N.goldSoft : "transparent",
                    color: active ? N.gold : N.muted,
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: N.ui,
                  }}
                >
                  {n > 0 ? `+${n}` : n}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 12.5, color: N.faint, lineHeight: 1.6, marginTop: 12, fontFamily: N.ui }}>
            This is the arithmetic (tabular) Islamic calendar — it can sit a day either side of your
            local moon sighting. Nudge it to match; your choice stays on this device and applies
            everywhere.
          </p>
        </div>
      </div>
    </div>
  );
}
