"use client";
import { Btn, Khatam, N } from "@ummahlibrary/ui";

const CONTRIBUTING_URL = "https://github.com/UmmahLibrary/ummah-library/blob/main/CONTRIBUTING.md";

export function ContributeCallout() {
  return (
    <div
      style={{
        margin: "40px 0",
        borderRadius: 16,
        padding: 28,
        background: N.goldSoft,
        border: `1px solid ${N.gold}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Khatam size={20} color={N.gold} sw={1.8} />
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: N.fg }}>
          Contribute to Ummah Library
        </h3>
      </div>
      <p
        style={{
          margin: "0 0 18px",
          fontSize: 15,
          lineHeight: 1.65,
          color: N.muted,
          maxWidth: 560,
        }}
      >
        Ummah Library is open source. If this post left you with an opinion about the boundary, or
        you&rsquo;re looking for a good first issue, we&rsquo;d welcome the pull request.
      </p>
      <Btn variant="gold" icon="arrowR" onClick={() => window.open(CONTRIBUTING_URL, "_blank")}>
        Read CONTRIBUTING.md
      </Btn>
    </div>
  );
}
