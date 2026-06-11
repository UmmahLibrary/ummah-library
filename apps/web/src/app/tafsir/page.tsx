import type { Metadata } from "next";
import { pluginRegistry } from "@ummahlibrary/api";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { TafsirPicker } from "../../components/TafsirPicker";

export const metadata: Metadata = {
  title: "Tafsir",
  description:
    "Classical and contemporary commentary on the meanings of the Quran — read alongside any surah on Ummah Library.",
  alternates: { canonical: "/tafsir" },
};

const TAFSIRS = pluginRegistry.byKind("tafsir").map((t) => ({ id: t.id, name: t.name }));

export default function TafsirPage() {
  return (
    <NoorPageFrame
      title="Tafsir"
      sub="Classical commentary on the meanings of the Quran"
      glyph="✷"
      back="/"
    >
      <TafsirPicker tafsirs={TAFSIRS} />
      <div
        style={{
          marginTop: 32,
          padding: "24px",
          borderRadius: 14,
          background: "#14171F",
          border: "1px solid #242A38",
          fontSize: 15,
          color: "#9AA0B2",
          lineHeight: 1.7,
          fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
        }}
      >
        Open any surah from the{" "}
        <a href="/" style={{ color: "#E6B855", textDecoration: "none" }}>
          Quran index
        </a>{" "}
        to read tafsir commentary alongside the Arabic text. Use the display panel in the
        reader to select your preferred tafsir source.
      </div>
    </NoorPageFrame>
  );
}
