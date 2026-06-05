import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Amiri, Noto_Nastaliq_Urdu } from "next/font/google";
import { ServiceWorkerRegister } from "../components/ServiceWorkerRegister";
import "./globals.css";

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-nastaliq",
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

// Apply the saved theme before paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem("ul.theme");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${amiri.variable} ${nastaliq.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="container" id="main">
          {children}
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
