"use client";
import { HubPage } from "../../components/HubPage";
import { ToolsPrayerCard } from "../../components/ToolsPrayerCard";

export default function PrayerHub() {
  return (
    <HubPage destination="prayer" intro="Prayer times, your prayer log and the qibla.">
      <ToolsPrayerCard />
    </HubPage>
  );
}
