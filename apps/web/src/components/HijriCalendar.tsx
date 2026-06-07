"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type HijriDate,
  gregorianToHijri,
  hijriMonth,
  hijriMonthLength,
  hijriToGregorian,
} from "@ummahlibrary/core";
import { readHijriAdjust, writeHijriAdjust } from "../lib/hijri";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function localToday(): { year: number; month: number; day: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
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
  const [today, setToday] = useState<HijriDate | null>(null);
  const [view, setView] = useState<{ year: number; month: number } | null>(null);

  useEffect(() => {
    const a = readHijriAdjust();
    setAdjust(a);
    const t = gregorianToHijri(localToday(), a);
    setToday(t);
    setView({ year: t.year, month: t.month });
  }, []);

  function changeAdjust(next: number) {
    setAdjust(next);
    writeHijriAdjust(next);
    const t = gregorianToHijri(localToday(), next);
    setToday(t);
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
    const firstWeekday = weekdayOf(hijriToGregorian({ year: view.year, month: view.month, day: 1 }, adjust));
    const out: ({ day: number; greg: string } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let day = 1; day <= length; day++) {
      out.push({ day, greg: gregorianLabel(hijriToGregorian({ year: view.year, month: view.month, day }, adjust)) });
    }
    return out;
  }, [view, adjust]);

  if (!view || !today) return <p className="hifz-muted">Loading the calendar…</p>;

  const month = hijriMonth(view.month);

  return (
    <div className="hijri">
      <div className="hijri-bar">
        <button type="button" className="chip" onClick={() => step(-1)} aria-label="Previous month">
          ←
        </button>
        <div className="hijri-title">
          <span className="hijri-month-en">
            {month.name} {view.year} AH
          </span>
          <span className="hijri-month-ar" dir="rtl">
            {month.arabic}
          </span>
        </div>
        <button type="button" className="chip" onClick={() => step(1)} aria-label="Next month">
          →
        </button>
      </div>

      <div className="hijri-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="hijri-weekday">
            {w}
          </div>
        ))}
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={`pad-${i}`} className="hijri-cell hijri-cell--empty" />
          ) : (
            <div
              key={cell.day}
              className={
                today.year === view.year && today.month === view.month && today.day === cell.day
                  ? "hijri-cell hijri-cell--today"
                  : "hijri-cell"
              }
            >
              <span className="hijri-day">{cell.day}</span>
              <span className="hijri-greg">{cell.greg}</span>
            </div>
          ),
        )}
      </div>

      <div className="hijri-adjust">
        <span className="prayer-control-label">
          Date adjustment ({adjust > 0 ? `+${adjust}` : adjust} day{Math.abs(adjust) === 1 ? "" : "s"})
        </span>
        <div className="hijri-adjust-row">
          {[-2, -1, 0, 1, 2].map((n) => (
            <button
              key={n}
              type="button"
              className={n === adjust ? "chip chip--active" : "chip"}
              onClick={() => changeAdjust(n)}
            >
              {n > 0 ? `+${n}` : n}
            </button>
          ))}
        </div>
        <p className="hifz-muted hijri-note">
          This is the arithmetic (tabular) Islamic calendar — it can sit a day either side of your
          local moon sighting or Umm al-Qura. Nudge it to match; your choice stays on this device
          and applies everywhere.
        </p>
      </div>
    </div>
  );
}
