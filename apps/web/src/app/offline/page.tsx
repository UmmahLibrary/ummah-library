import Link from "next/link";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main style={{ textAlign: "center", padding: "5rem 1rem" }}>
      <h1 style={{ fontSize: "1.5rem" }}>You’re offline</h1>
      <p style={{ color: "var(--muted)" }}>
        Surahs you’ve already opened are still available. Reconnect to browse the rest.
      </p>
      <p style={{ marginTop: "2rem" }}>
        <Link href="/" className="back-link">
          ← Back to surahs
        </Link>
      </p>
    </main>
  );
}
