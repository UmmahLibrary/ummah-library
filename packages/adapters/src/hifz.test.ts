import { createCard, review } from "@ummahlibrary/core";
import { describe, expect, it } from "vitest";
import { InMemoryHifzRepository } from "./index";

const NOW = new Date("2026-06-05T00:00:00.000Z");
const DAY = 86_400_000;
const AYAT_AL_KURSI = { sura: 2, aya: 255 };
const FATIHA_1 = { sura: 1, aya: 1 };

describe("InMemoryHifzRepository + SM-2 engine (end-to-end Hifz flow)", () => {
  it("schedules, reviews, and surfaces due cards in mushaf order", async () => {
    const repo = new InMemoryHifzRepository();

    // Start memorizing two ayahs — both due immediately.
    await repo.save(AYAT_AL_KURSI, createCard(NOW));
    await repo.save(FATIHA_1, createCard(NOW));

    const dueNow = await repo.due(NOW);
    expect(dueNow.map((r) => r.ayah)).toEqual([FATIHA_1, AYAT_AL_KURSI]); // mushaf order

    // Review Ayat al-Kursi successfully → pushed out by 1 day.
    const current = await repo.get(AYAT_AL_KURSI);
    expect(current).not.toBeNull();
    await repo.save(AYAT_AL_KURSI, review(current!, 4, NOW));

    // Now only Al-Fatiha 1:1 is still due today.
    expect((await repo.due(NOW)).map((r) => r.ayah)).toEqual([FATIHA_1]);

    // Tomorrow, Ayat al-Kursi comes back around.
    const tomorrow = new Date(NOW.getTime() + DAY);
    expect((await repo.due(tomorrow)).map((r) => r.ayah)).toEqual([FATIHA_1, AYAT_AL_KURSI]);

    // all() returns every tracked card regardless of due state.
    expect(await repo.all()).toHaveLength(2);
  });

  it("removes a card from tracking", async () => {
    const repo = new InMemoryHifzRepository();
    await repo.save(FATIHA_1, createCard(NOW));
    await repo.remove(FATIHA_1);
    expect(await repo.get(FATIHA_1)).toBeNull();
    expect(await repo.all()).toHaveLength(0);
  });
});
