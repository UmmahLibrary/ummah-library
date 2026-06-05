import { createCard, review } from "@ummahlibrary/core";
import { afterEach, describe, expect, it } from "vitest";
import { SqliteHifzRepository } from "./sqlite-hifz";

const NOW = new Date("2026-06-05T00:00:00.000Z");
const DAY = 86_400_000;
const KURSI = { sura: 2, aya: 255 };
const FATIHA = { sura: 1, aya: 1 };

let repo: SqliteHifzRepository;
afterEach(() => repo?.close());

describe("SqliteHifzRepository (durable store)", () => {
  it("persists, updates, and queries due cards via SQL", async () => {
    repo = new SqliteHifzRepository(":memory:");

    await repo.save(KURSI, createCard(NOW));
    await repo.save(FATIHA, createCard(NOW));
    expect(await repo.all()).toHaveLength(2);

    // both due now, mushaf order
    expect((await repo.due(NOW)).map((r) => r.ayah)).toEqual([FATIHA, KURSI]);

    // review Ayat al-Kursi → pushed out a day (upsert, not a second row)
    const card = await repo.get(KURSI);
    await repo.save(KURSI, review(card!, 4, NOW));
    expect(await repo.all()).toHaveLength(2);
    expect((await repo.due(NOW)).map((r) => r.ayah)).toEqual([FATIHA]);
    expect((await repo.due(new Date(NOW.getTime() + DAY))).map((r) => r.ayah)).toEqual([
      FATIHA,
      KURSI,
    ]);

    // round-trips the full card shape
    const reloaded = await repo.get(KURSI);
    expect(reloaded).toMatchObject({ repetitions: 1, intervalDays: 1 });
    expect(reloaded?.easeFactor).toBeCloseTo(2.5, 6);
  });

  it("removes a card", async () => {
    repo = new SqliteHifzRepository(":memory:");
    await repo.save(FATIHA, createCard(NOW));
    await repo.remove(FATIHA);
    expect(await repo.get(FATIHA)).toBeNull();
    expect(await repo.all()).toHaveLength(0);
  });
});
