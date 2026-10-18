"use server";

import { saveRating } from "@/lib/articles/rating";
import { getViewer } from "@/lib/auth/viewer";
import { createServerSupabase } from "@/lib/supabase/server";

const validId = (id: unknown): id is number => Number.isInteger(id) && (id as number) > 0;

// Each action re-reads the session; the database only lets members write their own rows.
export async function rateArticle(articleId: number, score: number): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer || !validId(articleId) || !Number.isInteger(score) || score < 1 || score > 10) return { ok: false };
  return { ok: await saveRating(await createServerSupabase(), viewer.id, articleId, score) };
}

export async function toggleSave(articleId: number): Promise<{ saved: boolean } | null> {
  const viewer = await getViewer();
  if (!viewer || !validId(articleId)) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("saves").delete().eq("user_id", viewer.id).eq("article_id", articleId).select();
  if (data?.length) return { saved: false };
  const { error } = await supabase.from("saves").insert({ user_id: viewer.id, article_id: articleId });
  // A duplicate means another tab already saved it.
  return { saved: !error || error.code === "23505" };
}

export async function toggleRepost(articleId: number): Promise<{ reposted: boolean; count: number } | null> {
  const viewer = await getViewer();
  if (!viewer || !validId(articleId)) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("reposts").delete().eq("user_id", viewer.id).eq("article_id", articleId).select();
  let reposted = false;
  if (!data?.length) {
    const { error } = await supabase.from("reposts").insert({ user_id: viewer.id, article_id: articleId });
    reposted = !error || error.code === "23505";
  }
  const { data: article } = await supabase.from("articles").select("repost_count").eq("id", articleId).single();
  return { reposted, count: article?.repost_count ?? 0 };
}
