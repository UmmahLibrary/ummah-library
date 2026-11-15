import { describe, expect, it } from "vitest";
import { fmtMessage, formatUiNumber } from "./i18n-format";

describe("interface number and message formatting", () => {
  it("uses each language's own digits", () => {
    expect(formatUiNumber(110, "en")).toBe("110");
    expect(formatUiNumber(110, "ar")).toBe("١١٠");
    expect(formatUiNumber(110, "ur")).toBe("۱۱۰");
    expect(formatUiNumber(110, "bn")).toBe("১১০");
    expect(formatUiNumber(1234, "tr")).toBe("1,234");
  });

  it("fills placeholders, localizing numbers but not strings", () => {
    expect(fmtMessage("Āyah {n} of {total}", { n: 5, total: 7 }, "ur")).toBe("Āyah ۵ of ۷");
    expect(fmtMessage("Go to {key}", { key: "2:255" }, "ar")).toBe("Go to 2:255");
    expect(fmtMessage("Hi {missing}", {}, "en")).toBe("Hi {missing}");
  });
});
