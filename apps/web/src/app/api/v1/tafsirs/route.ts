import { pluginRegistry } from "@ummahlibrary/api";
import { apiJson } from "../../../../lib/api-response";

export const dynamic = "force-static";

export async function GET() {
  const tafsirs = pluginRegistry.byKind("tafsir").map((t) => ({
    id: t.id,
    name: t.name,
    author: t.author,
    language: t.language,
    direction: t.direction,
  }));
  return apiJson({ count: tafsirs.length, tafsirs });
}
