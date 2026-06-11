import type { Metadata } from "next";
import { asmaRepository } from "@ummahlibrary/api";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { AsmaView } from "../../components/AsmaView";

export const metadata: Metadata = {
  title: "99 Names of Allah",
  description:
    "The 99 Names of Allah (Asmāʾ al-Ḥusná) with transliteration, meaning and Quranic references — browse and mark the ones you've learned, privately on your device.",
  alternates: { canonical: "/names" },
};

export default async function NamesPage() {
  const names = await asmaRepository.all();

  return (
    <NoorPageFrame
      title="The 99 Names"
      sub="Al-Asmāʾ al-Ḥusnā · the Most Beautiful Names of Allah"
      glyph="﷽"
      back="/"
      maxW={1000}
    >
      <AsmaView names={names} />
    </NoorPageFrame>
  );
}
