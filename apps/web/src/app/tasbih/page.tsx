import type { Metadata } from "next";
import Link from "next/link";
import { TasbihCounter } from "../../components/TasbihCounter";

export const metadata: Metadata = {
  title: "Tasbih counter",
  description:
    "A simple digital tasbīḥ for your dhikr — SubḥānAllāh, Alḥamdulillāh, Allāhu Akbar and more, counted privately on your device.",
  alternates: { canonical: "/tasbih" },
};

export default function TasbihPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">Tasbih</div>
        <div className="sub">A counter for your dhikr</div>
      </header>
      <TasbihCounter />
    </>
  );
}
