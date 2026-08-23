import { afterEach, describe, expect, it } from "vitest";
import { webTasbihStore } from "./tasbih-store";

afterEach(() => localStorage.clear());

describe("webTasbihStore", () => {
  it("returns null when nothing is stored", async () => {
    expect(await webTasbihStore.read()).toBeNull();
  });

  it("round-trips a current-shape record", async () => {
    const record = { phraseId: "subhanallah", phrases: { subhanallah: { total: 12, target: 33 } } };
    await webTasbihStore.write(record);
    expect(await webTasbihStore.read()).toEqual(record);
  });

  it("migrates a legacy single-total record into the per-phrase shape, and persists the migration", async () => {
    localStorage.setItem("ul.tasbih2", JSON.stringify({ phraseId: "alhamdulillah", total: 5, target: 33 }));
    const migrated = await webTasbihStore.read();
    expect(migrated).toEqual({
      phraseId: "alhamdulillah",
      phrases: { alhamdulillah: { total: 5, target: 33 } },
    });
    // The migration is written back, so a second read sees the new shape directly.
    expect(JSON.parse(localStorage.getItem("ul.tasbih2")!)).toEqual(migrated);
  });

  it("returns null for corrupt JSON instead of throwing", async () => {
    localStorage.setItem("ul.tasbih2", "{not json");
    expect(await webTasbihStore.read()).toBeNull();
  });

  it("returns null for a value that matches neither shape", async () => {
    localStorage.setItem("ul.tasbih2", JSON.stringify({ foo: "bar" }));
    expect(await webTasbihStore.read()).toBeNull();
  });
});
