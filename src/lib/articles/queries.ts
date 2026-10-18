import "server-only";
import { connection } from "next/server";
import { getViewer, type Viewer } from "@/lib/auth/viewer";
import { createPublicClient } from "@/lib/supabase/public";
import { INTEREST_SLUGS } from "@/lib/interests";
import { createServerSupabase } from "@/lib/supabase/server";
import { composeFeed, type ArticleCard, type FeedItem } from "./feed";
import { rankMine, rankOutside, TRENDING_REPOSTS } from "./rank";

const CARD_COLUMNS = "id, slug, headline, dek, tags, read_minutes, youtube_video_id, published_at, repost_count";

type CardRow = {
  id?: number;
  repost_count?: number;
  slug: string;
  headline: string;
  dek: string;
  tags: string[];
  read_minutes: number;
  youtube_video_id: string;
  published_at: string | null;
};

const toCard = (r: CardRow): ArticleCard => ({
  slug: r.slug,
  headline: r.headline,
  dek: r.dek,
  tags: r.tags,
  readMinutes: r.read_minutes,
  youtubeVideoId: r.youtube_video_id,
  publishedAt: r.published_at ?? "",
  repostCount: r.repost_count ?? 0,
});

export type FullArticle = ArticleCard & {
  id: number;
  bodyMd: string;
  videoTitle: string | null;
  channelName: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  mine: { score: number | null; saved: boolean; reposted: boolean };
};
export type PreviewArticle = ArticleCard & { previewMd: string };

// The member's feed: their interests, newest first, with some picks from outside them.
export async function getFeed(viewer: Viewer, opts: { topic?: string } = {}): Promise<FeedItem[]> {
  const supabase = await createServerSupabase();
  const { data: picked } = await supabase.from("profile_interests").select("interest_slug").eq("profile_id", viewer.id);
  const interests = (picked ?? []).map((r) => r.interest_slug as string);
  const topic = opts.topic && (INTEREST_SLUGS as readonly string[]).includes(opts.topic) ? opts.topic : undefined;

  const published = () => supabase.from("articles").select(CARD_COLUMNS).eq("status", "published");
  const newest = { ascending: false } as const;

  if (topic) {
    const { data } = await published().contains("tags", [topic]).order("published_at", newest).limit(30);
    return composeFeed((data ?? []).map(toCard), []);
  }

  const outsideOf = () =>
    interests.length ? published().not("tags", "ov", `{${interests.join(",")}}`) : published();
  const [mine, outsideNew, outsideHot, rated, reposted] = await Promise.all([
    interests.length
      ? published().overlaps("tags", interests).order("published_at", newest).limit(60)
      : Promise.resolve({ data: [] as CardRow[] }),
    outsideOf().order("published_at", newest).limit(30),
    outsideOf().gte("repost_count", TRENDING_REPOSTS).order("repost_count", newest).limit(10),
    supabase.from("ratings").select("article_id").eq("user_id", viewer.id),
    supabase.from("reposts").select("article_id").eq("user_id", viewer.id),
  ]);

  const mineCards = (mine.data ?? []).map((r) => ({ id: r.id, card: toCard(r) }));
  const ratedIds = new Set((rated.data ?? []).map((r) => r.article_id as number));
  const repostedIds = new Set((reposted.data ?? []).map((r) => r.article_id as number));
  const slugsWhere = (ids: Set<number>) => new Set(mineCards.filter((m) => m.id !== undefined && ids.has(m.id)).map((m) => m.card.slug));

  const outside = new Map<string, ArticleCard>();
  for (const r of [...(outsideHot.data ?? []), ...(outsideNew.data ?? [])]) outside.set(r.slug, toCard(r));

  return composeFeed(
    rankMine(mineCards.map((m) => m.card), { ratedSlugs: slugsWhere(ratedIds), ownRepostSlugs: slugsWhere(repostedIds) }),
    rankOutside([...outside.values()]),
  );
}

