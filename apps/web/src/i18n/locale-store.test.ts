import { afterEach, describe, expect, it } from "vitest";
import { LOCALE_BOOTSTRAP } from "./locale-store";

/** Run the inline snippet the way the layout's pre-paint script does. */
function runBootstrap() {
  new Function("d", LOCALE_BOOTSTRAP)(document.documentElement);
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.lang = "en";
  document.documentElement.dir = "";
});

describe("LOCALE_BOOTSTRAP", () => {
  it("sets an Arabic or Urdu page right-to-left before React hydrates", () => {
    localStorage.setItem("ul.locale", "ar");
    runBootstrap();
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");

    localStorage.setItem("ul.locale", "ur");
    runBootstrap();
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("keeps left-to-right languages left-to-right", () => {
    localStorage.setItem("ul.locale", "tr");
    runBootstrap();
    expect(document.documentElement.lang).toBe("tr");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("ignores a missing or unknown saved value", () => {
    runBootstrap();
    expect(document.documentElement.lang).toBe("en");
    localStorage.setItem("ul.locale", "xx");
    runBootstrap();
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("");
  });
});
