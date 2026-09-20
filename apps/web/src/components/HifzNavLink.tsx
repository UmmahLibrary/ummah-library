"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HIFZ_EVENT, dueRecords } from "../lib/hifz-store";

/**
 * Home nav link to the Hifz review with a live "due" badge, e.g. "Hifz (12)".
 * Client-only — the count comes from localStorage, so it renders the plain
 * label on the server and hydrates the badge in. Hidden when nothing is due.
 */
export function HifzNavLink() {
  const [due, setDue] = useState(0);

  useEffect(() => {
    const refresh = () => setDue(dueRecords(new Date()).length);
    refresh();
    window.addEventListener(HIFZ_EVENT, refresh);
    return () => window.removeEventListener(HIFZ_EVENT, refresh);
  }, []);

  return (
    <Link href="/hifz" className="head-link">
      Hifz{due > 0 ? <span className="hifz-due-badge">{due}</span> : " review"} →
    </Link>
  );
}
