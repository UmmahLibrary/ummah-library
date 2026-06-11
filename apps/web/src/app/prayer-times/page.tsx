import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { PrayerTimesView } from "../../components/PrayerTimesView";

export const metadata: Metadata = {
  title: "Prayer times",
  description:
    "Accurate daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) for your location, with a choice of calculation methods. Computed on Ummah Library — your location stays on your device.",
  alternates: { canonical: "/prayer-times" },
};

export default function PrayerTimesPage() {
  return (
    <NoorPageFrame
      title="Prayer Times"
      sub="Daily salah times for your location"
      glyph="🕌"
      back="/"
    >
      <PrayerTimesView />
    </NoorPageFrame>
  );
}
