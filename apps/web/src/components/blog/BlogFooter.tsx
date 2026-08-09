import Link from "next/link";
import { N } from "@ummahlibrary/ui";

export function BlogFooter() {
  return (
    <footer style={{ borderTop: `1px solid ${N.borderSoft}`, marginTop: 20 }}>
      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "24px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, color: N.faint }}>
          © {new Date().getFullYear()} Ummah Library · Open source
        </span>
        <div style={{ display: "flex", gap: 18 }}>
          <a
            href="https://github.com/UmmahLibrary/ummah-library"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 13, color: N.muted, textDecoration: "none" }}
          >
            GitHub
          </a>
          <Link href="/" style={{ fontSize: 13, color: N.muted, textDecoration: "none" }}>
            Open the app
          </Link>
        </div>
      </div>
    </footer>
  );
}