// Members get the whole article; everyone else gets the first half from public_article().
export async function getArticle(
  slug: string,
): Promise<{ kind: "full"; article: FullArticle } | { kind: "preview"; article: PreviewArticle } | null> {
  const viewer = await getViewer();
  const supabase = await createServerSupabase();

  if (viewer) {
    const { data } = await supabase
      .from("articles")
      .select(`${CARD_COLUMNS}, body_md, video_title, channel_name, rating_sum, rating_count`)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!data) return null;
    const [rating, save, repost] = await Promise.all([
      supabase.from("ratings").select("score").eq("article_id", data.id).eq("user_id", viewer.id).maybeSingle(),
      supabase.from("saves").select("article_id").eq("article_id", data.id).eq("user_id", viewer.id).maybeSingle(),
      supabase.from("reposts").select("article_id").eq("article_id", data.id).eq("user_id", viewer.id).maybeSingle(),
    ]);
    return {
      kind: "full",
      article: {
        ...toCard(data),
        id: data.id,
        bodyMd: data.body_md,
        videoTitle: data.video_title,
        channelName: data.channel_name,
        ratingCount: data.rating_count,
        // The average shows only once enough people have rated.
        ratingAvg: data.rating_count >= 3 ? Math.round((10 * data.rating_sum) / data.rating_count) / 10 : null,
        mine: { score: rating.data?.score ?? null, saved: !!save.data, reposted: !!repost.data },
      },
    };
  }

  const { data } = await supabase.rpc("public_article", { p_slug: slug });
  const row = (data as (CardRow & { preview_md: string })[] | null)?.[0];
  if (!row) return null;
  return { kind: "preview", article: { ...toCard(row), previewMd: row.preview_md } };
}

// Headline and subtitle for link previews; never more than the public half has.
export async function getArticleMeta(slug: string): Promise<{ headline: string; dek: string } | null> {
  await connection(); // the Supabase client reads the clock; wait for the real request (see getViewer)
  const { data } = await createPublicClient().rpc("public_article", { p_slug: slug });
  const row = (data as { headline: string; dek: string }[] | null)?.[0];
  return row ? { headline: row.headline, dek: row.dek } : null;
}

// Articles in a list of ids, keeping the list's order (for Saved and Reposts).
async function cardsInOrder(ids: number[]): Promise<FeedItem[]> {
  if (!ids.length) return [];
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("articles").select(CARD_COLUMNS).eq("status", "published").in("id", ids);
  const byId = new Map((data ?? []).map((r) => [r.id as number, toCard(r)]));
  return ids.flatMap((id) => (byId.has(id) ? [{ article: byId.get(id)!, outside: false }] : []));
}

// The member's saved articles, most recently saved first. Private: RLS returns only their own saves.
export async function getSaved(viewer: Viewer): Promise<FeedItem[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("saves")
    .select("article_id")
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false })
    .limit(60);
  return cardsInOrder((data ?? []).map((r) => r.article_id as number));
}

export type PublicProfile = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarPath: string | null;
  cohortName: string | null;
  city: string;
  interests: string[];
};

// A finished member's profile and their reposts, newest first. Members only (RLS).
export async function getProfile(username: string): Promise<{ profile: PublicProfile; reposts: FeedItem[] } | null> {
  const supabase = await createServerSupabase();
  const { data: p } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name, avatar_path, city, cohorts(name)")
    .eq("username", username.toLowerCase())
    .eq("onboarding_step", "done")
    .maybeSingle();
  if (!p) return null;
  const [{ data: interests }, { data: reposts }] = await Promise.all([
    supabase.from("profile_interests").select("interest_slug").eq("profile_id", p.id),
    supabase.from("reposts").select("article_id").eq("user_id", p.id).order("created_at", { ascending: false }).limit(60),
  ]);
  const cohort = p.cohorts as unknown as { name: string } | null;
  return {
    profile: {
      id: p.id,
      username: p.username,
      firstName: p.first_name,
      lastName: p.last_name,
      avatarPath: p.avatar_path,
      cohortName: cohort?.name ?? null,
      city: p.city,
      interests: (interests ?? []).map((r) => r.interest_slug as string),
    },
    reposts: await cardsInOrder((reposts ?? []).map((r) => r.article_id as number)),
  };
}

// The newest published articles for the homepage. Public: same fields a shared link shows.
export async function getLatest(limit = 6): Promise<FeedItem[]> {
  await connection(); // the Supabase client reads the clock; wait for the real request (see getViewer)
  const { data } = await createPublicClient().rpc("latest_articles", { p_limit: limit });
  return ((data as CardRow[] | null) ?? []).map((r) => ({ article: toCard(r), outside: false }));
}
