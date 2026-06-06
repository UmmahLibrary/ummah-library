import { translationCatalog } from "@ummahlibrary/api";
import { apiJson } from "../../../../lib/api-response";

// Dynamic: the full catalogue is fetched at runtime from fawazahmed0 (ADR 0011).
export const dynamic = "force-dynamic";

export async function GET() {
  const translations = await translationCatalog.listTranslations();
  return apiJson({ count: translations.length, translations });
}
