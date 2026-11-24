import type { Metadata } from "next";

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: "Learn",
  description: "Duʿās, adhkār, hadith and the 99 beautiful names of Allah.",
  alternates: { canonical: "/learn" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
