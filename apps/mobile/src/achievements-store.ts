/**
 * Mobile `AchievementsStore` adapter (ADR 0024, 0032): the ids of badges already
 * shown, in AsyncStorage under `ul.badges` (mirrors the web key). Persistence
 * only — the badge maths lives in `@ummahlibrary/core`.
 */
import type { AchievementsStore } from "@ummahlibrary/core";
import { KEYS, getJSON, setJSON } from "./storage";

export const mobileAchievementsStore: AchievementsStore = {
  read: () => getJSON<string[]>(KEYS.badges, [], Array.isArray),
  write: (ids) => setJSON(KEYS.badges, ids),
};
