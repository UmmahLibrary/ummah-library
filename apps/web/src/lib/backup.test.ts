import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildBackup } from "@ummahlibrary/core";
import { clearAllData, collectLocalData, exportBackup, importBackup } from "./backup";

// jsdom's URL polyfill doesn't implement the Blob-URL Web API.
const realCreateObjectURL = URL.createObjectURL;
const realRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  URL.createObjectURL = realCreateObjectURL;
  URL.revokeObjectURL = realRevokeObjectURL;
});

describe("data backup", () => {
  it("collects only ul.* keys", () => {
    localStorage.setItem("ul.a", "1");
    localStorage.setItem("ul.b", "2");
    localStorage.setItem("other", "x");
    expect(collectLocalData()).toEqual({ "ul.a": "1", "ul.b": "2" });
  });

  it("rejects invalid JSON on import", () => {
    expect(importBackup("not json", "replace").ok).toBe(false);
  });

  it("applies a valid backup on 'replace' — incoming wins, current-only keys kept", () => {
    localStorage.setItem("ul.goal", "4"); // conflict — the backup should win
    localStorage.setItem("ul.mine", "keep"); // not in the backup — preserved
    const file = buildBackup({ "ul.goal": "8", "ul.reciter": "sudais" }, new Date());

    const result = importBackup(JSON.stringify(file), "replace");

    expect(result.ok).toBe(true);
    expect(result.applied).toBe(2);
    expect(localStorage.getItem("ul.goal")).toBe("8");
    expect(localStorage.getItem("ul.reciter")).toBe("sudais");
    expect(localStorage.getItem("ul.mine")).toBe("keep");
  });

  it("keeps my value on conflict with the 'keep-mine' strategy", () => {
    localStorage.setItem("ul.goal", "4");
    const file = buildBackup({ "ul.goal": "8" }, new Date());

    importBackup(JSON.stringify(file), "keep-mine");

    expect(localStorage.getItem("ul.goal")).toBe("4");
  });

  it("reports a friendly error instead of throwing when storage rejects the write", () => {
    localStorage.setItem("ul.goal", "4");
    const file = buildBackup({ "ul.goal": "8" }, new Date());
    const realSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("QuotaExceededError");
    };

    const result = importBackup(JSON.stringify(file), "replace");

    Storage.prototype.setItem = realSetItem;
    expect(result).toEqual({ ok: false, message: "Couldn’t write to local storage." });
  });

  it("clears every ul.* key and returns the count", () => {
    localStorage.setItem("ul.a", "1");
    localStorage.setItem("ul.b", "2");
    localStorage.setItem("keep", "y");

    expect(clearAllData()).toBe(2);
    expect(collectLocalData()).toEqual({});
    expect(localStorage.getItem("keep")).toBe("y");
  });

  it("exportBackup triggers a download of the collected data as JSON", () => {
    localStorage.setItem("ul.goal", "4");
    const clickSpy = vi.fn();
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = realCreateElement(tag);
      if (tag === "a") el.click = clickSpy;
      return el;
    });

    exportBackup();

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    vi.restoreAllMocks();
  });
});
