import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED } from "@ummahlibrary/core";
import { NoorPageFrame } from "../../components/NoorPageFrame";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Ummah Library is local-first: your data stays on your device. No account, no server-side user data, no tracking, no ads.",
  alternates: { canonical: "/privacy" },
};

const EMAIL_RE = /([\w.+-]+@[\w.-]+\.\w+)/;

/** Render policy text: `**bold**` → <strong>, and any email → a mailto link. */
function inline(text: string, k: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).flatMap((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return [<strong key={`${k}-b${i}`}>{part.slice(2, -2)}</strong>];
    }
    return part.split(EMAIL_RE).map((seg, j) =>
      EMAIL_RE.test(seg) ? (
        <a key={`${k}-${i}-${j}`} href={`mailto:${seg}`} style={{ color: "var(--gold, #d4a843)" }}>
          {seg}
        </a>
      ) : (
        <span key={`${k}-${i}-${j}`}>{seg}</span>
      ),
    );
  });
}

export default function PrivacyPage() {
  return (
    <NoorPageFrame
      title="Privacy Policy"
      sub="What we collect — and what we don’t"
      glyph="🔒"
      back="/"
      maxW={720}
    >
      <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>{inline(PRIVACY_INTRO, "intro")}</p>

      {PRIVACY_SECTIONS.map((section, s) => (
        <section key={section.heading} style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: 10 }}>{section.heading}</h2>
          <div style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: "0.97rem" }}>
            {section.body.map((p, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : "10px 0 0" }}>
                {inline(p, `s${s}-p${i}`)}
              </p>
            ))}
            {section.list && (
              <ul style={{ margin: "10px 0 0", paddingLeft: 22 }}>
                {section.list.map((li, i) => (
                  <li key={i} style={{ marginBottom: i === section.list!.length - 1 ? 0 : 6 }}>
                    {inline(li, `s${s}-l${i}`)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}

      <p style={{ marginTop: 32, color: "var(--faint, #6b7280)", fontSize: "0.85rem" }}>
        Last updated {PRIVACY_UPDATED}.
      </p>
    </NoorPageFrame>
  );
}
