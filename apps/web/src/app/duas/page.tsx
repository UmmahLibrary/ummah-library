import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { DuasView } from "../../components/DuasView";

export const metadata: Metadata = {
  title: "Duʿās",
  description:
    "Qurʾānic supplications — a duʿā of the day and a curated collection grouped by moment, with their references.",
  alternates: { canonical: "/duas" },
};

export default function DuasPage() {
  return (
    <NoorPageFrame
      title="Duʿās"
      sub="Qurʾānic supplications"
      glyph="🤲"
      back="/"
      maxW={760}
    >
      <DuasView />
    </NoorPageFrame>
  );
}
