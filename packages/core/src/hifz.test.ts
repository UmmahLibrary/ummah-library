import { describe, expect, it } from "vitest";
import {
  INITIAL_EASE_FACTOR,
  MIN_EASE_FACTOR,
  createCard,
  isDue,
  ratingToQuality,
  review,
  reviewByRating,
} from "./hifz";

const NOW = new Date("2026-06-05T00:00:00.000Z");
const DAY = 86_400_000;
const daysUntil = (due: string) => (new Date(due).getTime() - NOW.getTime()) / DAY;

describe("createCard", () => {
  it("starts fresh and due immediately", () => {
    const c = createCard(NOW);
    expect(c).toMatchObject({ repetitions: 0, intervalDays: 0, lastReviewed: null });
    expect(c.easeFactor).toBe(INITIAL_EASE_FACTOR);
    expect(isDue(c, NOW)).toBe(true);
  });
});

describe("ratingToQuality", () => {
  it("maps the friendly ratings", () => {
    expect(ratingToQuality("again")).toBe(1);
    expect(ratingToQuality("hard")).toBe(3);
    expect(ratingToQuality("good")).toBe(4);
    expect(ratingToQuality("easy")).toBe(5);
  });
});

describe("review — successful progression (SM-2 intervals 1 → 6 → I·EF)", () => {
  it("schedules 1, then 6, then round(interval·EF) days", () => {
    const c1 = review(createCard(NOW), 4, NOW);
    expect(c1).toMatchObject({ repetitions: 1, intervalDays: 1 });
    expect(c1.easeFactor).toBeCloseTo(2.5, 6); // q=4 leaves EF unchanged
    expect(daysUntil(c1.due)).toBe(1);

    const c2 = review(c1, 4, NOW);
    expect(c2).toMatchObject({ repetitions: 2, intervalDays: 6 });
    expect(daysUntil(c2.due)).toBe(6);

    const c3 = review(c2, 4, NOW);
    expect(c3).toMatchObject({ repetitions: 3, intervalDays: 15 }); // round(6 * 2.5)
    expect(daysUntil(c3.due)).toBe(15);

    const c4 = review(c3, 5, NOW); // easy raises EF to 2.6
    expect(c4.repetitions).toBe(4);
    expect(c4.easeFactor).toBeCloseTo(2.6, 6);
    expect(c4.intervalDays).toBe(38); // round(15 * 2.5)
  });
});

describe("review — lapse resets the schedule", () => {
  it("a failing grade (<3) resets reps and interval to 1 and lowers EF", () => {
    let card = createCard(NOW);
    for (let i = 0; i < 3; i++) card = review(card, 4, NOW); // build up
    expect(card.repetitions).toBe(3);

    const lapsed = review(card, 1, NOW); // "again"
    expect(lapsed.repetitions).toBe(0);
    expect(lapsed.intervalDays).toBe(1);
    expect(lapsed.easeFactor).toBeCloseTo(2.5 - 0.54, 6);
    expect(daysUntil(lapsed.due)).toBe(1);
  });
});

describe("ease factor floor", () => {
  it("never drops below 1.3", () => {
    let card = createCard(NOW);
    for (let i = 0; i < 6; i++) card = review(card, 0, NOW); // repeated blackouts
    expect(card.easeFactor).toBe(MIN_EASE_FACTOR);
  });
});

describe("review does not mutate its input", () => {
  it("returns a new card, leaving the original untouched", () => {
    const c0 = createCard(NOW);
    const snapshot = { ...c0 };
    review(c0, 5, NOW);
    expect(c0).toEqual(snapshot);
  });
});

describe("reviewByRating", () => {
  it("hard keeps progressing but lowers EF", () => {
    const c = reviewByRating(createCard(NOW), "hard", NOW);
    expect(c.repetitions).toBe(1);
    expect(c.intervalDays).toBe(1);
    expect(c.easeFactor).toBeCloseTo(2.5 - 0.14, 6);
  });
});

describe("isDue", () => {
  it("is due once the due time has passed", () => {
    const c = review(createCard(NOW), 4, NOW); // due in 1 day
    expect(isDue(c, NOW)).toBe(false);
    expect(isDue(c, new Date(NOW.getTime() + DAY))).toBe(true);
  });
});
