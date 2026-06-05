import { translationRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../lib/api-response";

export const dynamic = "force-static";

export async function GET() {
  const editions = await translationRepository.listTranslations();
  return apiJson({ count: editions.length, editions });
}
