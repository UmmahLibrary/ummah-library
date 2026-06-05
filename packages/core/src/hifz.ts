/**
 * Hifz (memorization) scheduling — a pure SM-2 spaced-repetition engine.
 *
 * No I/O, no framework, no clock of its own: every function takes the current
 * time explicitly so it is fully deterministic and testable. Persistence lives
 * behind the `HifzRepository` port (see ports.ts); this file is just the logic.
 *
 * Reference: the SuperMemo-2 algorithm (P.A. Wozniak, 1990).
 */

/** Raw SM-2 recall quality, 0 (blackout) … 5 (perfect). */
export type RecallQuality = 0 | 1 | 2 | 3 | 4 | 5;

/** Friendly 4-button rating mapped onto SM-2 qualities. */
export type ReviewRating = "again" | "hard" | "good" | "easy";

/** The spaced-repetition state of one memorization item (e.g. an ayah). */
export interface HifzCard {
  /** Consecutive successful recalls. */
  repetitions: number;
  /** SM-2 ease factor (>= 1.3); higher means longer intervals. */
  easeFactor: number;
  /** Current interval in days. */
  intervalDays: number;
  /** ISO timestamp when the card is next due. */
  due: string;
  /** ISO timestamp of the last review, or null if never reviewed. */
  lastReviewed: string | null;
}

export const INITIAL_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;

const RATING_QUALITY: Record<ReviewRating, RecallQuality> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

/** Map a friendly rating to its SM-2 quality. */
export function ratingToQuality(rating: ReviewRating): RecallQuality {
  return RATING_QUALITY[rating];
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** A fresh card, due immediately. */
export function createCard(now: Date = new Date()): HifzCard {
  return {
    repetitions: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    intervalDays: 0,
    due: now.toISOString(),
    lastReviewed: null,
  };
}

/** Apply one SM-2 review, returning the next card state (input unchanged). */
export function review(card: HifzCard, quality: RecallQuality, now: Date = new Date()): HifzCard {
  let { repetitions } = card;
  let intervalDays: number;

  if (quality >= 3) {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(card.intervalDays * card.easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  // EF is updated after the interval is computed (canonical SM-2).
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const easeFactor = Math.max(MIN_EASE_FACTOR, card.easeFactor + delta);

  return {
    repetitions,
    easeFactor,
    intervalDays,
    due: addDays(now, intervalDays).toISOString(),
    lastReviewed: now.toISOString(),
  };
}

/** Apply a review by friendly rating. */
export function reviewByRating(
  card: HifzCard,
  rating: ReviewRating,
  now: Date = new Date(),
): HifzCard {
  return review(card, ratingToQuality(rating), now);
}

/** Whether a card is due for review at `now`. */
export function isDue(card: HifzCard, now: Date = new Date()): boolean {
  return new Date(card.due).getTime() <= now.getTime();
}
