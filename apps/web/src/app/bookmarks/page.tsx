import type { Metadata } from "next";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { CollectionsView } from "../../components/CollectionsView";

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Your saved verses and collections — kept privately on your device.",
  alternates: { canonical: "/bookmarks" },
};

export default function BookmarksPage() {
  return (
    <NoorPageFrame
      title="Bookmarks"
      sub="Your saved verses and collections"
      glyph="❑"
      back="/"
      maxW={860}
    >
      <CollectionsView />
    </NoorPageFrame>
  );
}
