import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { HijriCalendar } from "../../components/HijriCalendar";
import { SunnahFastReminderToggle } from "../../components/SunnahFastReminderToggle";

export const metadata: Metadata = {
  title: "Hijri calendar",
  description:
    "The Islamic (Hijri) calendar with Gregorian cross-reference and a per-day adjustment to match your local moon sighting, plus upcoming Sunnah-fasting days (Mondays, Thursdays and the white days) with optional reminders. Computed on Ummah Library — entirely on your device.",
  alternates: { canonical: "/calendar" },
};

export default function CalendarPage() {
  return (
    <NoorPageFrame
      title="Hijri Calendar"
      sub="Islamic months with Gregorian cross-reference"
      glyph="☾"
      back="/"
      maxW={820}
    >
      <HijriCalendar />
      <div style={{ marginTop: 40 }}>
        <SunnahFastReminderToggle />
      </div>
    </NoorPageFrame>
  );
}
