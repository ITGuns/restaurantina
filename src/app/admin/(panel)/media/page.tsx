import type { Metadata } from "next";
import { MediaManager } from "@/components/admin/media/MediaManager";
import { PageHeader } from "@/components/admin/ui";
import { flattenItems, readMenuTree } from "@/lib/data/menu";
import { readMedia } from "@/lib/data/media";
import { readRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage() {
  const [media, tree, restaurant] = await Promise.all([readMedia(true), readMenuTree(true), readRestaurant()]);
  const items = flattenItems(tree).map((i) => ({ id: i.id, name: i.name, categoryName: i.categoryName, image: i.image }));
  return (
    <>
      <PageHeader title="Media library" description="Photos for the gallery, hero, section backdrops and menu items. Uploads are validated (type, size, dimensions) and stored in the database." />
      <MediaManager media={media} items={items} usage={{ heroImage: restaurant.heroImage, ogImageUrl: restaurant.ogImageUrl, logo: restaurant.logo }} />
    </>
  );
}
