import type { Metadata } from "next";
import Link from "next/link";
import { QiblaCompass } from "../../components/QiblaCompass";

export const metadata: Metadata = {
  title: "Qibla direction",
  description:
    "Find the direction of the Kaaba in Makkah from your location, with a live compass. Computed on Ummah Library — your location stays on your device.",
  alternates: { canonical: "/qibla" },
};

export default function QiblaPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">Qibla</div>
        <div className="sub">Direction of the Kaaba from your location</div>
      </header>
      <QiblaCompass />
    </>
  );
}
