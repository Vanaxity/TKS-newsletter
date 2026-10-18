import type { SupabaseClient } from "@supabase/supabase-js";

// Saves a member's rating. Members may only update a rating's score (not which article or member it
// belongs to), so this updates first and inserts only when there's no rating yet. An upsert would try to
// write every column and be refused.
export async function saveRating(
  supabase: SupabaseClient,
  userId: string,
  articleId: number,
  score: number,
): Promise<boolean> {
  const update = () =>
    supabase
      .from("ratings")
      .update({ score, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("article_id", articleId)
      .select("article_id");

  const first = await update();
  if (first.error) return false;
  if (first.data.length) return true;

  const { error } = await supabase.from("ratings").insert({ user_id: userId, article_id: articleId, score });
  if (!error) return true;
  // Another tab rated at the same moment: the row exists now, so update it.
  if (error.code === "23505") return !(await update()).error;
  return false;
}
