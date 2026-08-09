import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { MosqueFinder } from "../../components/MosqueFinder";

export const metadata: Metadata = {
  title: "Nearby mosques",
  description:
    "Find mosques near you using OpenStreetMap, with directions to each. Your location stays on your device.",
  alternates: { canonical: "/mosques" },
};

export default function MosquesPage() {
  return (
    <NoorPageFrame
      title="Nearby Mosques"
      sub="Find a place to pray, wherever you are"
      glyph="🕌"
      back="/"
      maxW={720}
    >
      <MosqueFinder />
    </NoorPageFrame>
  );
}
