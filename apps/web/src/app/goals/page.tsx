import type { Metadata } from "next";
import Link from "next/link";
import { ReadingGoalsView } from "../../components/ReadingGoalsView";

export const metadata: Metadata = {
  title: "Reading goals",
  description:
    "Set a daily Quran reading goal, keep a streak, and plan a khatma — all tracked privately on your device.",
  alternates: { canonical: "/goals" },
};

export default function GoalsPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">Reading goals</div>
        <div className="sub">Daily goal · streak · khatma planner</div>
      </header>
      <ReadingGoalsView />
    </>
  );
}
