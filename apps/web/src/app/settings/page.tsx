import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { ThemePicker } from "../../components/ThemePicker";
import { LanguagePicker } from "../../components/LanguagePicker";
import { SyncSettings } from "../../components/SyncSettings";
import { DataBackup } from "../../components/DataBackup";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Sync your Ummah Library data across devices — end-to-end encrypted, no account — or export and import it as a local backup file. Bookmarks, Hifz progress, reading goals and settings.",
  alternates: { canonical: "/settings" },
};

export default function SettingsPage() {
  return (
    <NoorPageFrame
      title="Settings"
      sub="Tailor the app to your practice"
      glyph="⚙"
      back="/"
      maxW={620}
    >
      <ThemePicker />
      <div style={{ height: 1, background: "var(--noor-border)", margin: "30px 0" }} />
      <LanguagePicker />
      <div style={{ height: 1, background: "var(--noor-border)", margin: "30px 0" }} />
      <SyncSettings />
      <div style={{ height: 1, background: "var(--noor-border)", margin: "30px 0" }} />
      <DataBackup />
    </NoorPageFrame>
  );
}
