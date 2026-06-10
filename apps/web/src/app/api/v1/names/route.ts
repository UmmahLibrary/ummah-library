import { asmaRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../lib/api-response";

export const dynamic = "force-static";

export async function GET() {
  const names = await asmaRepository.all();
  return apiJson({ count: names.length, names });
}
