import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getRestaurant } from "@/lib/data/restaurant";
import { parsePgTimestamp } from "@/lib/format";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const r = await getRestaurant();
  return pageMeta(r, { title: "Privacy Policy", description: `How ${r.name} uses the information you share when reserving a table.`, path: "/privacy" });
}

export default async function PrivacyPage() {
  const r = await getRestaurant();
  return <LegalPage eyebrow="Privacy" title="Privacy Policy" body={r.privacyPolicy} updatedAt={parsePgTimestamp(r.updatedAt).toISOString()} name={r.name} />;
}
