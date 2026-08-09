import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Hanken_Grotesk, IBM_Plex_Sans_Arabic, Amiri } from "next/font/google";
import { ServiceWorkerRegister } from "../components/ServiceWorkerRegister";
import { AdhkarReminderBanner } from "../components/AdhkarReminderBanner";
import { PrayerReminderScheduler } from "../components/PrayerReminderScheduler";
import { PlanReminderScheduler } from "../components/PlanReminderScheduler";
import { SyncBootstrap } from "../components/SyncBootstrap";
import { AppShellWrapper } from "../components/AppShellWrapper";
import { Onboarding } from "../components/Onboarding";
import { SITE_URL } from "../lib/site";
// Noor palette (all themes) — generated from packages/ui/src/themes.ts (ADR 0027).
// Imported before globals.css so the web's next/font overrides for --noor-ui/--noor-ar win.
import "@ummahlibrary/ui/noor-themes.css";
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
  metadataBase: new URL(SITE_URL),
  // Disable browser/Google machine translation app-wide: the app already ships
  // its own scholar-reviewed translations, and auto-translation corrupts the
  // Arabic Quran text. Renders <meta name="google" content="notranslate">.
  other: { google: "notranslate" },
  title: { default: "Ummah Library", template: "%s · Ummah Library" },
  description:
    "An open-source Quran reader — read the Quran with translations, recitations, tafsir and Islamic tools.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Ummah Library",
    title: "Ummah Library — the open-source Quran & Islamic library",
    description:
      "Read, listen, memorise and track — free, private and offline. No ads, no tracking, no account. A community Sadaqah Jariyah, licensed AGPL-3.0.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ummah Library — the open-source Quran & Islamic library",
    description:
      "Read, listen, memorise and track — free, private and offline. No ads, no tracking, no account.",
  },
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

/* Apply saved theme before first paint to avoid flash. Defaults to Obsidian (Noor
   is dark-first); maps the legacy "dark"/"light" values and sets data-mode. */
const themeScript = `(function(){try{
  var d=document.documentElement;
  var legacy={dark:"obsidian",light:"ivory"};
  var light={ivory:1,sepia:1,mint:1,rose:1};
  var dark={obsidian:1,midnight:1,emerald:1,ocean:1};
  var raw=localStorage.getItem("ul.theme")||"obsidian";
  var t=(dark[raw]||light[raw])?raw:(legacy[raw]||"obsidian");
  d.dataset.theme=t;
  d.dataset.mode=light[t]?"light":"dark";
  d.dataset.readingMode=localStorage.getItem("ul.readingMode")||"translation";
  /* First-run: flag before paint so the veil covers the app until onboarding mounts */
  if(!localStorage.getItem("ul.onboarded")) d.dataset.onboard="1";
  /* Noor: set CSS var font families after font vars are available */
  d.style.setProperty("--noor-ui","'Hanken Grotesk', system-ui, sans-serif");
  d.style.setProperty("--noor-ar","'IBM Plex Sans Arabic', serif");
}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      translate="no"
      className={`${hanken.variable} ${ibmArabic.variable} ${amiri.variable} notranslate`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {/* Pre-hydration cover for the first-run overlay (shown only when
            data-onboard="1"); the Onboarding component draws the slides on top. */}
        <div id="ul-onboard-veil" aria-hidden="true" />
        <Onboarding />
        <AdhkarReminderBanner />
        <PrayerReminderScheduler />
        <PlanReminderScheduler />
        <SyncBootstrap />
        <AppShellWrapper>{children}</AppShellWrapper>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
