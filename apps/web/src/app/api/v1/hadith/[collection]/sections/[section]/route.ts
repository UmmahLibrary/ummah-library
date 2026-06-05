import { hadithRepository } from "@ummahlibrary/api";
import { apiJson } from "../../../../../../../lib/api-response";

// Dynamic: hadith sections are fetched at runtime from the collection's source.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ collection: string; section: string }> },
) {
  const { collection, section } = await params;
  const n = Number(section);
  if (!Number.isInteger(n) || n < 1) return apiJson({ error: "bad_section" }, { status: 400 });
  const result = await hadithRepository.getSection(collection, n);
  if (!result) return apiJson({ error: "section_not_found" }, { status: 404 });
  return apiJson(result);
}
