/**
 * Adhkar reminders, wired off the prayer-times module (ADR 0017). All local:
 * the on/off preference and a per-day cache of the day's timings live in
 * `localStorage`; the reminder logic itself is the pure core helpers. There is
 * no server push — reminders surface in-app and as a local notification while a
 * tab is open (the honest limit of a no-backend, local-first app). Delivery goes
 * through the {@link Notifier} port, the same as prayer reminders (ADR 0019).
 */

import {
  type AdhkarOccasion,
  type Notifier,
  type PrayerTimings,
  nextAdhkarReminder,
} from "@ummahlibrary/core";

export const REMINDERS_KEY = "ul.adhkarReminders";
const TIMINGS_KEY = "ul.adhkarTimings";
const COORDS_KEY = "ul.prayerCoords"; // shared with prayer-times / qibla
const METHOD_KEY = "ul.prayerMethod";
const MADHAB_KEY = "ul.prayerMadhab";

interface Coordinates {
  latitude: number;
  longitude: number;
}

function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function remindersEnabled(): boolean {
  try {
    return localStorage.getItem(REMINDERS_KEY) === "on";
  } catch {
    return false;
  }
}

export function setRemindersEnabled(on: boolean): void {
  try {
    localStorage.setItem(REMINDERS_KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(REMINDERS_KEY, { detail: on }));
}

export function readCoords(): Coordinates | null {
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    return raw ? (JSON.parse(raw) as Coordinates) : null;
  } catch {
    return null;
  }
}

/**
 * Today's prayer timings — from the per-day cache, otherwise fetched once from
 * the existing `/api/v1/prayer-times` function and cached. Returns `null` if no
 * location is stored (the user hasn't used prayer times/qibla yet).
 */
export async function ensureTodaysTimings(): Promise<PrayerTimings | null> {
  const coords = readCoords();
  if (!coords) return null;

  try {
    const raw = localStorage.getItem(TIMINGS_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as { date: string; timings: PrayerTimings };
      if (cached.date === localDate()) return cached.timings;
    }
  } catch {
    /* fall through to refetch */
  }

  const method = (() => {
    try {
      return localStorage.getItem(METHOD_KEY) ?? "MuslimWorldLeague";
    } catch {
      return "MuslimWorldLeague";
    }
  })();
  const madhab = (() => {
    try {
      return localStorage.getItem(MADHAB_KEY) ?? "shafi";
    } catch {
      return "shafi";
    }
  })();

  const params = new URLSearchParams({
    lat: String(coords.latitude),
    lng: String(coords.longitude),
    date: localDate(),
    method,
    madhab,
  });
  try {
    const res = await fetch(`/api/v1/prayer-times?${params}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { timings: PrayerTimings };
    try {
      localStorage.setItem(TIMINGS_KEY, JSON.stringify({ date: localDate(), timings: data.timings }));
    } catch {
      /* ignore */
    }
    return data.timings;
  } catch {
    return null;
  }
}

export const ADHKAR_LABEL: Record<AdhkarOccasion, string> = {
  morning: "morning",
  evening: "evening",
};
export const ADHKAR_EMOJI: Record<AdhkarOccasion, string> = { morning: "🌅", evening: "🌆" };

/**
 * (Re)schedule the next adhkar notification through the given notifier — the
 * same {@link Notifier} port prayer reminders use (ADR 0019). Idempotent:
 * cancels first, then schedules the next window's opening. A no-op when the
 * reminder is off, permission isn't granted, or no location is stored.
 */
export async function syncAdhkarReminder(notifier: Notifier): Promise<void> {
  await notifier.cancelAll();
  if (!remindersEnabled() || notifier.permission() !== "granted") return;

  const timings = await ensureTodaysTimings();
  if (!timings) return;

  const next = nextAdhkarReminder(timings, new Date());
  if (!next) return;

  await notifier.schedule({
    id: `adhkar:${next.occasion}`,
    title: `Time for ${ADHKAR_LABEL[next.occasion]} adhkar ${ADHKAR_EMOJI[next.occasion]}`,
    body: "Tap to open your remembrances on Ummah Library.",
    at: next.at.toISOString(),
    tag: `adhkar:${next.occasion}`,
  });
}
