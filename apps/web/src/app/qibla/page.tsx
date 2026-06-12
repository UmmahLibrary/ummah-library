import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { QiblaCompass } from "../../components/QiblaCompass";

export const metadata: Metadata = {
  title: "Qibla direction",
  description:
    "Find the direction of the Kaaba in Makkah from your location, with a live compass. Computed on Ummah Library — your location stays on your device.",
  alternates: { canonical: "/qibla" },
};

export default function QiblaPage() {
  return (
    <NoorPageFrame
      title="Qibla Finder"
      sub="Direction to the Kaʿbah from your location"
      glyph="🧭"
      back="/"
      maxW={560}
    >
      <QiblaCompass />
    </NoorPageFrame>
  );
}
