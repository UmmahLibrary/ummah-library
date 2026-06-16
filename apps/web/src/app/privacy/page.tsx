import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Ummah Library is local-first: your data stays on your device. No account, no server-side user data, no tracking, no ads.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "16 June 2026";

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: "1.15rem", marginBottom: 10 }}>{heading}</h2>
      <div style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: "0.97rem" }}>{children}</div>
    </section>
  );
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
      <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
        Ummah Library is <strong>local-first</strong>. We don’t ask you to create an account, and we
        don’t keep a copy of your data on our servers. Almost everything happens on your own device.
        This policy explains the few times information leaves it, and why.
      </p>

      <Section heading="Your data stays on your device">
        Bookmarks, reading goals, Hifz (memorization) progress, the tasbih counter, your prayer log,
        reading plans, and app settings are all stored locally on your device using your browser’s
        storage (on the web) or on-device app storage (on mobile). We have no account system and no
        database of users — that data is never sent to us and we cannot see it. You can export or
        erase it at any time from <strong>Settings → Data</strong>.
      </Section>

      <Section heading="Location">
        Location is used only when you open <strong>Prayer Times</strong> or <strong>Qibla</strong>,
        and only with your permission:
        <ul style={{ margin: "10px 0 0", paddingLeft: 22 }}>
          <li style={{ marginBottom: 6 }}>
            <strong>Prayer Times:</strong> your coordinates are sent to our prayer-times endpoint to
            calculate the day’s ṣalāh times for your location. They are used for that calculation
            only — not stored, not linked to any identity, and not shared or sold.
          </li>
          <li>
            <strong>Qibla:</strong> the direction to the Kaaba is computed entirely on your device.
            Your coordinates never leave it.
          </li>
        </ul>
      </Section>

      <Section heading="Content we fetch">
        To show you the Qur’ān, translations, tafsīr, and recitation audio, the app requests that
        content from our servers and from third-party content providers and CDNs (including
        quran.com, everyayah.com, and jsDelivr). Like any web request, these carry standard
        technical information such as your IP address. We don’t use this to build a profile of you.
      </Section>

      <Section heading="No tracking, no ads">
        We don’t use analytics or tracking SDKs, we don’t set advertising cookies, and we don’t show
        ads. The app is free and ad-free.
      </Section>

      <Section heading="Children">
        Ummah Library is suitable for all ages and does not knowingly collect personal information
        from anyone, including children.
      </Section>

      <Section heading="Open source">
        Ummah Library is free and open source, licensed under AGPL-3.0. You can review exactly how it
        handles data in the source code.
      </Section>

      <Section heading="Changes & contact">
        If this policy changes, we’ll update the date below. Questions about privacy can be sent to{" "}
        <a href="mailto:ummahlibrary@outlook.com" style={{ color: "var(--gold, #d4a843)" }}>
          ummahlibrary@outlook.com
        </a>
        .
      </Section>

      <p style={{ marginTop: 32, color: "var(--faint, #6b7280)", fontSize: "0.85rem" }}>
        Last updated {UPDATED}.
      </p>
    </NoorPageFrame>
  );
}
