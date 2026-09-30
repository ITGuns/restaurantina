import type { Metadata } from "next";
import { Suspense } from "react";
import { MenuManager } from "@/components/admin/menu/MenuManager";
import { PageHeader } from "@/components/admin/ui";
import { readMenuTree } from "@/lib/data/menu";
import { readMedia } from "@/lib/data/media";

export const metadata: Metadata = { title: "Menu" };

export default async function AdminMenuPage() {
  const [tree, library] = await Promise.all([readMenuTree(true), readMedia(true)]);
  const itemCount = tree.categories.reduce((n, c) => n + c.items.length, 0);
  return (
    <>
      <PageHeader title="Menu items" description={`${itemCount} items across ${tree.categories.length} categories. Changes go live on the website immediately.`} />
      <Suspense>
        <MenuManager categories={tree.categories} groups={tree.groups} library={library.map((m) => ({ id: m.id, file: m.file, alt: m.alt, tag: m.tag }))} />
      </Suspense>
    </>
  );
}
