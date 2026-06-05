import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Amiri } from "next/font/google";
import { ServiceWorkerRegister } from "../components/ServiceWorkerRegister";
import "./globals.css";

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://app.ummahlibrary.org"),
  title: { default: "Ummah Library", template: "%s · Ummah Library" },
  description: "An open-source Quran reader — read the Quran with translations.",
  manifest: "/manifest.webmanifest",
  applicationName: "Ummah Library",
  appleWebApp: { capable: true, title: "Ummah Library", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f0e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={amiri.variable}>
      <body>
        <div className="container">{children}</div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
