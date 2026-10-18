// Runs against the real Supabase project: `TEST_JOIN_CODE=<code> npm run test:int`.
// Needs the fixture article "int-fixture-actions-dddddd" (see the phase 4 plan, Task 1).
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { saveRating } from "@/lib/articles/rating";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Use the environment as is.
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const CODE = process.env.TEST_JOIN_CODE!;
const SLUG = "int-fixture-actions-dddddd";

const anon = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function member(): Promise<{ c: SupabaseClient; id: string }> {
  const c = anon();
  const { data, error } = await c.auth.signUp({
    email: `tks-int-${randomUUID().slice(0, 8)}@mailinator.com`,
    password: "correct-horse-9",
    options: { data: { join_code: CODE } },
  });
  if (error || !data.user) throw new Error(error?.message ?? "no user");
  return { c, id: data.user.id };
}

async function articleId(c: SupabaseClient): Promise<number> {
  const { data } = await c.from("articles").select("id").eq("slug", SLUG).single();
  return data!.id as number;
}

const counters = async (c: SupabaseClient) =>
  (await c.from("articles").select("repost_count, rating_sum, rating_count").eq("slug", SLUG).single()).data;

test("rating, changing and removing it keeps the counters exact", async () => {
  const a = await member();
  const id = await articleId(a.c);
  const before = await counters(a.c);
  expect((await a.c.from("ratings").insert({ article_id: id, score: 7 })).error).toBeNull();
  expect((await a.c.from("ratings").update({ score: 9 }).eq("article_id", id).eq("user_id", a.id)).error).toBeNull();
  expect(await counters(a.c)).toMatchObject({ rating_count: before!.rating_count + 1, rating_sum: before!.rating_sum + 9 });
  expect((await a.c.from("ratings").delete().eq("article_id", id).eq("user_id", a.id)).error).toBeNull();
  expect(await counters(a.c)).toMatchObject({ rating_count: before!.rating_count, rating_sum: before!.rating_sum });
});

test("scores outside 1-10 are refused", async () => {
  const a = await member();
  const id = await articleId(a.c);
  expect((await a.c.from("ratings").insert({ article_id: id, score: 11 })).error).not.toBeNull();
  expect((await a.c.from("ratings").insert({ article_id: id, score: 0 })).error).not.toBeNull();
});

test("reposting twice is refused and undoing restores the count", async () => {
  const a = await member();
  const id = await articleId(a.c);
  const start = (await counters(a.c))!.repost_count;
  expect((await a.c.from("reposts").insert({ article_id: id })).error).toBeNull();
  expect((await a.c.from("reposts").insert({ article_id: id })).error).not.toBeNull();
  expect((await counters(a.c))!.repost_count).toBe(start + 1);
  expect((await a.c.from("reposts").delete().eq("article_id", id).eq("user_id", a.id)).error).toBeNull();
  expect((await counters(a.c))!.repost_count).toBe(start);
});

test("saves are private", async () => {
  const a = await member();
  const b = await member();
  const id = await articleId(a.c);
  expect((await a.c.from("saves").insert({ article_id: id })).error).toBeNull();
  expect((await a.c.from("saves").select("article_id")).data).toEqual([{ article_id: id }]);
  expect((await b.c.from("saves").select("article_id")).data).toEqual([]);
});

test("nobody can act on someone else's behalf", async () => {
  const a = await member();
  const b = await member();
  const id = await articleId(a.c);
  expect((await a.c.from("reposts").insert({ article_id: id, user_id: b.id })).error).not.toBeNull();
  expect((await a.c.from("ratings").insert({ article_id: id, user_id: b.id, score: 5 })).error).not.toBeNull();
  expect((await a.c.from("saves").insert({ article_id: id, user_id: b.id })).error).not.toBeNull();
});

test("members can't set the counters directly", async () => {
  const a = await member();
  const res = await a.c.from("articles").update({ repost_count: 999 }).eq("slug", SLUG).select();
  expect(res.error !== null || (res.data ?? []).length === 0).toBe(true);
  expect((await counters(a.c))!.repost_count).not.toBe(999);
});

test("reposts are visible to other members (for profiles)", async () => {
  const a = await member();
  const b = await member();
  const id = await articleId(a.c);
  await a.c.from("reposts").insert({ article_id: id });
  const { data } = await b.c.from("reposts").select("user_id").eq("user_id", a.id);
  expect(data).toEqual([{ user_id: a.id }]);
});

test("saveRating (what the Rate action uses) creates, then changes, one rating", async () => {
  const a = await member();
  const id = await articleId(a.c);
  const start = await counters(a.c);
  expect(await saveRating(a.c, a.id, id, 6)).toBe(true);
  expect(await saveRating(a.c, a.id, id, 9)).toBe(true);
  expect((await a.c.from("ratings").select("score").eq("article_id", id).eq("user_id", a.id)).data).toEqual([{ score: 9 }]);
  expect(await counters(a.c)).toMatchObject({ rating_count: start!.rating_count + 1, rating_sum: start!.rating_sum + 9 });
});
