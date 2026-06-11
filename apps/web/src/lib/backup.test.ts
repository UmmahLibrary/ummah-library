import { describe, expect, it } from "vitest";
import { buildBackup } from "@ummahlibrary/core";
import { clearAllData, collectLocalData, importBackup } from "./backup";

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

  it("clears every ul.* key and returns the count", () => {
    localStorage.setItem("ul.a", "1");
    localStorage.setItem("ul.b", "2");
    localStorage.setItem("keep", "y");

    expect(clearAllData()).toBe(2);
    expect(collectLocalData()).toEqual({});
    expect(localStorage.getItem("keep")).toBe("y");
  });
});
