import type { Metadata } from "next";
import { pluginRegistry, quranRepository } from "@ummahlibrary/api";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { DownloadsManager } from "../../components/DownloadsManager";

export const metadata: Metadata = {
  title: "Downloads",
  description:
    "Manage reciter audio saved on this device for offline listening — see what's downloaded, its size, and remove it. Stored entirely in your browser.",
  alternates: { canonical: "/downloads" },
};

export default async function DownloadsPage() {
  const surahs = await quranRepository.listSurahs();
  const surahNames = Object.fromEntries(surahs.map((s) => [s.number, s.transliteration]));
  const reciterNames = Object.fromEntries(
    pluginRegistry.byKind("reciter").map((r) => [r.id, r.name]),
  );

  return (
    <NoorPageFrame
      title="Downloads"
      sub="Reciter audio saved for offline listening"
      glyph="⤓"
      back="/"
      maxW={720}
    >
      <DownloadsManager surahNames={surahNames} reciterNames={reciterNames} />
    </NoorPageFrame>
  );
}
