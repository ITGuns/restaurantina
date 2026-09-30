import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENT_TAG } from "./data/restaurant";
import { MENU_TAG } from "./data/menu";

export function revalidateMenu() {
  revalidateTag(MENU_TAG);
  revalidatePath("/", "layout");
}

export function revalidateContent() {
  revalidateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
}
