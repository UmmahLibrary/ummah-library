import type { ResumePoint } from "@ummahlibrary/core";
import { getPref, setPref } from "./storage";

/**
 * The last place the reader went *from the popup* (a sūra from search, or the
 * verse of the day). Kept in the extension's own synced prefs — local-first
 * (ADR 0006), nothing sent to a server — so the popup can lead with a single
 * "Continue" card (ADR 0041).
 */
const KEY = "lastRead";

function isResumePoint(v: unknown): v is ResumePoint {
  if (!v || typeof v !== "object") return false;
  const { sura, aya } = v as Record<string, unknown>;
  return (
    Number.isInteger(sura) &&
    Number.isInteger(aya) &&
    (sura as number) >= 1 &&
    (sura as number) <= 114 &&
    (aya as number) >= 1
  );
}

export async function getLastRead(): Promise<ResumePoint | null> {
  const v = await getPref<unknown>(KEY, null);
  return isResumePoint(v) ? { sura: v.sura, aya: v.aya } : null;
}

export function setLastRead(point: ResumePoint): Promise<void> {
  return setPref(KEY, { sura: point.sura, aya: point.aya });
}
