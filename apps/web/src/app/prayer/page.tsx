"use client";
import { HubPage } from "../../components/HubPage";
import { ToolsPrayerCard } from "../../components/ToolsPrayerCard";

export default function PrayerHub() {
  return (
    <HubPage destination="prayer" intro="hub.prayerIntro">
      <ToolsPrayerCard />
    </HubPage>
  );
}
