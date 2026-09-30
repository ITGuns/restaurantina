import { Flourish } from "@/components/site/Talavera";

/** Renders owner-editable legal copy (Admin → Settings → Legal) as paragraphs. */
export function LegalPage({ eyebrow, title, body, updatedAt, name }: { eyebrow: string; title: string; body: string | null; updatedAt: string; name: string }) {
  const paragraphs = (body ?? "").split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <section className="bg-cream-100 pb-32 pt-32 text-brown-900 md:pt-40">
      <div className="container-site max-w-3xl">
        <Flourish />
        <p className="mt-4 eyebrow text-clay-600">{eyebrow}</p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1]">{title}</h1>
        <p className="mt-3 text-[13px] text-brown-500">{name} · Last updated {new Date(updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        <div className="mt-8 space-y-4 text-[16px] leading-relaxed text-brown-700">
          {paragraphs.length ? paragraphs.map((p, i) => <p key={i}>{p}</p>) : <p>This page hasn&apos;t been written yet. Please contact the restaurant with any questions.</p>}
        </div>
      </div>
    </section>
  );
}
