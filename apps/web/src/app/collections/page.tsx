import type { Metadata } from "next";
import Link from "next/link";
import { CollectionsView } from "../../components/CollectionsView";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Your saved ayahs, grouped into collections with personal notes — kept privately on your device.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">Collections</div>
        <div className="sub">Saved ayahs &amp; notes</div>
      </header>
      <CollectionsView />
    </>
  );
}
