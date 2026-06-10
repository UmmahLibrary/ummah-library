import { adhkarRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../lib/api-response";

export const dynamic = "force-static";

export async function GET() {
  const dhikr = await adhkarRepository.all();
  return apiJson({ count: dhikr.length, dhikr });
}
