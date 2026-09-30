import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/menu/CategoriesManager";
import { PageHeader } from "@/components/admin/ui";
import { readMenuTree } from "@/lib/data/menu";
import { readMedia } from "@/lib/data/media";

export const metadata: Metadata = { title: "Menu categories" };

export default async function CategoriesPage() {
  const [tree, library] = await Promise.all([readMenuTree(true), readMedia(true)]);
  return (
    <>
      <PageHeader title="Categories" description="Desayunos, Platillos, Comida… Drag to reorder; the order is the order on the public menu." />
      <CategoriesManager categories={tree.categories} library={library.map((m) => ({ id: m.id, file: m.file, alt: m.alt, tag: m.tag }))} />
    </>
  );
}
