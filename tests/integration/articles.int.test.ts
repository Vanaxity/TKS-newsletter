// Runs against the real Supabase project: `TEST_JOIN_CODE=<code> npm run test:int`.
// Needs two fixture articles (see the phase 3 plan, Task 1): one published, one draft.
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Use the environment as is.
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const CODE = process.env.TEST_JOIN_CODE!;
const PUBLISHED = "int-fixture-published-aaaaaa";
const DRAFT = "int-fixture-draft-bbbbbb";

const anon = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function member(): Promise<SupabaseClient> {
  const client = anon();
  const { error } = await client.auth.signUp({
    email: `tks-int-${randomUUID().slice(0, 8)}@mailinator.com`,
    password: "correct-horse-9",
    options: { data: { join_code: CODE } },
  });
  if (error) throw new Error(error.message);
  return client;
}

test("non-members can't read the articles table", async () => {
  expect((await anon().from("articles").select("slug")).data).toEqual([]);
});

test("non-members get only the preview of a published article", async () => {
  const { data, error } = await anon().rpc("public_article", { p_slug: PUBLISHED });
  expect(error).toBeNull();
  expect(data).toHaveLength(1);
  expect(data![0].preview_md).toBe("First half.");
  expect(Object.keys(data![0])).not.toContain("body_md");
  expect(Object.keys(data![0])).not.toContain("shared_by_slack_id");
});

test("drafts don't exist for anyone outside", async () => {
  expect((await anon().rpc("public_article", { p_slug: DRAFT })).data).toEqual([]);
  const m = await member();
  expect((await m.rpc("public_article", { p_slug: DRAFT })).data).toEqual([]);
  expect((await m.from("articles").select("slug").eq("slug", DRAFT)).data).toEqual([]);
});

test("members read the whole published article", async () => {
  const m = await member();
  const { data } = await m.from("articles").select("body_md").eq("slug", PUBLISHED).single();
  expect(data?.body_md).toBe("First half.\n\nSecond half.");
});

test("members can't write articles", async () => {
  const m = await member();
  const { error } = await m.from("articles").insert({
    slug: "nope-cccccc",
    youtube_video_id: "cccccccccc1",
    source: "written",
    headline: "x",
    dek: "x",
    body_md: "x",
    preview_md: "x",
    tags: ["ai"],
    read_minutes: 1,
  });
  expect(error).not.toBeNull();
});

test("members can't see who shared a video", async () => {
  const m = await member();
  const direct = await m.from("articles").select("shared_by_slack_id").eq("slug", PUBLISHED);
  expect(direct.error).not.toBeNull();
  expect((await m.from("article_submitters").select("*")).data ?? []).toEqual([]);
});
