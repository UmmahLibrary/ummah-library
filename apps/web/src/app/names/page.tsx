import type { Metadata } from "next";
import Link from "next/link";
import { asmaRepository } from "@ummahlibrary/api";
import { AsmaView } from "../../components/AsmaView";

export const metadata: Metadata = {
  title: "99 Names of Allah",
  description:
    "The 99 Names of Allah (Asmāʾ al-Ḥusná) with transliteration, meaning and Quranic references — browse and mark the ones you’ve learned, privately on your device.",
  alternates: { canonical: "/names" },
};

export default async function NamesPage() {
  const names = await asmaRepository.all();

  return (
    <>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">99 Names of Allah</div>
        <div className="sub">Asmāʾ al-Ḥusná</div>
      </header>
      <AsmaView names={names} />
    </>
  );
}
