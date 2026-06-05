import Link from "next/link";
import { pluginRegistry } from "@ummahlibrary/api";
import { HadithBrowser } from "../../components/HadithBrowser";

export const metadata = { title: "Hadith" };

const COLLECTIONS = pluginRegistry.byKind("hadith").map((c) => ({ id: c.id, name: c.name }));

export default function HadithPage() {
  return (
    <>
      <Link href="/" className="back-link">
        ← All surahs
      </Link>
      <header className="site-head">
        <div>
          <h1>Hadith</h1>
          <p>Browse hadith collections, book by book.</p>
        </div>
      </header>
      <HadithBrowser collections={COLLECTIONS} />
      <p className="foot">Source: fawazahmed0/hadith-api</p>
    </>
  );
}
