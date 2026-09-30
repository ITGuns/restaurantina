import type { Metadata } from "next";
import { ModifiersManager } from "@/components/admin/menu/ModifiersManager";
import { PageHeader } from "@/components/admin/ui";
import { readModifierGroups } from "@/lib/data/menu";

export const metadata: Metadata = { title: "Modifiers" };

export default async function ModifiersPage() {
  const groups = await readModifierGroups(true);
  return (
    <>
      <PageHeader title="Modifiers & options" description="Reusable option groups (guisados, sides, sizes) that you can attach to any menu item." />
      <ModifiersManager groups={groups} />
    </>
  );
}
