import { hadithRepository, pluginRegistry } from "@ummahlibrary/api";
import { apiJson } from "../../../../../lib/api-response";

// Prerendered from the ingested datasets at build time (ADR 0022): the whole
// collection in one static response, which the client caches for offline search.
export const dynamic = "force-static";
// Deliberately not `dynamicParams = false`: an id outside generateStaticParams
// must still reach the GET handler below so it returns the JSON 404 error
// instead of Next's generic HTML not-found page (the public API's documented
// error shape — see openapi.json).
export const dynamicParams = true;

export function generateStaticParams() {
  return pluginRegistry.byKind("hadith").map((c) => ({ collection: c.id }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ collection: string }> },
) {
  const { collection } = await params;
  const result = await hadithRepository.getCollection(collection);
  if (!result) return apiJson({ error: "collection_not_found" }, { status: 404 });
  return apiJson(result);
}
