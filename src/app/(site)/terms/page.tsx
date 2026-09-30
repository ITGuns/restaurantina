import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getRestaurant } from "@/lib/data/restaurant";
import { parsePgTimestamp } from "@/lib/format";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const r = await getRestaurant();
  return pageMeta(r, { title: "Terms", description: `Terms for using the ${r.name} website and online reservations.`, path: "/terms" });
}

export default async function TermsPage() {
  const r = await getRestaurant();
  return <LegalPage eyebrow="Terms" title="Terms of Service" body={r.termsOfService} updatedAt={parsePgTimestamp(r.updatedAt).toISOString()} name={r.name} />;
}
