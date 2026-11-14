"use client";
import Link from "next/link";
import { HubPage } from "../../components/HubPage";

export default function MoreHub() {
  return (
    <HubPage destination="more" intro="Settings, tools and your reading so far.">
      <Link
        href="/settings#comfort"
        className="nf-btn nf-btn--gold"
        style={{ justifySelf: "start" }}
      >
        Reading comfort: text size, Easy mode, language
      </Link>
    </HubPage>
  );
}
