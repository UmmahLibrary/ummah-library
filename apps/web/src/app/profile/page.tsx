import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { ProfileView } from "../../components/ProfileView";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your reading, memorization and worship journey — kept privately on your device.",
  alternates: { canonical: "/profile" },
};

export default function ProfilePage() {
  return (
    <NoorPageFrame
      title="Profile"
      sub="Your journey, on this device"
      glyph="✦"
      back="/"
      maxW={760}
    >
      <ProfileView />
    </NoorPageFrame>
  );
}
