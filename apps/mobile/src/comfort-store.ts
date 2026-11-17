/**
 * Persistence for the reading-comfort record (ADR 0041) under `ul.comfort`,
 * through the shared storage helpers. Parsing and validation live in the pure
 * `comfort.ts`.
 */
import { KEYS, getString, setString } from "./storage";
import { type Comfort, parseComfort } from "./comfort";

export async function readComfort(): Promise<Comfort> {
  return parseComfort(await getString(KEYS.comfort));
}

export async function writeComfort(c: Comfort): Promise<void> {
  await setString(KEYS.comfort, JSON.stringify(c));
}
