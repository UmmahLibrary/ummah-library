import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { PlansView } from "../../components/PlansView";

export const metadata: Metadata = {
  title: "Reading Plans",
  description:
    "Structured journeys through the Quran — finish in Ramadan, read Juzʾ ʿAmma, or savour beloved sūrahs. Progress is kept privately on your device.",
  alternates: { canonical: "/plans" },
};

export default function PlansPage() {
  return (
    <NoorPageFrame
      title="Reading Plans"
      sub="Structured journeys through the Book"
      glyph="🧭"
      back="/"
      maxW={860}
    >
      <PlansView />
    </NoorPageFrame>
  );
}
