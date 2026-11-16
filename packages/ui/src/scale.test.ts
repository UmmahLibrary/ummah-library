import { describe, expect, it } from "vitest";
import {
  elevation,
  nativeShadow,
  nativeText,
  quranType,
  radius,
  scriptLineHeight,
  space,
  type,
  type SpaceStep,
  type TypeRole,
} from "./scale";
import { rad, scaleLines, shadow, sp, text } from "./scale-css";
import { renderThemesCss, renderTokensCss } from "./theme-css";

const css = renderTokensCss();
const varsIn = (value: string) => [...value.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]);

describe("Noor scale tokens (ADR 0042)", () => {
  it("spacing sits on a 4-point grid with 2-point half steps", () => {
    for (const [k, v] of Object.entries(space)) expect(v).toBe(Number(k) * 4);
  });

  it("radius steps grow, ending in a pill", () => {
    const values = Object.values(radius);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
    expect(radius.pill).toBeGreaterThan(500);
  });

  it("the type ramp runs from largest to smallest with readable leading", () => {
    const roles = Object.values(type);
    for (let i = 1; i < roles.length; i++) {
      expect(roles[i]!.size).toBeLessThanOrEqual(roles[i - 1]!.size);
    }
    for (const r of roles) expect(r.lineHeight / r.size).toBeGreaterThanOrEqual(1.2);
    // Smallest interface text stays at or above 12px.
    expect(Math.min(...roles.map((r) => r.size))).toBeGreaterThanOrEqual(12);
  });

  it("Quranic roles leave room for stacked marks (line height ≥ 1.75× size)", () => {
    for (const q of Object.values(quranType)) {
      expect(q.lineHeight / q.size).toBeGreaterThanOrEqual(1.75);
    }
  });

  it("Arabic-script interface text gets taller lines, Nastaʿlīq the tallest", () => {
    const body = type.body;
    const latin = nativeText("body");
    const arabic = nativeText("body", "arabic");
    const urdu = nativeText("body", "nastaliq");
    expect(latin.lineHeight).toBe(body.lineHeight);
    expect(arabic.lineHeight).toBeGreaterThan(latin.lineHeight);
    expect(urdu.lineHeight).toBeGreaterThan(arabic.lineHeight);
    expect(urdu.lineHeight).toBeGreaterThanOrEqual(body.size * 2);
    expect(scriptLineHeight(10, "latin", 30)).toBe(30);
  });

  it("drops case and letter spacing for Arabic script (they break joining)", () => {
    expect(nativeText("overline")).toMatchObject({
      textTransform: "uppercase",
      letterSpacing: 1.2,
    });
    const ar = nativeText("overline", "arabic");
    expect(ar.textTransform).toBeUndefined();
    expect(ar.letterSpacing).toBeUndefined();
  });

  it("native shadows follow the elevation table", () => {
    const s = nativeShadow("raised", "#123456");
    expect(s).toMatchObject({ shadowColor: "#123456", elevation: elevation.raised.android });
    expect(nativeShadow("flat").shadowOpacity).toBe(0);
  });

  it("every web helper points at a custom property the generated CSS defines", () => {
    const used = [
      ...Object.keys(space).map((k) => sp(Number(k) as SpaceStep)),
      ...(Object.keys(radius) as (keyof typeof radius)[]).map(rad),
      ...(Object.keys(elevation) as (keyof typeof elevation)[]).map(shadow),
      ...(Object.keys(type) as TypeRole[]).flatMap((r) => {
        const t = text(r);
        return [String(t.fontSize), String(t.lineHeight)];
      }),
    ].flatMap(varsIn);
    expect(used.length).toBeGreaterThan(30);
    for (const v of used) expect(css, v).toContain(`${v}:`);
  });

  it("scale variables are emitted once, in both generated stylesheets", () => {
    const names = scaleLines().map((l) => l.trim().split(":")[0]);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) {
      expect(css).toContain(`${n}:`);
      expect(renderThemesCss()).toContain(`${n}:`);
    }
  });
});
