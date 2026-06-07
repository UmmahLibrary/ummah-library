import type { Metadata } from "next";
import Link from "next/link";
import { adhkarRepository } from "@ummahlibrary/api";
import { AdhkarView } from "../../components/AdhkarView";
import { AdhkarReminderToggle } from "../../components/AdhkarReminderToggle";
import { HijriToday } from "../../components/HijriToday";

export const metadata: Metadata = {
  title: "Adhkar — morning & evening",
  description:
    "The morning and evening adhkar (remembrances) from Ḥiṣn al-Muslim, with Arabic, transliteration, translation and a tap counter. Your progress stays on your device.",
  alternates: { canonical: "/adhkar" },
};

export default async function AdhkarPage() {
  const dhikr = await adhkarRepository.all();

  return (
    <>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">Adhkar</div>
        <div className="sub">Morning &amp; evening remembrances</div>
        <HijriToday />
      </header>
      <AdhkarReminderToggle />
      <AdhkarView dhikr={dhikr} />
    </>
  );
}
