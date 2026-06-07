"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatHijri, gregorianToHijri } from "@ummahlibrary/core";
import { HIJRI_ADJUST_KEY, readHijriAdjust } from "../lib/hijri";

/** Today's local civil date as plain {year,month,day} (no timezone surprises). */
function localToday(): { year: number; month: number; day: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/**
 * A small, reactive "today in Hijri" badge linking to the calendar. Renders
 * nothing until mounted so server and client markup agree (the date is
 * device-local). Re-renders when the adjustment changes anywhere on the page.
 */
export function HijriToday({ className }: { className?: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setLabel(formatHijri(gregorianToHijri(localToday(), readHijriAdjust())));
    update();
    window.addEventListener(HIJRI_ADJUST_KEY, update);
    return () => window.removeEventListener(HIJRI_ADJUST_KEY, update);
  }, []);

  if (!label) return null;

  return (
    <Link href="/calendar" className={className ?? "hijri-today"} title="Hijri calendar">
      🌙 {label}
    </Link>
  );
}
