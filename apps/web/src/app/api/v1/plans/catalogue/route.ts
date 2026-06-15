import { planCatalog } from "@ummahlibrary/api";
import { apiJson } from "../../../../../lib/api-response";

export const dynamic = "force-static";

// The reading-plan catalogue (templates only). Progress is local-first device
// state (ADR 0006), so it is never served here — there are no plan mutations.
export async function GET() {
  const plans = await planCatalog.all();
  return apiJson({ count: plans.length, plans });
}
