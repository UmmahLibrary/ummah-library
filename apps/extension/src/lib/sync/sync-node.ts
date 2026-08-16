/**
 * The stable per-device id (#25, ADR 0033) used as the HLC tiebreaker. One random
 * id per extension install, kept device-locally (`chrome.storage.local`, key
 * `sync.node`) so it isn't browser-mirrored across profiles — each install is its
 * own sync node even when they share an account (one recovery phrase).
 */
import { getCache, setCache } from "../storage";

const NODE_KEY = "sync.node";

export async function getNodeId(): Promise<string> {
  const existing = await getCache<string>(NODE_KEY, "");
  if (existing) return existing;
  const id = crypto.randomUUID();
  await setCache(NODE_KEY, id);
  return id;
}
