import { hadithRepository, pluginRegistry } from "@ummahlibrary/api";
import { apiJson } from "../../../../../lib/api-response";

// Prerendered from the ingested datasets at build time (ADR 0022): the whole
// collection in one static response, which the client caches for offline search.
export const dynamic = "force-static";
export const dynamicParams = false;

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
