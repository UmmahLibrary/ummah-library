import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <header className="reader-head" style={{ marginTop: "2rem" }}>
        <div className="name-ar arabic" style={{ fontSize: "3rem" }}>
          ٤٠٤
        </div>
        <div className="name-en">Page not found</div>
        <div className="sub">This page doesn&apos;t exist or has moved.</div>
      </header>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" className="audio-play" style={{ textDecoration: "none" }}>
          ← Back to home
        </Link>
        <Link href="/search" className="chip">
          Search the Quran
        </Link>
      </div>
    </>
  );
}
