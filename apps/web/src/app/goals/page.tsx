import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { ReadingGoalsView } from "../../components/ReadingGoalsView";

export const metadata: Metadata = {
  title: "Reading goals",
  description:
    "Set a daily Quran reading goal, keep a streak, and plan a khatma — all tracked privately on your device.",
  alternates: { canonical: "/goals" },
};

export default function GoalsPage() {
  return (
    <NoorPageFrame
      title="Reading Goals"
      sub="Build a daily habit with the Book of Allah"
      glyph="◎"
      back="/"
    >
      <ReadingGoalsView />
    </NoorPageFrame>
  );
}
