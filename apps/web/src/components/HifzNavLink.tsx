"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dueRecords } from "../lib/hifz-store";

/**
 * Home nav link to the Hifz review with a live "due" badge, e.g. "Hifz (12)".
 * Client-only — the count comes from localStorage, so it renders the plain
 * label on the server and hydrates the badge in. Hidden when nothing is due.
 */
export function HifzNavLink() {
  const [due, setDue] = useState(0);

  useEffect(() => {
    setDue(dueRecords(new Date()).length);
  }, []);

  return (
    <Link href="/hifz" className="head-link">
      Hifz{due > 0 ? <span className="hifz-due-badge">{due}</span> : " review"} →
    </Link>
  );
}
