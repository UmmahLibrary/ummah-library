import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Ummah Library",
  description: "An open-source Quran platform and Islamic knowledge ecosystem.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          background: "#0b0f0e",
          color: "#e7efe9",
        }}
      >
        {children}
      </body>
    </html>
  );
}
