import Link from "next/link";
import { HifzReview } from "../../components/HifzReview";

export const metadata = { title: "Hifz review" };

export default function HifzPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← All surahs
      </Link>
      <header className="site-head">
        <div>
          <h1>Hifz review</h1>
          <p>Spaced-repetition memorization — your progress stays on this device.</p>
        </div>
      </header>
      <HifzReview />
    </>
  );
}
