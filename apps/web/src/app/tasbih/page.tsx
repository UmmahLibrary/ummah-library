import type { Metadata } from "next";
import { TasbihPageClient } from "../../components/TasbihPageClient";

export const metadata: Metadata = {
  title: "Tasbih counter",
  description:
    "A simple digital tasbīḥ for your dhikr — SubḥānAllāh, Alḥamdulillāh, Allāhu Akbar and more, counted privately on your device.",
  alternates: { canonical: "/tasbih" },
};

export default function TasbihPage() {
  return <TasbihPageClient />;
}
