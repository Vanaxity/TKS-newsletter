import "server-only";
import { getViewer, type Viewer } from "@/lib/auth/viewer";
import { INTEREST_SLUGS } from "@/lib/interests";
import { createServerSupabase } from "@/lib/supabase/server";
import { composeFeed, type ArticleCard, type FeedItem } from "./feed";

const CARD_COLUMNS = "slug, headline, dek, tags, read_minutes, youtube_video_id, published_at";

type CardRow = {
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
});

export type FullArticle = ArticleCard & { bodyMd: string; videoTitle: string | null; channelName: string | null };
export type PreviewArticle = ArticleCard & { previewMd: string };

// The member's feed: their interests, newest first, with some picks from outside them.
export async function getFeed(viewer: Viewer, opts: { topic?: string } = {}): Promise<FeedItem[]> {
  const supabase = await createServerSupabase();
  const { data: picked } = await supabase.from("profile_interests").select("interest_slug").eq("profile_id", viewer.id);
  const interests = (picked ?? []).map((r) => r.interest_slug as string);
  const topic = opts.topic && (INTEREST_SLUGS as readonly string[]).includes(opts.topic) ? opts.topic : undefined;

  const published = () => supabase.from("articles").select(CARD_COLUMNS).eq("status", "published");

  if (topic) {
    const { data } = await published().contains("tags", [topic]).order("published_at", { ascending: false }).limit(30);
    return composeFeed((data ?? []).map(toCard), []);
  }

  const [mine, outside] = await Promise.all([
    interests.length
      ? published().overlaps("tags", interests).order("published_at", { ascending: false }).limit(30)
      : Promise.resolve({ data: [] as CardRow[] }),
    interests.length
      ? published()
          .not("tags", "ov", `{${interests.join(",")}}`)
          .order("published_at", { ascending: false })
          .limit(10)
      : published().order("published_at", { ascending: false }).limit(10),
  ]);
  return composeFeed((mine.data ?? []).map(toCard), (outside.data ?? []).map(toCard));
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
      .select(`${CARD_COLUMNS}, body_md, video_title, channel_name`)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!data) return null;
    return {
      kind: "full",
      article: { ...toCard(data), bodyMd: data.body_md, videoTitle: data.video_title, channelName: data.channel_name },
    };
  }

  const { data } = await supabase.rpc("public_article", { p_slug: slug });
  const row = (data as (CardRow & { preview_md: string })[] | null)?.[0];
  if (!row) return null;
  return { kind: "preview", article: { ...toCard(row), previewMd: row.preview_md } };
}

// Headline and subtitle for link previews; never more than the public half has.
export async function getArticleMeta(slug: string): Promise<{ headline: string; dek: string } | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc("public_article", { p_slug: slug });
  const row = (data as { headline: string; dek: string }[] | null)?.[0];
  return row ? { headline: row.headline, dek: row.dek } : null;
}
