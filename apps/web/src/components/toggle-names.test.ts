import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));

describe("toggle buttons", () => {
  // A toggle states on/off once: either a fixed name + aria-pressed, or a name
  // that flips (Play/Pause) without aria-pressed. Both at once reads as
  // "Turn off reminder, pressed" or "Pause, pressed".
  it("never pair aria-pressed with a name that changes with the state", () => {
    const offenders: string[] = [];
    for (const f of readdirSync(dir).filter(
      (n) => n.endsWith(".tsx") && !n.endsWith(".test.tsx"),
    )) {
      const lines = readFileSync(join(dir, f), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (!line.includes("aria-pressed=")) return;
        const near = lines.slice(Math.max(0, i - 4), i + 5).join("\n");
        if (/aria-label=\{[^}\n]*\?[^}\n]*:/.test(near)) offenders.push(`${f}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
