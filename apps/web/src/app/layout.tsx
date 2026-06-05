import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Amiri } from "next/font/google";
import "./globals.css";

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Ummah Library", template: "%s · Ummah Library" },
  description: "An open-source Quran reader — read the Quran with translations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={amiri.variable}>
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
