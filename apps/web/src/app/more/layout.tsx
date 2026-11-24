import type { Metadata } from "next";

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: "More",
  description: "Settings, tools and your reading so far.",
  alternates: { canonical: "/more" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
