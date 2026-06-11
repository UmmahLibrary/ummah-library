import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { HijriCalendar } from "../../components/HijriCalendar";

export const metadata: Metadata = {
  title: "Hijri calendar",
  description:
    "The Islamic (Hijri) calendar with Gregorian cross-reference and a per-day adjustment to match your local moon sighting. Computed on Ummah Library — entirely on your device.",
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
    </NoorPageFrame>
  );
}
