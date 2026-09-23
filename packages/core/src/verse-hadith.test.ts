import { describe, expect, it } from "vitest";
import {
  MIN_QUOTE_WORDS,
  buildVerseHadithLinks,
  buildVerseIndex,
  findQuotations,
  parseVerseKey,
} from "./verse-hadith";

/** Six words, so it clears MIN_QUOTE_WORDS on its own. */
const AYAH = {
  sura: 33,
  aya: 21,
  text: "لَقَدْ كَانَ لَكُمْ فِى رَسُولِ ٱللَّهِ أُسْوَةٌ حَسَنَةٌ",
};

/** A different six-word verse, for "doesn't match everything" checks. */
const OTHER = {
  sura: 2,
  aya: 255,
  text: "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ",
};

describe("buildVerseIndex", () => {
  it("indexes every window of a long-enough verse", () => {
    const index = buildVerseIndex([AYAH]);
    // 8 words, windows of 6 → 3 windows.
    expect(index.windows.size).toBe(3);
    expect(index.minWords).toBe(MIN_QUOTE_WORDS);
  });

  it("does not index a verse shorter than the threshold", () => {
    const short = { sura: 55, aya: 64, text: "مُدْهَآمَّتَانِ" };
    expect(buildVerseIndex([short]).windows.size).toBe(0);
  });

  it("excludes the Basmala, which is four words and would otherwise dominate", () => {
    // The Basmala opens most surahs and a great many hadith. If it were
    // indexable it would be the most "quoted" verse in the corpus by a wide
    // margin and would bury every real link — the length threshold is what
    // keeps it out, without a special case for it.
    const basmala = { sura: 1, aya: 1, text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ" };
    expect(buildVerseIndex([basmala]).windows.size).toBe(0);
  });

  it("maps one window to every verse containing it (mutashābihāt)", () => {
    const a = { sura: 26, aya: 9, text: "وَإِنَّ رَبَّكَ لَهُوَ ٱلْعَزِيزُ ٱلرَّحِيمُ ٱلْحَكِيمُ" };
    const b = {
      sura: 26,
      aya: 175,
      text: "وَإِنَّ رَبَّكَ لَهُوَ ٱلْعَزِيزُ ٱلرَّحِيمُ ٱلْحَكِيمُ",
    };
    const index = buildVerseIndex([a, b]);
    expect([...index.windows.values()][0]).toEqual(["26:9", "26:175"]);
  });
});

describe("findQuotations", () => {
  const index = buildVerseIndex([AYAH, OTHER]);

  it("finds a verse quoted verbatim inside a longer hadith", () => {
    const hadith = `حدثنا فلان قال ${AYAH.text} وقال بعد ذلك كلاما آخر`;
    expect(findQuotations(hadith, index)).toEqual([
      { verse: "33:21", quote: "لقد كان لكم في رسول الله اسوه حسنه" },
    ]);
  });

  it("matches despite tashkeel, alef and ta-marbuta differences", () => {
    // Same words, stripped of diacritics and written with plain alef — the
    // normalisation is the whole reason a real corpus matches at all.
    const bare = "لقد كان لكم في رسول الله اسوة حسنة";
    expect(findQuotations(bare, index).map((q) => q.verse)).toEqual(["33:21"]);
  });

  it("reports the full shared span, not just the first window", () => {
    const [hit] = findQuotations(AYAH.text, index);
    // All 8 words coincide, so the merged run is the whole verse.
    expect(hit?.quote.split(" ")).toHaveLength(8);
  });

  it("ignores an overlap shorter than the threshold", () => {
    // Five words of the verse — one short. A near-miss must not link.
    const nearMiss = "قال لقد كان لكم في رسول ثم سكت";
    expect(findQuotations(nearMiss, index)).toEqual([]);
  });

  it("returns nothing for text with no overlap", () => {
    expect(findQuotations("حدثنا محمد بن بشار قال حدثنا يحيى", index)).toEqual([]);
  });

  it("returns nothing for text shorter than the threshold", () => {
    expect(findQuotations("قال رسول الله", index)).toEqual([]);
  });

  it("orders results by surah then ayah", () => {
    const both = `${OTHER.text} ثم قال ${AYAH.text}`;
    expect(findQuotations(both, index).map((q) => q.verse)).toEqual(["2:255", "33:21"]);
  });
});

describe("buildVerseHadithLinks", () => {
  const verses = [AYAH, OTHER];

  it("keys links by verse and records the relation and quote", () => {
    const links = buildVerseHadithLinks(verses, [
      { collectionId: "eng-bukhari", number: 7, arabic: `باب ${AYAH.text}` },
    ]);
    expect(links).toEqual({
      "33:21": [
        {
          collectionId: "eng-bukhari",
          number: 7,
          relation: "quotes",
          quote: "لقد كان لكم في رسول الله اسوه حسنه",
        },
      ],
    });
  });

  it("skips hadith with no Arabic text", () => {
    // English-only entries carry nothing to match; they must not throw either.
    expect(buildVerseHadithLinks(verses, [{ collectionId: "eng-nasai", number: 1 }])).toEqual({});
  });

  it("collects several hadith under one verse, ordered by collection then number", () => {
    const links = buildVerseHadithLinks(verses, [
      { collectionId: "eng-muslim", number: 12, arabic: AYAH.text },
      { collectionId: "eng-bukhari", number: 99, arabic: AYAH.text },
      { collectionId: "eng-bukhari", number: 4, arabic: AYAH.text },
    ]);
    expect(links["33:21"]?.map((l) => `${l.collectionId}#${l.number}`)).toEqual([
      "eng-bukhari#4",
      "eng-bukhari#99",
      "eng-muslim#12",
    ]);
  });

  it("links one hadith to every verse it quotes", () => {
    const links = buildVerseHadithLinks(verses, [
      { collectionId: "eng-bukhari", number: 1, arabic: `${AYAH.text} و ${OTHER.text}` },
    ]);
    expect(Object.keys(links).sort()).toEqual(["2:255", "33:21"]);
  });

  it("is deterministic — the same input yields the same output", () => {
    const input = [
      { collectionId: "eng-muslim", number: 3, arabic: AYAH.text },
      { collectionId: "eng-bukhari", number: 8, arabic: OTHER.text },
    ];
    expect(JSON.stringify(buildVerseHadithLinks(verses, input))).toBe(
      JSON.stringify(buildVerseHadithLinks(verses, input)),
    );
  });

  it("honours a custom threshold", () => {
    // At three words the near-miss above becomes a match — which is exactly the
    // noise MIN_QUOTE_WORDS exists to exclude.
    const loose = buildVerseHadithLinks(
      verses,
      [{ collectionId: "eng-bukhari", number: 1, arabic: "قال لقد كان لكم في رسول ثم سكت" }],
      3,
    );
    expect(Object.keys(loose)).toEqual(["33:21"]);
  });
});

describe("parseVerseKey", () => {
  it("parses a well-formed key", () => {
    expect(parseVerseKey("2:255")).toEqual({ sura: 2, aya: 255 });
  });

  it.each(["", "2", "2:", ":255", "x:y", "0:1", "2:0"])("rejects %j", (bad) => {
    expect(parseVerseKey(bad)).toBeNull();
  });
});
