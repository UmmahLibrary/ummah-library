import type { Metadata } from "next";

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: "Prayer",
  description: "Prayer times, your prayer log and the qibla direction.",
  alternates: { canonical: "/prayer" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
