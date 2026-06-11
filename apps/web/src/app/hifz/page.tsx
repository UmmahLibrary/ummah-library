import { NoorPageFrame } from "../../components/NoorPageFrame";
import { HifzReview } from "../../components/HifzReview";

export const metadata = { title: "Hifz review" };

export default function HifzPage() {
  return (
    <NoorPageFrame
      title="Hifz Review"
      sub="Spaced-repetition memorization, tuned to your recall"
      glyph="✦"
      back="/"
    >
      <HifzReview />
    </NoorPageFrame>
  );
}
