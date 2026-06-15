import type { Metadata } from "next";
import { PLAN_TEMPLATES, templateById } from "@ummahlibrary/core";
import { PlanDetailView } from "../../../components/PlanDetailView";

// Only the catalogue ids (plus a started custom plan) have a detail page.
export const dynamicParams = false;

export function generateStaticParams() {
  return [...PLAN_TEMPLATES.map((t) => ({ id: t.id })), { id: "custom" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const name = templateById(id)?.name ?? "Reading plan";
  return { title: `${name} · Reading plans` };
}

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlanDetailView templateId={id} />;
}
