import { Suspense } from "react";
import { FeedGrid } from "@/components/feed-grid";
import { SiteHeader } from "@/components/site-header";
import { getSaved } from "@/lib/articles/queries";
import { requireStep } from "@/lib/auth/viewer";

export const metadata = { title: "Saved · TKS articles" };

export default function SavedPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
      <SiteHeader />
      <h1 className="text-3xl font-semibold tracking-tight text-tks-black">Saved for later</h1>
      <Suspense fallback={<p className="text-tks-grey">Loading…</p>}>
        <SavedList />
      </Suspense>
    </main>
  );
}

async function SavedList() {
  const viewer = await requireStep("done");
  const items = await getSaved(viewer);
  return items.length ? (
    <FeedGrid items={items} />
  ) : (
    <p className="rounded-3xl bg-tks-white p-8 text-tks-black">Nothing saved yet. Tap Save on any article.</p>
  );
}
