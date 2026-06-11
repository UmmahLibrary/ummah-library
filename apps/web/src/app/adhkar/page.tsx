import type { Metadata } from "next";
import { adhkarRepository } from "@ummahlibrary/api";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { AdhkarView } from "../../components/AdhkarView";
import { AdhkarReminderToggle } from "../../components/AdhkarReminderToggle";

export const metadata: Metadata = {
  title: "Adhkar — morning & evening",
  description:
    "The morning and evening adhkar (remembrances) from Ḥiṣn al-Muslim, with Arabic, transliteration, translation and a tap counter. Your progress stays on your device.",
  alternates: { canonical: "/adhkar" },
};

export default async function AdhkarPage() {
  const dhikr = await adhkarRepository.all();

  return (
    <NoorPageFrame
      title="Adhkār"
      sub="Morning & evening remembrances"
      glyph="☼"
      back="/"
    >
      <AdhkarReminderToggle />
      <AdhkarView dhikr={dhikr} />
    </NoorPageFrame>
  );
}
