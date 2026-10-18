// Runs against the real Supabase project: `TEST_JOIN_CODE=<code> npm run test:int`.
// Test users are int-*@tks-articles.test; delete them afterwards (see the phase 2 plan).
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
const PASSWORD = "correct-horse-9";

const anon = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const email = () => `int-${randomUUID().slice(0, 8)}@tks-articles.test`;

async function member(): Promise<{ client: SupabaseClient; id: string }> {
  const client = anon();
  const { data, error } = await client.auth.signUp({ email: email(), password: PASSWORD, options: { data: { join_code: CODE } } });
  if (error || !data.user || !data.session) throw new Error(`sign-up failed: ${error?.message ?? "no session"}`);
  return { client, id: data.user.id };
}

beforeAll(() => {
  if (!CODE) throw new Error("Set TEST_JOIN_CODE");
});

test("sign-up with a wrong join code is refused", async () => {
  const { data, error } = await anon().auth.signUp({ email: email(), password: PASSWORD, options: { data: { join_code: "WRONG" } } });
  expect(error).not.toBeNull();
  expect(data.user).toBeNull();
});

test("sign-up with no join code is refused", async () => {
  const { error } = await anon().auth.signUp({ email: email(), password: PASSWORD });
  expect(error).not.toBeNull();
});

test('the right code (any case, spaces) creates a session and a profile at step "profile"', async () => {
  const c = anon();
  const { data, error } = await c.auth.signUp({
    email: email(),
    password: PASSWORD,
    options: { data: { join_code: ` ${CODE.toLowerCase()} ` } },
  });
  expect(error).toBeNull();
  expect(data.session).not.toBeNull();
  const { data: p } = await c.from("profiles").select("onboarding_step, role").single();
  expect(p).toEqual({ onboarding_step: "profile", role: "member" });
  const { data: u } = await c.auth.getUser();
  expect(u.user?.user_metadata.join_code).toBeUndefined();
});

test("a member cannot make themselves admin or edit someone else", async () => {
  const a = await member();
  const b = await member();
  const promote = await a.client.from("profiles").update({ role: "admin" }).eq("id", a.id);
  expect(promote.error).not.toBeNull();
  const other = await a.client.from("profiles").update({ city: "Elsewhere" }).eq("id", b.id).select();
  expect(other.data ?? []).toEqual([]);
  const { data: still } = await b.client.from("profiles").select("city").single();
  expect(still?.city).toBeNull();
});

test("the join code can't be read or looked up from outside", async () => {
  expect((await anon().from("settings").select("*")).data).toEqual([]);
  expect((await anon().rpc("join_code_is_valid", { code: CODE })).error).not.toBeNull();
});

test("cohorts and interests are readable", async () => {
  const { data: cohorts } = await anon().from("cohorts").select("type");
  expect(cohorts?.some((c) => c.type === "global")).toBe(true);
  expect(cohorts?.some((c) => c.type === "in_person")).toBe(true);
  const { count } = await anon().from("interests").select("slug", { count: "exact", head: true });
  expect(count).toBe(15);
});

test("a username taken in another case is refused by the database", async () => {
  const name = `int_${randomUUID().slice(0, 8)}`;
  const profile = { first_name: "Int", last_name: "Test", cohort_id: 1, city: "Testville", onboarding_step: "interests" };
  const a = await member();
  const b = await member();
  expect((await a.client.from("profiles").update({ ...profile, username: name }).eq("id", a.id)).error).toBeNull();
  const clash = await b.client.from("profiles").update({ ...profile, username: name }).eq("id", b.id);
  expect(clash.error?.code).toBe("23505");
});

test("a member can only write their own interests", async () => {
  const a = await member();
  const b = await member();
  const foreign = await a.client.from("profile_interests").insert({ profile_id: b.id, interest_slug: "ai" });
  expect(foreign.error).not.toBeNull();
  const own = await a.client.from("profile_interests").insert({ profile_id: a.id, interest_slug: "ai" });
  expect(own.error).toBeNull();
});
