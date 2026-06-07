import type { Metadata } from "next";
import Link from "next/link";
import { HijriCalendar } from "../../components/HijriCalendar";

export const metadata: Metadata = {
  title: "Hijri calendar",
  description:
    "The Islamic (Hijri) calendar with Gregorian cross-reference and a per-day adjustment to match your local moon sighting. Computed on Ummah Library — entirely on your device.",
  alternates: { canonical: "/calendar" },
};

export default function CalendarPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">Hijri calendar</div>
        <div className="sub">Islamic months, with a Gregorian cross-reference</div>
      </header>
      <HijriCalendar />
    </>
  );
}
