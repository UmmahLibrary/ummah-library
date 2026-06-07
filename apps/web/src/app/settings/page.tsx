import type { Metadata } from "next";
import Link from "next/link";
import { DataBackup } from "../../components/DataBackup";

export const metadata: Metadata = {
  title: "Your data",
  description:
    "Export and import your Ummah Library data — bookmarks, Hifz progress, reading goals and settings — as a local backup file. No account, no server.",
  alternates: { canonical: "/settings" },
};

export default function SettingsPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <header className="reader-head">
        <div className="name-en">Your data</div>
        <div className="sub">Backup &amp; restore — local, no account</div>
      </header>
      <DataBackup />
    </>
  );
}
