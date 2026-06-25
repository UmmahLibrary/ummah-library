import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { PrayerTracker } from "../../components/PrayerTracker";
import { CyclePause } from "../../components/CyclePause";
import { QadaTracker } from "../../components/QadaTracker";
import { FastingQadaTracker } from "../../components/FastingQadaTracker";

export const metadata: Metadata = {
  title: "Prayer Tracker",
  description:
    "Log your five daily prayers and build consistency — track on-time vs late, your day streak, and the last week at a glance. Stored locally on your device.",
  alternates: { canonical: "/tracker" },
};

export default function PrayerTrackerPage() {
  return (
    <NoorPageFrame
      title="Prayer Tracker"
      sub="Build consistency, one ṣalāh at a time"
      glyph="📿"
      back="/"
      maxW={820}
    >
      <PrayerTracker />
      <CyclePause />
      <QadaTracker />
      <FastingQadaTracker />
    </NoorPageFrame>
  );
}
