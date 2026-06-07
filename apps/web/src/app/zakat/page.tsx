import type { Metadata } from "next";
import Link from "next/link";
import { ZakatCalculator } from "../../components/ZakatCalculator";

export const metadata: Metadata = {
  title: "Zakat calculator",
  description:
    "Estimate your zakat al-māl on cash, gold, silver, investments and business assets using the agreed Sunni method (2.5% above the niṣāb). Calculated entirely on your device.",
  alternates: { canonical: "/zakat" },
};

export default function ZakatPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">Zakat calculator</div>
        <div className="sub">Zakat al-māl on monetary wealth</div>
      </header>
      <ZakatCalculator />
    </>
  );
}
