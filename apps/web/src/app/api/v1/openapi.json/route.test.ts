import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

const v1 = join(dirname(fileURLToPath(import.meta.url)), "..");

function routes(dir: string, base = ""): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) return name === "route.ts" ? [base] : [];
    const seg = name.replace(/^\[(.+)\]$/, "{$1}");
    return routes(full, `${base}/${seg}`);
  });
}

describe("OpenAPI document", () => {
  it("documents every public /api/v1 route", async () => {
    const doc = (await (await GET()).json()) as { paths: Record<string, unknown> };
    const missing = routes(v1)
      .filter((r) => r !== "/openapi.json")
      .filter((r) => !(r in doc.paths));
    expect(missing).toEqual([]);
  });
});
