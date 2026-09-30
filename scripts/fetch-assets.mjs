// Downloads RestauranTina's logo and the three food photos listed in restaurantina-data.md
// into /public/images so the site never hotlinks the old website's CDN.
import { mkdir, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "images");
const CDN = "https://d2gqo3h0psesgi.cloudfront.net/auto";

// Keys match `media.file` values in the seed (src/db/seed-data/restaurant.ts).
export const ASSETS = [
  ["logo.png", `${CDN}/restaurantina-8h2jzfpc-logo.png`],
  ["food-1.jpg", `${CDN}/restaurantina-d6hr9pml-food1.jpg`],
  ["food-2.jpg", `${CDN}/restaurantina-pk6qlcxv-food2.jpg`],
  ["food-3.jpg", `${CDN}/restaurantina-tq4hr39f-food3.jpg`],
];

async function exists(p) {
  try {
    return (await stat(p)).size > 0;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let ok = 0, skipped = 0, failed = 0;
  for (const [file, url] of ASSETS) {
    const dest = join(OUT, file);
    if (await exists(dest)) { skipped++; continue; }
    try {
      const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (asset fetch)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      ok++;
      console.log(`✓ ${file}`);
    } catch (err) {
      failed++;
      console.error(`✗ ${file}: ${err.message}`);
    }
  }
  console.log(`\nDone. downloaded=${ok} skipped=${skipped} failed=${failed}`);
  if (failed) process.exitCode = 1;
}

main();
