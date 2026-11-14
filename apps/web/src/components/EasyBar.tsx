"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { N, Icon } from "@ummahlibrary/ui";

/**
 * Easy mode's bottom bar: a large Back and Home on every page (Assistive
 * Access pattern), replacing the five-tab bar. Shown only when
 * `data-app-mode="easy"` (CSS in noor-everyone.css).
 */
export function EasyBar() {
  const pathname = usePathname();
  return (
    <nav className="easy-bar" aria-label="Easy mode">
      <button
        type="button"
        className="nf-btn"
        style={{ flex: 1, minHeight: 64, fontSize: 19 }}
        onClick={() =>
          window.history.length > 1 ? window.history.back() : (window.location.href = "/")
        }
        disabled={pathname === "/"}
      >
        <Icon name="arrowL" size={24} /> Back
      </button>
      <Link
        href="/"
        className="nf-btn nf-btn--gold"
        style={{ flex: 1, minHeight: 64, fontSize: 19, color: N.ink }}
      >
        <Icon name="home" size={24} /> Home
      </Link>
    </nav>
  );
}
