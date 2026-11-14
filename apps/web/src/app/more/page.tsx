"use client";
import Link from "next/link";
import { HubPage } from "../../components/HubPage";
import { useT } from "../../i18n/I18nProvider";

export default function MoreHub() {
  const t = useT();
  return (
    <HubPage destination="more" intro="hub.moreIntro">
      <Link
        href="/settings#text"
        className="nf-btn nf-btn--gold"
        style={{ justifySelf: "start" }}
      >
        {t("hub.comfortLink")}
      </Link>
    </HubPage>
  );
}
