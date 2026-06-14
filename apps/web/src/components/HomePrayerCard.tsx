"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type PrayerStatus,
  type PrayerTrackerLog,
  prayedCount,
  prayerStreak,
  statusFor,
} from "@ummahlibrary/core";
import { Icon, N } from "@ummahlibrary/ui";
import { PRAYER_TRACKER_EVENT, cyclePrayer, readPrayerLog, today } from "../lib/prayer-tracker";

// A warm bronze for "late", matching the Prayer Tracker page.
const LATE = "#C98A57";
const dotColor = (s: PrayerStatus) => (s === "ontime" ? N.gold : s === "late" ? LATE : N.border);

/**
 * The home "Today's prayers" card — log each of the five prayers inline (tap to
 * cycle none → on time → late), with the day streak, linking to the full Prayer
 * Tracker. Mirrors the hero-card language of the other two home summaries.
 */
export function HomePrayerCard() {
  const [ready, setReady] = useState(false);
  const [log, setLog] = useState<PrayerTrackerLog>({});
  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    setTodayStr(today());
    setLog(readPrayerLog());
    setReady(true);
    const onChange = () => setLog(readPrayerLog());
    window.addEventListener(PRAYER_TRACKER_EVENT, onChange);
    return () => window.removeEventListener(PRAYER_TRACKER_EVENT, onChange);
  }, []);

  const todayLog = log[todayStr];
  const prayed = prayedCount(todayLog);
  const streak = ready ? prayerStreak(log, todayStr) : 0;

  return (
    <div
      style={{
        borderRadius: 16,
        padding: "20px 22px",
        background: N.card,
        border: `1px solid ${N.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <Link
          href="/tracker"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            fontSize: 11.5,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: N.faint,
            fontWeight: 700,
          }}
        >
          Today’s prayers
          <Icon name="arrowR" size={13} color={N.faint} />
        </Link>
        <span style={{ fontSize: 12.5, color: N.gold, fontWeight: 600, whiteSpace: "nowrap" }}>
          🔥 {streak}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
        {OBLIGATORY_PRAYERS.map((p) => {
          const st = statusFor(todayLog, p);
          return (
            <button
              key={p}
              type="button"
              disabled={!ready}
              onClick={() => ready && setLog(cyclePrayer(todayStr, p))}
              aria-label={`${PRAYER_LABELS[p]}: ${st === "none" ? "not logged" : st} — tap to change`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                padding: 0,
                cursor: ready ? "pointer" : "default",
                fontFamily: N.ui,
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  display: "grid",
                  placeItems: "center",
                  background: st === "ontime" ? N.goldGrad : "transparent",
                  border: st === "ontime" ? "none" : `1.5px solid ${dotColor(st)}`,
                }}
              >
                {st === "ontime" ? (
                  <Icon name="check" size={15} color={N.ink} />
                ) : st === "late" ? (
                  <Icon name="check" size={14} color={LATE} />
                ) : null}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  color: st === "none" ? N.faint : N.fg,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {PRAYER_LABELS[p]}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 12.5, color: N.muted }}>
        <span style={{ color: N.fg, fontWeight: 700 }}>{prayed}/5</span> logged today
      </div>
    </div>
  );
}
