import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { SettingsView } from "../../components/SettingsView";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Language, text size, theme, Quran script, Easy and Kids modes, accessibility, habit tracking, and your data — sync, backup and erase.",
  alternates: { canonical: "/settings" },
};

export default function SettingsPage() {
  return (
    <NoorPageFrame
      title="Settings"
      sub="Tailor the app to your practice"
      glyph="⚙"
      back="/"
      maxW={680}
    >
      <SettingsView />
    </NoorPageFrame>
  );
}
