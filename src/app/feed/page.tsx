import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/actions/logout";
import { Avatar } from "@/components/avatar";
import { avatarSignedUrl } from "@/lib/avatar-url";
import { requireStep } from "@/lib/auth/viewer";
import { INTERESTS } from "@/lib/interests";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Your feed · TKS articles" };

export default function FeedPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight text-tks-black">
          TKS articles
        </Link>
        <form action={logout}>
          <button type="submit" className="text-sm font-medium text-tks-black underline underline-offset-4">
            Log out
          </button>
        </form>
      </header>
      <Suspense fallback={<p className="text-tks-grey">Loading your feed…</p>}>
        <Welcome />
      </Suspense>
    </main>
  );
}

async function Welcome() {
  const viewer = await requireStep("done");
  const supabase = await createServerSupabase();
  const [{ data: cohort }, { data: picked }, avatarUrl] = await Promise.all([
    supabase.from("cohorts").select("name").eq("id", viewer.profile.cohortId ?? 0).maybeSingle(),
    supabase.from("profile_interests").select("interest_slug").eq("profile_id", viewer.id),
    avatarSignedUrl(supabase, viewer.profile.avatarPath),
  ]);
  const slugs = new Set((picked ?? []).map((r) => r.interest_slug));
  const p = viewer.profile;

  return (
    <section className="flex flex-col gap-6 rounded-3xl bg-tks-white p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <Avatar url={avatarUrl} firstName={p.firstName} lastName={p.lastName} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-tks-black">Hi {p.firstName}</h1>
          <p className="text-tks-grey">
            @{p.username} · {cohort?.name ?? "Cohort"} · {p.city}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {INTERESTS.filter((i) => slugs.has(i.slug)).map((i) => (
          <span key={i.slug} className="rounded-full bg-tks-green px-3 py-1 text-sm font-medium text-tks-black">
            {i.label}
          </span>
        ))}
      </div>
      <p className="text-tks-black">Your feed is coming soon: articles from #r-thisiscool about the things you picked.</p>
      <div className="flex gap-4 text-sm">
        <Link href="/onboarding/profile" className="font-medium text-tks-black underline underline-offset-4">
          Edit profile
        </Link>
        <Link href="/onboarding/interests" className="font-medium text-tks-black underline underline-offset-4">
          Edit interests
        </Link>
      </div>
    </section>
  );
}
