import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { ZakatCalculator } from "../../components/ZakatCalculator";

export const metadata: Metadata = {
  title: "Zakat calculator",
  description:
    "Estimate your zakat al-māl on cash, gold, silver, investments and business assets using the agreed Sunni method (2.5% above the niṣāb). Calculated entirely on your device.",
  alternates: { canonical: "/zakat" },
};

export default function ZakatPage() {
  return (
    <NoorPageFrame
      title="Zakat Calculator"
      sub="2.5% on wealth held above niṣāb for one lunar year"
      glyph="⊜"
      back="/"
    >
      <ZakatCalculator />
    </NoorPageFrame>
  );
}
