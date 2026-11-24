import { describe, expect, it } from "vitest";
import { numberParam } from "./query-number";

describe("numberParam", () => {
  it("is NaN for a missing or blank parameter, not 0", () => {
    const p = new URLSearchParams("lat=&lng=%20");
    expect(numberParam(p, "lat")).toBeNaN();
    expect(numberParam(p, "lng")).toBeNaN();
    expect(numberParam(p, "radius")).toBeNaN();
  });

  it("parses a given value, including a real zero", () => {
    const p = new URLSearchParams("lat=0&lng=-12.5");
    expect(numberParam(p, "lat")).toBe(0);
    expect(numberParam(p, "lng")).toBe(-12.5);
  });
});
