"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type HijriDate,
  type UpcomingIslamicEvent,
  gregorianToHijri,
  hijriMonth,
  hijriMonthLength,
  hijriToGregorian,
  islamicEventsInMonth,
  upcomingIslamicEvents,
} from "@ummahlibrary/core";
import { readHijriAdjust, writeHijriAdjust } from "../lib/hijri";
import { N } from "@ummahlibrary/ui";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const lcard = { background: N.card, border: `1px solid ${N.border}`, borderRadius: 16 } as const;

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

  useEffect(() => {
    const a = readHijriAdjust();
    setAdjust(a);
    const t = gregorianToHijri(localToday(), a);
    setTodayHijri(t);
    setView({ year: t.year, month: t.month });
  }, []);

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

  const upcoming = useMemo<UpcomingIslamicEvent[]>(
    () => upcomingIslamicEvents(localToday(), 5, adjust),
    [adjust],
  );

  if (!view || !todayHijri) return <p style={{ color: N.muted, fontFamily: N.ui }}>Loading the calendar…</p>;

  const month = hijriMonth(view.month);
  const events = islamicEventsInMonth(view.month);
  const eventDays = new Set(events.map((e) => e.day));
  const nextEvent = upcoming[0];
  const isToday = (d: number) =>
    todayHijri.year === view.year && todayHijri.month === view.month && todayHijri.day === d;

  return (
    <div>
      {/* Upcoming events + next-event countdown */}
      {nextEvent && (
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              ...lcard,
              padding: "18px 20px",
              marginBottom: 12,
              background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11.5,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: N.faint,
                  fontWeight: 700,
                  fontFamily: N.ui,
                }}
              >
                Next observance
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: N.fg, fontFamily: N.ui, marginTop: 3 }}>
                {nextEvent.event.name}
              </div>
              <div style={{ fontSize: 13, color: N.faint, fontFamily: N.ui, marginTop: 2 }}>
                {gregorianFull(nextEvent.gregorian)} · {nextEvent.event.note}
              </div>
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: N.gold,
                fontFamily: N.ui,
                whiteSpace: "nowrap",
              }}
            >
              {countdownLabel(nextEvent.daysUntil)}
            </div>
          </div>
          {upcoming.length > 1 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
                gap: 10,
              }}
            >
              {upcoming.slice(1).map((u) => (
                <div
                  key={u.event.id}
                  style={{
                    ...lcard,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: N.fg,
                        fontFamily: N.ui,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {u.event.name}
                    </div>
                    <div style={{ fontSize: 12, color: N.faint, fontFamily: N.ui }}>
                      {gregorianFull(u.gregorian)}
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
                    {countdownLabel(u.daysUntil)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Two-pane: grid + sacred dates */}
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
                  title={cell.greg}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 10,
                    display: "grid",
                    placeItems: "center",
                    position: "relative",
                    background: today ? N.goldGrad : ev ? N.goldSoft : "transparent",
                    border: `1px solid ${today ? "transparent" : ev ? N.gold : N.borderSoft}`,
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
        </div>

        {/* Sighting adjustment */}
        <div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: N.faint,
              fontWeight: 700,
              margin: "22px 0 12px",
              fontFamily: N.ui,
            }}
          >
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
