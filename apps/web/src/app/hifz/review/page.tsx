import { quranRepository } from "@ummahlibrary/api";
import { NoorPageFrame } from "../../../components/NoorPageFrame";
import { HifzReview } from "../../../components/HifzReview";

export const metadata = { title: "Hifz review" };

export default async function HifzReviewPage() {
  const surahs = await quranRepository.listSurahs();
  const surahNames = Object.fromEntries(
    surahs.map((s) => [s.number, { transliteration: s.transliteration, name: s.name }]),
  );

  return (
    <NoorPageFrame title="Review" sub="Work through today's due āyāt" glyph="✦" back="/hifz">
      <HifzReview surahNames={surahNames} />
    </NoorPageFrame>
  );
}
