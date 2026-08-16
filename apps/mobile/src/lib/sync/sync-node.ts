/**
 * The stable per-device id (#25, ADR 0033) used as the Hybrid Logical Clock
 * tiebreaker. One random id per app install, persisted under `ul.sync.node` so a
 * device keeps its identity across launches. Distinct from the account: many
 * devices share one account (one recovery phrase), but each has its own node id.
 */
import { randomId } from "./crypto-random";
import { getItem, setItem } from "./storage";

const NODE_KEY = "ul.sync.node";

/** This device's sync node id, generating and persisting one on first use. */
export async function getNodeId(): Promise<string> {
  const existing = await getItem(NODE_KEY);
  if (existing) return existing;
  const id = randomId();
  await setItem(NODE_KEY, id);
  return id;
}
