import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { RamadanView } from "../../components/RamadanView";

export const metadata: Metadata = {
  title: "Ramadan",
  description:
    "Your Ramaḍān companion — a live ifṭār countdown, fasting progress and a daily worship checklist, kept privately on your device.",
  alternates: { canonical: "/ramadan" },
};

export default function RamadanPage() {
  return (
    <NoorPageFrame
      title="Ramadan"
      sub="Ifṭār countdown, fasts & daily worship"
      glyph="☾"
      back="/"
      maxW={760}
    >
      <RamadanView />
    </NoorPageFrame>
  );
}
