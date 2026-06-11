import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { DataBackup } from "../../components/DataBackup";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Export and import your Ummah Library data — bookmarks, Hifz progress, reading goals and settings — as a local backup file. No account, no server.",
  alternates: { canonical: "/settings" },
};

export default function SettingsPage() {
  return (
    <NoorPageFrame
      title="Settings"
      sub="Tailor the app to your practice"
      glyph="⚙"
      back="/"
    >
      <DataBackup />
    </NoorPageFrame>
  );
}
