import { ImageResponse } from "next/og";
import { SITE_HOST } from "../lib/site";

/**
 * The social-share card (1200×630) for link unfurls on LinkedIn, X, WhatsApp,
 * Slack, etc. Generated at build time by next/og — no static asset to maintain,
 * no network fonts fetched (relies on the bundled default font, so all copy here
 * stays Latin-only). Branded with the Obsidian palette + the Khatam motif from
 * packages/ui (themes.ts / Khatam.tsx) so the card matches the app.
 */
export const alt = "Ummah Library — open-source Quran reader & Islamic knowledge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Obsidian (default Noor theme) — kept in sync with packages/ui/src/themes.ts.
const BG = "#0a0b0f";
const GOLD = "#e6b855";
const GOLD_HI = "#f4d58a";
const FG = "#f4f1ea";
const MUTED = "#9aa0b2";
const BORDER = "#242a38";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: BG,
          backgroundImage:
            "radial-gradient(1200px 500px at 80% -10%, rgba(230,184,85,0.16), rgba(10,11,15,0))",
          color: FG,
          fontFamily: "sans-serif",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="84" height="84" viewBox="0 0 100 100">
            <rect
              x="22"
              y="22"
              width="56"
              height="56"
              fill="none"
              stroke={GOLD}
              strokeWidth="3"
            />
            <polygon
              points="50,10 90,50 50,90 10,50"
              fill="none"
              stroke={GOLD}
              strokeWidth="3"
            />
            <circle cx="50" cy="50" r="11" fill="none" stroke={GOLD} strokeWidth="3" />
          </svg>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, letterSpacing: 0.5 }}>
            <span>Ummah</span>
            <span style={{ color: GOLD, marginLeft: 14 }}>Library</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.1 }}>
            The open-source Quran &amp; Islamic library
          </div>
          <div style={{ display: "flex", fontSize: 36, color: MUTED, lineHeight: 1.35 }}>
            Read, listen, memorise &amp; track — free, private, offline. No ads, no
            tracking, no account.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `2px solid ${BORDER}`,
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: GOLD_HI, fontWeight: 600 }}>
            {SITE_HOST}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: MUTED }}>
            AGPL-3.0 · A Sadaqah Jariyah
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
