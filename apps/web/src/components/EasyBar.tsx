"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { N, Icon } from "@ummahlibrary/ui";
import { useIntl } from "../i18n/I18nProvider";

/**
 * Easy mode's bottom bar: a large Back and Home on every page (Assistive
 * Access pattern), replacing the five-tab bar. Shown only when
 * `data-app-mode="easy"` (CSS in noor-everyone.css).
 */
export function EasyBar() {
  const pathname = usePathname();
  const { t, dir } = useIntl();
  return (
    <nav className="easy-bar" aria-label={t("comfort.easyTitle")}>
      <button
        type="button"
        className="nf-btn"
        style={{ flex: 1, minHeight: 64, fontSize: 19 }}
        onClick={() =>
          window.history.length > 1 ? window.history.back() : (window.location.href = "/")
        }
        disabled={pathname === "/"}
      >
        <Icon name={dir === "rtl" ? "arrowR" : "arrowL"} size={24} /> {t("onb.back")}
      </button>
      <Link
        href="/"
        className="nf-btn nf-btn--gold"
        style={{ flex: 1, minHeight: 64, fontSize: 19, color: N.ink }}
      >
        <Icon name="home" size={24} /> {t("easy.home")}
      </Link>
    </nav>
  );
}
