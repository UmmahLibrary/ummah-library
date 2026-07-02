/**
 * Web `ReminderStore` adapter (ADR 0024): the reader's reminder preferences in
 * `localStorage` under the existing `ul.planReminder` / `ul.prayerReminders` /
 * `ul.adhkarReminders` keys (so existing prefs carry over). Persistence only —
 * the reminder orchestration lives in `@ummahlibrary/core`; a synced adapter
 * (#25) can replace this. `read()` applies the defaults.
 *
 * Also hosts the adhkar banner's "dismissed today" state — web-only UI chrome,
 * not a cross-platform pref, so it stays out of the core port but still behind a
 * `*-store` adapter (the one sanctioned home for raw `localStorage`).
 */
import type { AdhkarOccasion, PlanReminderPref, PrayerName, ReminderStore } from "@ummahlibrary/core";
import { DEFAULT_PLAN_REMINDER_TIME } from "@ummahlibrary/core";

const PLAN_KEY = "ul.planReminder";
const PRAYERS_KEY = "ul.prayerReminders";
const ADHKAR_KEY = "ul.adhkarReminders";
const SUNNAH_FAST_KEY = "ul.sunnahFastReminders";
const ISLAMIC_EVENTS_KEY = "ul.islamicEventReminders";
const SEEN_KEY = "ul.adhkarReminderSeen";

export const webReminderStore: ReminderStore = {
  read: async () => {
    let plan: PlanReminderPref = { on: false, time: DEFAULT_PLAN_REMINDER_TIME };
    try {
      const raw = localStorage.getItem(PLAN_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<PlanReminderPref>;
        plan = {
          on: p.on === true,
          time: typeof p.time === "string" ? p.time : DEFAULT_PLAN_REMINDER_TIME,
        };
      }
    } catch {
      /* keep default */
    }

    let prayers: Partial<Record<PrayerName, boolean>> = {};
    try {
      const raw = localStorage.getItem(PRAYERS_KEY);
      prayers = raw ? (JSON.parse(raw) as Partial<Record<PrayerName, boolean>>) : {};
    } catch {
      /* keep default */
    }

    let adhkarOn = false;
    try {
      adhkarOn = localStorage.getItem(ADHKAR_KEY) === "on";
    } catch {
      /* keep default */
    }

    let sunnahFastOn = false;
    try {
      sunnahFastOn = localStorage.getItem(SUNNAH_FAST_KEY) === "on";
    } catch {
      /* keep default */
    }

    let islamicEvents: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem(ISLAMIC_EVENTS_KEY);
      const v = raw ? (JSON.parse(raw) as unknown) : null;
      islamicEvents = v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, boolean>) : {};
    } catch {
      /* keep default */
    }

    return { plan, prayers, adhkarOn, sunnahFastOn, islamicEvents };
  },
  writePlan: async (pref) => {
    try {
      localStorage.setItem(PLAN_KEY, JSON.stringify(pref));
    } catch {
      /* storage unavailable */
    }
  },
  writePrayers: async (prefs) => {
    try {
      localStorage.setItem(PRAYERS_KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable */
    }
  },
  writeAdhkarOn: async (on) => {
    try {
      localStorage.setItem(ADHKAR_KEY, on ? "on" : "off");
    } catch {
      /* storage unavailable */
    }
  },
  writeSunnahFastOn: async (on) => {
    try {
      localStorage.setItem(SUNNAH_FAST_KEY, on ? "on" : "off");
    } catch {
      /* storage unavailable */
    }
  },
  writeIslamicEvents: async (prefs) => {
    try {
      localStorage.setItem(ISLAMIC_EVENTS_KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable */
    }
  },
};

function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Adhkar occasions the reader has dismissed in the banner today (web UI state). */
export function readAdhkarSeen(now = new Date()): AdhkarOccasion[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date: string; dismissed: AdhkarOccasion[] };
    return parsed.date === localDate(now) ? parsed.dismissed : [];
  } catch {
    return [];
  }
}

/** Mark an adhkar occasion dismissed for today. */
export function dismissAdhkar(occasion: AdhkarOccasion, now = new Date()): void {
  const dismissed = Array.from(new Set([...readAdhkarSeen(now), occasion]));
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify({ date: localDate(now), dismissed }));
  } catch {
    /* storage unavailable */
  }
}
