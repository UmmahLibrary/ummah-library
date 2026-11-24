import type { Metadata } from "next";

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: "Worship & Tools",
  description: "Prayer times, qibla, tasbih, zakat, the Hijri calendar and more, in one place.",
  alternates: { canonical: "/tools" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
