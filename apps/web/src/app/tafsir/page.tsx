import type { Metadata } from "next";
import { pluginRegistry } from "@ummahlibrary/api";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { TafsirPicker } from "../../components/TafsirPicker";
import { TafsirSample } from "../../components/TafsirSample";

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
      maxW={760}
    >
      <TafsirPicker tafsirs={TAFSIRS} />
      <TafsirSample tafsirs={TAFSIRS} />
    </NoorPageFrame>
  );
}
