import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FeedGrid } from "@/components/feed-grid";
import { SiteHeader } from "@/components/site-header";
import { getProfile } from "@/lib/articles/queries";
import { initials } from "@/lib/avatar";
import { avatarSignedUrl } from "@/lib/avatar-url";
import { requireStep } from "@/lib/auth/viewer";
import { INTERESTS } from "@/lib/interests";
import { createServerSupabase } from "@/lib/supabase/server";
import { MemberCard } from "./profile-card";

export const metadata = { title: "Profile · TKS articles" };

const LABELS = new Map<string, string>(INTERESTS.map((i) => [i.slug, i.label]));

export default function ProfilePage({ params }: PageProps<"/u/[username]">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10">
      <SiteHeader />
      <Suspense fallback={<p className="text-tks-grey">Loading profile…</p>}>
        <Profile params={params} />
      </Suspense>
    </main>
  );
}

// A green square with the member's initials, for the card when they have no photo.
function initialsImage(text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="640"><rect width="100%" height="100%" fill="#51B04C"/><text x="50%" y="52%" font-family="Inter,Arial,sans-serif" font-size="200" font-weight="600" fill="#17191A" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function Profile({ params }: { params: PageProps<"/u/[username]">["params"] }) {
  await requireStep("done");
  const result = await getProfile((await params).username);
  if (!result) notFound();
  const { profile, reposts } = result;
  const photo = await avatarSignedUrl(await createServerSupabase(), profile.avatarPath);

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-12">
        <div className="w-full max-w-xs">
          <MemberCard
            avatarUrl={photo ?? initialsImage(initials(profile.firstName, profile.lastName))}
            name={`${profile.firstName} ${profile.lastName}`}
            title={[profile.cohortName, profile.city].filter(Boolean).join(" · ")}
            handle={profile.username}
            status={`${reposts.length} repost${reposts.length === 1 ? "" : "s"}`}
          />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-tks-black">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-tks-grey">
            @{profile.username}
            {profile.cohortName ? ` · ${profile.cohortName}` : ""} · {profile.city}
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((slug) => (
              <span key={slug} className="rounded-full bg-tks-green px-3 py-1 text-sm font-medium text-tks-black">
                {LABELS.get(slug) ?? slug}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="reposts" className="flex scroll-mt-8 flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-tks-black">Reposts</h2>
        {reposts.length ? (
          <FeedGrid items={reposts} />
        ) : (
          <p className="rounded-3xl bg-tks-white p-8 text-tks-black">No reposts yet.</p>
        )}
      </section>
    </div>
  );
}
