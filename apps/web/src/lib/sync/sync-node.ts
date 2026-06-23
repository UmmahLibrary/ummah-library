/**
 * The stable per-device id (#25, ADR 0033) used as the Hybrid Logical Clock
 * tiebreaker. One random id per browser profile, persisted under `ul.sync.node`
 * so a device keeps its identity across sessions. Distinct from the account: many
 * devices share one account (one recovery phrase), but each has its own node id.
 */
import { getItem, setItem } from "./storage";

const NODE_KEY = "ul.sync.node";

/** This device's sync node id, generating and persisting one on first use. */
export function getNodeId(): string {
  const existing = getItem(NODE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  setItem(NODE_KEY, id);
  return id;
}
