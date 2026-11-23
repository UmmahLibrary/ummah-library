"use client";

import { useEffect, useState } from "react";
import { COMFORT_EVENT, readComfort } from "./comfort-store";

/**
 * Whether the reader opted in to day-streak counts (Settings → Daily habit).
 * Off by default (ADR 0041): screens show "N of 7 days this week" instead and
 * never a fire emoji or "keep your streak alive" copy. Re-reads on change.
 */
export function useShowStreaks(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const refresh = () => setOn(readComfort().showStreaks);
    refresh();
    window.addEventListener(COMFORT_EVENT, refresh);
    return () => window.removeEventListener(COMFORT_EVENT, refresh);
  }, []);
  return on;
}
