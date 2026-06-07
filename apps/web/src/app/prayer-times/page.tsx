import type { Metadata } from "next";
import Link from "next/link";
import { PrayerTimesView } from "../../components/PrayerTimesView";
import { HijriToday } from "../../components/HijriToday";

export const metadata: Metadata = {
  title: "Prayer times",
  description:
    "Accurate daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) for your location, with a choice of calculation methods. Computed on Ummah Library — your location stays on your device.",
  alternates: { canonical: "/prayer-times" },
};

export default function PrayerTimesPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">Prayer times</div>
        <div className="sub">Salah times for your location</div>
        <HijriToday />
      </header>
      <PrayerTimesView />
    </>
  );
}
