import { FeedGrid } from "@/components/feed-grid";
import { getLatest } from "@/lib/articles/queries";

// The newest articles. Anyone can open them; non-members get the first half and the sign-up card.
export async function Fresh() {
  const items = await getLatest(6);
  if (!items.length) return null;
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Fresh from #r-thisiscool</h2>
        <p className="text-muted">Tap one for a taste. Members read the whole thing.</p>
      </div>
      <FeedGrid items={items} />
    </section>
  );
}
