/**
 * UI message catalogue for the mobile app (#208, ADR 0040/0041). Strings live
 * in one file per area under `./ns/` (so the reader, prayer, learn, memorize,
 * home and settings strings can be edited independently); this module merges
 * them. English defines the key set; the compiler forces every other language
 * to be complete. Non-English values are first passes flagged for native review.
 */
import type { Locale } from "./config";
import * as common from "./ns/common";
import * as home from "./ns/home";
import * as reader from "./ns/reader";
import * as prayer from "./ns/prayer";
import * as learn from "./ns/learn";
import * as memorize from "./ns/memorize";
import * as settings from "./ns/settings";

export const en = {
  ...common.en,
  ...home.en,
  ...reader.en,
  ...prayer.en,
  ...learn.en,
  ...memorize.en,
  ...settings.en,
};

export type MessageKey = keyof typeof en;

const merge = (l: Exclude<Locale, "en">): Record<MessageKey, string> => ({
  ...common[l],
  ...home[l],
  ...reader[l],
  ...prayer[l],
  ...learn[l],
  ...memorize[l],
  ...settings[l],
});

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  en,
  ar: merge("ar"),
  ur: merge("ur"),
  id: merge("id"),
  bn: merge("bn"),
  tr: merge("tr"),
};
