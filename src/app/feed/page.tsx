import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { FeedGrid } from "@/components/feed-grid";
import { SiteHeader } from "@/components/site-header";
import { getFeed } from "@/lib/articles/queries";
import { avatarSignedUrl } from "@/lib/avatar-url";
import { requireStep } from "@/lib/auth/viewer";
import { INTERESTS } from "@/lib/interests";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Your feed · TKS articles" };

export default function FeedPage({ searchParams }: PageProps<"/feed">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
      <SiteHeader />
      <Suspense fallback={<p className="text-muted">Loading your feed…</p>}>
        <Feed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Feed({ searchParams }: { searchParams: PageProps<"/feed">["searchParams"] }) {
  const viewer = await requireStep("done");
  const { topic } = await searchParams;
  const activeTopic = typeof topic === "string" ? topic : undefined;

  const supabase = await createServerSupabase();
  const [{ data: picked }, avatarUrl, items] = await Promise.all([
    supabase.from("profile_interests").select("interest_slug").eq("profile_id", viewer.id),
    avatarSignedUrl(supabase, viewer.profile.avatarPath),
    getFeed(viewer, { topic: activeTopic }),
  ]);
  const mine = new Set((picked ?? []).map((r) => r.interest_slug as string));
  const topics = INTERESTS.filter((i) => mine.has(i.slug));
  const p = viewer.profile;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar url={avatarUrl} firstName={p.firstName} lastName={p.lastName} size={56} />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Hi {p.firstName}</h1>
            <p className="text-muted">Articles picked for what you&apos;re into.</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/onboarding/profile" className="font-medium text-ink underline underline-offset-4">
            Edit profile
          </Link>
          <Link href="/onboarding/interests" className="font-medium text-ink underline underline-offset-4">
            Edit interests
          </Link>
        </div>
      </section>

      <nav aria-label="Filter by interest" className="flex flex-wrap gap-2">
        <TopicChip href="/feed" label="All" active={!activeTopic} />
        {topics.map((t) => (
          <TopicChip key={t.slug} href={`/feed?topic=${t.slug}`} label={t.label} active={activeTopic === t.slug} />
        ))}
      </nav>

      {items.length ? (
        <FeedGrid items={items} />
      ) : (
        <p className="rounded-3xl bg-card p-8 text-ink">
          No articles here yet. New ones appear as soon as they&apos;re approved.
        </p>
      )}
    </div>
  );
}

function TopicChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active ? "border-tks-green bg-tks-green text-on-green" : "border-line bg-card text-ink hover:border-ink"
      }`}
    >
      {label}
    </Link>
  );
}
