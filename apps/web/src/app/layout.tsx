import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Hanken_Grotesk, IBM_Plex_Sans_Arabic, Amiri } from "next/font/google";
import { ServiceWorkerRegister } from "../components/ServiceWorkerRegister";
import { AdhkarReminderBanner } from "../components/AdhkarReminderBanner";
import { AppShellWrapper } from "../components/AppShellWrapper";
import "./globals.css";

/* ── Noor fonts ── */
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-arabic",
  display: "swap",
});

/* Keep Amiri for pages that still reference --font-amiri */
const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://app.ummahlibrary.org"),
  title: { default: "Ummah Library", template: "%s · Ummah Library" },
  description:
    "An open-source Quran reader — read the Quran with translations, recitations, tafsir and Islamic tools.",
  manifest: "/manifest.webmanifest",
  applicationName: "Ummah Library",
  appleWebApp: {
    capable: true,
    title: "Ummah Library",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B0F",
};

/* Apply saved theme before first paint to avoid flash. Defaults to dark (Noor is dark-first). */
const themeScript = `(function(){try{
  var d=document.documentElement;
  var t=localStorage.getItem("ul.theme")||"dark";
  d.dataset.theme=t;
  d.dataset.readingMode=localStorage.getItem("ul.readingMode")||"translation";
  /* Noor: set CSS var font families after font vars are available */
  d.style.setProperty("--noor-ui","'Hanken Grotesk', system-ui, sans-serif");
  d.style.setProperty("--noor-ar","'IBM Plex Sans Arabic', serif");
}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${ibmArabic.variable} ${amiri.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AdhkarReminderBanner />
        <AppShellWrapper>{children}</AppShellWrapper>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
