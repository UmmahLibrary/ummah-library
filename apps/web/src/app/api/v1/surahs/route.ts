import { quranRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../lib/api-response";

export const dynamic = "force-static";

export async function GET() {
  const surahs = await quranRepository.listSurahs();
  return apiJson({ count: surahs.length, surahs });
}
