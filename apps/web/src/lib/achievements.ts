/**
 * Local-first achievements glue (ADR 0006, 0032): which badges have been
 * acknowledged (shown via the unlock toast). Persistence goes through the
 * `AchievementsStore` port (web adapter `webAchievementsStore`, ADR 0024); the
 * badge maths lives in `@ummahlibrary/core`.
 */
import { webAchievementsStore as store } from "./achievements-store";

export function readAcknowledged(): Promise<string[]> {
  return store.read();
}

/** Mark a set of badge ids as acknowledged (so they don't re-toast). */
export async function acknowledge(ids: string[]): Promise<void> {
  await store.write(ids);
}
