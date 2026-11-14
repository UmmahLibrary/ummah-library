import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AyahWords } from "./AyahWords";

/**
 * Quranic text integrity (ADR 0041). Every one of the 6,236 āyāt is rendered
 * through the reader's word component and must come out exactly as the Tanzil
 * dataset has it — every letter, every ḥaraka, in the same code-point order.
 * Guards against any styling or refactor that splits, trims, normalizes or
 * otherwise alters the text the reader sees.
 */
const DATA = resolve(__dirname, "../../../../packages/data/datasets/arabic-uthmani.json");
const { verses } = JSON.parse(readFileSync(DATA, "utf8")) as {
  verses: { sura: number; aya: number; text: string }[];
};

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");

describe("Quranic text integrity in the reader", () => {
  it("covers the whole Quran", () => {
    expect(verses).toHaveLength(6236);
  });

  it("renders every āyah's words exactly as the dataset has them", () => {
    const mismatches: string[] = [];
    for (const v of verses) {
      const html = renderToStaticMarkup(<AyahWords surah={v.sura} aya={v.aya} text={v.text} />);
      const words = [...html.matchAll(/<span class="w" data-w="\d+">([^<]*)<\/span>/g)].map((m) =>
        decode(m[1]!),
      );
      if (words.join(" ") !== v.text) mismatches.push(`${v.sura}:${v.aya}`);
    }
    expect(mismatches).toEqual([]);
  });

  it("never contains empty words (no doubled spaces in the source)", () => {
    const bad = verses.filter((v) => v.text.split(" ").some((w) => w.length === 0));
    expect(bad.map((v) => `${v.sura}:${v.aya}`)).toEqual([]);
  });
});
