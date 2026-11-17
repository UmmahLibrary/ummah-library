import { describe, expect, it } from "vitest";
import { defaultEditions } from "./types";

describe("mobile translation before the reader chooses (ADR 0041)", () => {
  it("follows a non-English interface language", () => {
    expect(defaultEditions("ur")).toEqual(["urd-fatehmuhammadja"]);
  });

  it("uses the same rule as web (core), so both apps agree", () => {
    expect(defaultEditions("ar")).toEqual([]);
  });

  it("falls back to the device language for an English interface", () => {
    expect(defaultEditions("en").length).toBe(1);
  });
});
