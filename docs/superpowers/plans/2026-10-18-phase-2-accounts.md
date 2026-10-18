# Phase 2: Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A TKS student can sign up with email, password and the join code, set up a profile (username, photo, name, cohort, city), pick interests, land on a members-only page, log out and log back in.

**Architecture:** Supabase Auth (email + password) with `@supabase/ssr` cookie sessions; `src/proxy.ts` refreshes the session on every request. The join code is enforced **in the database** by a trigger on `auth.users`, so calling Supabase directly from a browser can't skip it; the sign-up form also pre-checks it for a friendly error. Onboarding progress lives in `profiles.onboarding_step` (`profile` → `interests` → `done`) and every page guards on it. Cache Components is on, so every session read sits inside `<Suspense>`.

**Tech Stack:** Next.js 16.4 (proxy, Server Actions, `useActionState`), `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.118, zod 4, Tailwind 4, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-17-tks-video-articles-design.md` (sections "Signing up", "Accounts and the TKS check", "Data (Supabase)").

## Global Constraints

- Login is email + password only. Email confirmation is **off** (the join code is the gate). Password at least 8 characters.
- The join code is checked on the server and in the database, never only in the browser. Its value never appears in Git (repo is public); it lives in `public.settings` and is set with SQL outside migrations.
- Username: unique, 3–20 characters, `^[a-z0-9_]{3,20}$`; input is lowercased and trimmed before checking.
- Profile picture: JPG, PNG or WebP, up to 5 MB, centre-cropped to a square and resized to 512×512 WebP before upload, stored at `avatars/<user id>/avatar.webp` in a **private** bucket readable by signed-in members only. No photo → initials on TKS green.
- Cohort: choose Global or In-person first, then a specific cohort from `cohorts` (admin-managed later; seeded with placeholders now).
- City: free text, required, 1–80 characters. First and last name: required, 1–50 characters each.
- Interests: at least one, from `interests`.
- A member can't reach `/feed` until onboarding is `done`; leaving halfway resumes at the step they left.
- Every Server Action re-reads the session itself; RLS on every table.
- TKS colours and copy rules from Phase 1 still apply (black text on green, never green text on white).

## Review Focus

1. **Signing up through Supabase's API directly with a wrong or missing join code** must fail, and no `auth.users` row may remain. Tested in Task 1.
2. **A member editing another member's profile, or making themselves `admin`**, must be refused by the database. Tested in Task 1.
3. **A username already taken (any letter case)** shows "That username is taken" on the form, not a crash. Tested in Task 5.
4. **Typing `/feed` or `/onboarding/interests` before finishing earlier steps, or `/login` while logged in,** redirects to the right step. Tested in Task 2 (`pathForStep`) and verified in the Task 7 browser run.
5. **A 6 MB photo, a GIF, or a very tall/wide photo** is refused with a clear message (size/type) or cropped from the centre (shape). Tested in Task 5.

---

## File structure

| Path | Responsibility |
|---|---|
| `supabase/migrations/0002_accounts.sql` | cohorts, profiles, profile_interests, settings, auth trigger, avatars bucket, RLS |
| `src/lib/supabase/server.ts`, `browser.ts`, `proxy.ts` | Supabase clients for Server Components/Actions, the browser, and the proxy |
| `src/proxy.ts` | Refreshes the Supabase session on each request |
| `src/lib/auth/steps.ts` | Onboarding step type and the path for each step |
| `src/lib/auth/schemas.ts` | zod schemas for every form |
| `src/lib/auth/viewer.ts` | Server-only: current user + profile, guards |
| `src/lib/avatar.ts` | Square-crop maths, file checks, initials |
| `src/app/signup`, `src/app/login` | Forms + Server Actions |
| `src/app/onboarding/profile`, `src/app/onboarding/interests` | Onboarding forms + Server Actions |
| `src/app/feed/page.tsx` | Members-only placeholder (real feed is Phase 3) |
| `src/app/actions/logout.ts` | Log out |
| `src/components/ui/*` | Small shared form pieces (Field, Button, ErrorText) |
| `tests/auth/*.test.ts` | Unit tests |
| `tests/integration/accounts.int.test.ts` | Runs against the real Supabase project (`npm run test:int`, not in CI) |

---

### Task 1: Accounts database

**Files:** Create `supabase/migrations/0002_accounts.sql`, `tests/integration/accounts.int.test.ts`, `vitest.integration.config.ts`; modify `package.json` (script `"test:int": "vitest run --config vitest.integration.config.ts"`).

**Interfaces:**
- Produces tables: `cohorts(id int identity pk, name text, type text check in ('global','in_person'), sort int, active bool default true)`; `profiles(id uuid pk → auth.users on delete cascade, username text unique check ~ '^[a-z0-9_]{3,20}$', first_name text, last_name text, avatar_path text, cohort_id int → cohorts, city text, role text default 'member' check in ('member','admin'), onboarding_step text default 'profile' check in ('profile','interests','done'), created_at timestamptz default now())` with check `onboarding_step = 'profile' or (username, first_name, last_name, cohort_id, city all not null)`; `profile_interests(profile_id uuid → profiles on delete cascade, interest_slug text → interests, pk both)`; `settings(id boolean pk default true check (id), join_code text not null)`.
- Produces RPC `public.join_code_is_valid(code text) returns boolean` (security definer, `search_path = ''`, executable by `anon, authenticated`; compares trimmed, case-insensitive).
- Sign-up metadata key: `join_code` in `options.data`.

- [ ] **Step 1: Write the integration test (fails: tables don't exist)**

`vitest.integration.config.ts`: like `vitest.config.ts` but `include: ['tests/integration/**/*.int.test.ts']`, `testTimeout: 30000`. The test loads `.env.local` (`process.loadEnvFile`) and reads `TEST_JOIN_CODE` from the environment; each run uses unique emails `int-<random>@tks-articles.test`.

```ts
test('sign-up with a wrong join code is refused', async () => {
  const { error } = await anon().auth.signUp({ email: email(), password: 'correct-horse-9', options: { data: { join_code: 'WRONG' } } })
  expect(error).not.toBeNull()
})
test('sign-up with no join code is refused', async () => { /* same, no data */ })
test('the right code (any case, spaces) creates a session and a profile at step "profile"', async () => {
  const c = anon()
  const { data, error } = await c.auth.signUp({ email: email(), password: 'correct-horse-9',
    options: { data: { join_code: ` ${process.env.TEST_JOIN_CODE!.toLowerCase()} ` } } })
  expect(error).toBeNull(); expect(data.session).not.toBeNull()
  const { data: p } = await c.from('profiles').select('onboarding_step, role').single()
  expect(p).toEqual({ onboarding_step: 'profile', role: 'member' })
  const { data: u } = await c.auth.getUser()
  expect(u.user?.user_metadata.join_code).toBeUndefined()   // code not stored
})
test('a member cannot make themselves admin or edit someone else', async () => {
  // two signed-up members A and B
  // A: update profiles set role='admin' where id=A → error (no update privilege on role)
  // A: update profiles set city='X' where id=B → 0 rows affected
})
test('join_code_is_valid answers true/false without revealing the code', async () => {
  expect((await anon().rpc('join_code_is_valid', { code: process.env.TEST_JOIN_CODE })).data).toBe(true)
  expect((await anon().rpc('join_code_is_valid', { code: 'nope' })).data).toBe(false)
  expect((await anon().from('settings').select('*')).data).toEqual([])
})
test('cohorts and interests are readable', async () => { /* cohorts ≥ 1 row of each type; interests 15 */ })
test('a member can only write their own interests', async () => { /* A inserting B's profile_interests row → error; own row → ok */ })
```

- [ ] **Step 2: Run it to see it fail**

Run: `TEST_JOIN_CODE=<code> npm run test:int`
Expected: FAIL (relation `profiles` does not exist / RPC missing).

- [ ] **Step 3: Write and apply the migration**

Contents, in order:
1. `cohorts` + seed: `('Global cohort 1','global',1), ('Global cohort 2','global',2), ('In-person cohort 1','in_person',3), ('In-person cohort 2','in_person',4)`. RLS: select to `anon, authenticated` where `active`.
2. `profiles` as in Interfaces. RLS: select to `authenticated` using `id = auth.uid() or onboarding_step = 'done'`. `revoke update on profiles from anon, authenticated; grant update (username, first_name, last_name, avatar_path, cohort_id, city, onboarding_step) on profiles to authenticated;` policy update to `authenticated` using/with check `id = auth.uid()`. No insert/delete policies (rows come from the trigger; deletes cascade from auth).
3. `profile_interests`. RLS: select to `authenticated` using `true`; insert and delete to `authenticated` with `profile_id = auth.uid()`.
4. `settings` with RLS on and **no policies**. No seed row in the migration.
5. `public.join_code_is_valid(code)` as in Interfaces.
6. Trigger function `public.handle_new_user()` (security definer, `search_path = ''`), `before insert on auth.users`: if `upper(trim(coalesce(new.raw_user_meta_data->>'join_code',''))) <> upper(trim((select join_code from public.settings)))` raise exception `'invalid join code'`; else `new.raw_user_meta_data := new.raw_user_meta_data - 'join_code'`; return new. Second trigger function `public.create_profile()` `after insert on auth.users`: `insert into public.profiles (id) values (new.id)`.
7. Storage: `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('avatars','avatars', false, 5242880, array['image/webp','image/jpeg','image/png'])`; policies on `storage.objects`: select to `authenticated` using `bucket_id = 'avatars'`; insert/update/delete to `authenticated` using/with check `bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text`.

Apply with Supabase MCP `apply_migration` (name `0002_accounts`). Set the join code with MCP `execute_sql`: `insert into public.settings (join_code) values ('<code>')` (not in Git). Run `get_advisors` security; fix anything flagged for these objects.

- [ ] **Step 4: Sam turns email confirmation off** (Supabase dashboard → Authentication → Sign In / Providers → Email → untick "Confirm email" → Save). Without it, sign-up returns no session.

- [ ] **Step 5: Run it to see it pass, then clean up test users**

Run: `TEST_JOIN_CODE=<code> npm run test:int` → Expected: PASS (7 tests). Then MCP `execute_sql`: `delete from auth.users where email like 'int-%@tks-articles.test'`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0002_accounts.sql tests/integration vitest.integration.config.ts package.json
git commit -m "Add accounts schema: profiles, cohorts, interests, join-code trigger, avatars bucket"
```

### Task 2: Supabase session plumbing and onboarding steps

**Files:** Create `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`, `src/lib/supabase/proxy.ts`, `src/proxy.ts`, `src/lib/auth/steps.ts`, `src/lib/auth/viewer.ts`, `tests/auth/steps.test.ts`. Add dependency `@supabase/ssr@0.12`, `server-only`.

**Interfaces:**
- `createServerSupabase(): Promise<SupabaseClient>` — `createServerClient` with `cookies()` getAll/setAll (setAll wrapped in try/catch for Server Components).
- `createBrowserSupabase(): SupabaseClient` — `createBrowserClient`.
- `updateSession(request: NextRequest): Promise<NextResponse>` — Supabase's documented proxy pattern, calling `supabase.auth.getClaims()` and nothing between client creation and that call.
- `src/proxy.ts`: `export async function proxy(request)` → `updateSession(request)`; matcher excludes `_next/static`, `_next/image`, `favicon.ico`, image files, and `/api/health`.
- `export type OnboardingStep = 'profile' | 'interests' | 'done'`
- `export function pathForStep(step: OnboardingStep): '/onboarding/profile' | '/onboarding/interests' | '/feed'`
- `export type Viewer = { id: string; email: string; profile: { username: string | null; firstName: string | null; lastName: string | null; avatarPath: string | null; cohortId: number | null; city: string | null; role: 'member' | 'admin'; onboardingStep: OnboardingStep } }`
- `export async function getViewer(): Promise<Viewer | null>` (server-only; `getClaims()` then one `profiles` select)
- `export async function requireStep(step: OnboardingStep): Promise<Viewer>` — no viewer → `redirect('/login')`; viewer at another step → `redirect(pathForStep(viewer.profile.onboardingStep))`.
- `export async function redirectIfSignedIn(): Promise<void>` — signed in → `redirect(pathForStep(step))`.

- [ ] **Step 1: Failing test**

```ts
test.each([['profile','/onboarding/profile'],['interests','/onboarding/interests'],['done','/feed']] as const)(
  'step %s → %s', (step, path) => expect(pathForStep(step)).toBe(path))
```

- [ ] **Step 2: Run it** — `npm test -- tests/auth/steps.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement** the files in Interfaces.
- [ ] **Step 4: Run it** → PASS. `npm run typecheck && npm run build` → succeed; `curl -s localhost:3000/api/health` still `{"ok":true,"interests":15}`.
- [ ] **Step 5: Commit** — `git commit -m "Add Supabase session plumbing, proxy and onboarding step guards"`

### Task 3: Form schemas

**Files:** Create `src/lib/auth/schemas.ts`, `tests/auth/schemas.test.ts`.

**Interfaces:**
- `export const USERNAME_RE = /^[a-z0-9_]{3,20}$/`
- `SignupSchema` {email, password (min 8), joinCode (trimmed, min 1)}; `LoginSchema` {email, password min 1}; `ProfileSchema` {username (trim+lowercase, USERNAME_RE), firstName, lastName (trim, 1–50), cohortType ('global'|'in_person'), cohortId (coerce int, positive), city (trim, 1–80), avatarPath (optional, must match `^<uuid>/avatar\.webp$` or be empty)}; `InterestsSchema` {interests: array of interest slugs, min 1, deduped}.
- `export function fieldErrors(error: z.ZodError): Record<string, string>` — first message per field.
- `export type FormState = { error?: string; fieldErrors?: Record<string, string> }`

- [ ] **Step 1: Failing tests**

```ts
test('username is lowercased and trimmed', () => expect(ProfileSchema.parse(valid({ username: '  Sam_99 ' })).username).toBe('sam_99'))
test.each(['ab', 'a'.repeat(21), 'has space', 'dash-no', 'émile'])('rejects username %s', u =>
  expect(ProfileSchema.safeParse(valid({ username: u })).success).toBe(false))
test('password needs 8 characters', () => expect(SignupSchema.safeParse({ email: 'a@b.co', password: 'short', joinCode: 'X' }).success).toBe(false))
test('city and names are required', () => { /* '' city → error 'Enter your city'; '' firstName → 'Enter your first name' */ })
test('interests need at least one known slug', () => {
  expect(InterestsSchema.safeParse({ interests: [] }).success).toBe(false)
  expect(InterestsSchema.safeParse({ interests: ['cooking'] }).success).toBe(false)
  expect(InterestsSchema.parse({ interests: ['ai', 'ai', 'math'] }).interests).toEqual(['ai', 'math'])
})
test('fieldErrors maps the first message per field', () => { /* ProfileSchema.safeParse({}) → keys include username, city */ })
```
Use these exact messages: username → "3–20 characters: lowercase letters, numbers or _"; firstName → "Enter your first name"; lastName → "Enter your last name"; city → "Enter your city"; cohortId → "Pick your cohort"; password → "At least 8 characters"; email → "Enter a valid email"; joinCode → "Enter the TKS join code"; interests → "Pick at least one interest".

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "Add form schemas for sign-up, log-in, profile and interests"`

### Task 4: Sign up, log in, log out

**Files:** Create `src/app/signup/page.tsx`, `src/app/signup/signup-form.tsx`, `src/app/signup/actions.ts`, `src/app/login/page.tsx`, `src/app/login/login-form.tsx`, `src/app/login/actions.ts`, `src/app/actions/logout.ts`, `src/components/ui/field.tsx`, `src/components/ui/button.tsx`, `src/lib/auth/errors.ts`, `tests/auth/errors.test.ts`; modify `src/app/page.tsx` (add "Sign up" and "Log in" buttons).

**Interfaces:**
- `signup(prev: FormState, formData: FormData): Promise<FormState>` — parse `SignupSchema`; `rpc('join_code_is_valid')` false → `{ fieldErrors: { joinCode: 'That join code is not right. Ask in TKS Slack.' } }`; `auth.signUp` with `options.data.join_code`; success → `redirect('/onboarding/profile')`.
- `login(prev, formData)` — `signInWithPassword`; success → read step → `redirect(pathForStep(step))`.
- `logout()` — `signOut()` → `redirect('/')`.
- `export function authErrorMessage(code: string | undefined, message: string): string` — maps Supabase error codes: `user_already_exists` → "An account with that email already exists. Log in instead."; `invalid_credentials` → "Wrong email or password."; `weak_password` → "Choose a stronger password (at least 8 characters)."; `over_request_rate_limit`/`over_email_send_rate_limit` → "Too many tries. Wait a minute and try again."; message containing "invalid join code" or "Database error saving new user" → "That join code is not right. Ask in TKS Slack."; anything else → "Something went wrong. Try again."

- [ ] **Step 1: Failing test** for `authErrorMessage` covering each mapping above.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** the error map, actions and pages. Pages are static shells; the part that calls `redirectIfSignedIn()` sits in `<Suspense>`. Forms are client components using `useActionState`, showing field errors under fields and the form error above the button, with a pending state on the button. Style: off-white page, white card, black text, green button with black text.
- [ ] **Step 4: Run** → PASS; `npm run build` succeeds (no "cookies outside Suspense" error).
- [ ] **Step 5: Commit** — `git commit -m "Add sign-up, log-in and log-out"`

### Task 5: Onboarding step 1, the profile

**Files:** Create `src/lib/avatar.ts`, `tests/auth/avatar.test.ts`, `src/app/onboarding/profile/page.tsx`, `src/app/onboarding/profile/profile-form.tsx`, `src/app/onboarding/profile/avatar-picker.tsx`, `src/app/onboarding/profile/actions.ts`, `src/app/onboarding/layout.tsx` (step indicator "1 Profile · 2 Interests").

**Interfaces:**
- `export const AVATAR_MAX_BYTES = 5 * 1024 * 1024`, `AVATAR_TYPES = ['image/jpeg','image/png','image/webp']`, `AVATAR_SIZE = 512`
- `export function checkAvatarFile(file: { type: string; size: number }): string | null` — null if OK, else "Photos must be JPG, PNG or WebP." / "Photos must be 5 MB or smaller."
- `export function squareCrop(width: number, height: number): { sx: number; sy: number; size: number }` — largest centred square.
- `export function initials(first: string | null, last: string | null): string` — up to 2 uppercase letters, "?" if none.
- `saveProfile(prev: FormState, formData: FormData): Promise<FormState>` — `requireStep` must allow `profile` (and `interests`, so going Back works); parse `ProfileSchema`; check `cohortId` belongs to `cohortType`; update own profile with `onboarding_step: 'interests'`; Postgres `23505` → `{ fieldErrors: { username: 'That username is taken' } }`; success → `redirect('/onboarding/interests')`.
- `avatar-picker.tsx` (client): file input → `checkAvatarFile` → draw `squareCrop` region onto a 512×512 canvas → `toBlob('image/webp', 0.9)` → upload with `createBrowserSupabase().storage.from('avatars').upload(`${userId}/avatar.webp`, blob, { upsert: true, contentType: 'image/webp' })` → put the path in a hidden `avatarPath` input; shows the preview, or initials when empty.

- [ ] **Step 1: Failing tests**

```ts
test('accepts a 1 MB JPEG', () => expect(checkAvatarFile({ type: 'image/jpeg', size: 1_000_000 })).toBeNull())
test('refuses a 6 MB photo', () => expect(checkAvatarFile({ type: 'image/png', size: 6 * 1024 * 1024 })).toBe('Photos must be 5 MB or smaller.'))
test('refuses a GIF', () => expect(checkAvatarFile({ type: 'image/gif', size: 1000 })).toBe('Photos must be JPG, PNG or WebP.'))
test('wide photo crops from the centre', () => expect(squareCrop(1200, 800)).toEqual({ sx: 200, sy: 0, size: 800 }))
test('tall photo crops from the centre', () => expect(squareCrop(500, 2000)).toEqual({ sx: 0, sy: 750, size: 500 }))
test('initials', () => { expect(initials('sam', 'gun')).toBe('SG'); expect(initials('Richard', null)).toBe('R'); expect(initials(null, null)).toBe('?') })
```
Plus, in `tests/integration/accounts.int.test.ts`: `test('a username taken in another case is refused by the database')` — member A sets `sam_test_x`, member B updating to the same → error code `23505`.

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** Cohort picker: two radio cards "Global" / "In-person", then a `<select>` listing only cohorts of that type (data from a server component inside Suspense). **Step 4: Run** unit + integration tests → PASS.
- [ ] **Step 5: Commit** — `git commit -m "Add onboarding profile step with avatar upload and cohort picker"`

### Task 6: Onboarding step 2, interests

**Files:** Create `src/app/onboarding/interests/page.tsx`, `interests-form.tsx`, `actions.ts`.

**Interfaces:**
- `saveInterests(prev: FormState, formData: FormData): Promise<FormState>` — `requireStep('interests')` (also allowed at `done`, for editing later); parse `InterestsSchema` from `formData.getAll('interests')`; delete the member's rows in `profile_interests`, insert the new set; set `onboarding_step: 'done'`; `redirect('/feed')`.
- The form: 15 toggle chips (labels from `INTERESTS`), selected = green with black text, unselected = white with a grey border; a "Back" link to `/onboarding/profile`; submit disabled until one is picked (server still validates).

- [ ] **Step 1: Implement** the page and action (the RLS rule they rely on is tested in Task 1).
- [ ] **Step 2: Verify** — `npm test && npm run build` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "Add onboarding interests step"`

### Task 7: Members-only placeholder, guards, and a full browser run

**Files:** Create `src/app/feed/page.tsx`, `src/components/avatar.tsx` (server component: signed URL for `avatarPath` via `storage.from('avatars').createSignedUrl(path, 3600)`, else initials circle); modify `src/app/page.tsx` (signed-in visitors see "Go to your feed").

**Interfaces:**
- `/feed`: `requireStep('done')`; shows avatar, "Hi <first name>", cohort and city, the member's interests as chips, "Your feed is coming soon", and a Log out button (form posting to `logout`).

- [ ] **Step 1: Build check** — `npm run lint && npm run typecheck && npm test && npm run build` → all succeed.
- [ ] **Step 2: Browser run on localhost** (test account `walkthrough-<random>@tks-articles.test`, recorded in nothing but the run):
  1. `/feed` while logged out → lands on `/login`.
  2. Sign up with a wrong code → "That join code is not right…"; with the real code → `/onboarding/profile`.
  3. Type `/feed` → back on `/onboarding/profile`.
  4. Submit an empty profile → field errors; upload a photo; pick In-person → only in-person cohorts listed; submit → `/onboarding/interests`.
  5. Submit with none picked → blocked; pick two → `/feed` shows photo, name, cohort, city, chips.
  6. Log out → `/`; `/login` → log in → straight to `/feed`; visiting `/signup` while logged in → `/feed`.
- [ ] **Step 3: Clean up** — MCP `execute_sql`: delete the walkthrough user and its avatar object.
- [ ] **Step 4: Commit, push, PR**

```bash
git add -A
git commit -m "Add members-only placeholder page and route guards"
git push -u origin feat/accounts
gh pr create --base main --title "Accounts: sign up with join code, profile, interests" --body "Phase 2. See docs/superpowers/plans/2026-10-18-phase-2-accounts.md"
```
Expected: `ci` and Vercel checks pass; repeat steps 2.1–2.6 quickly on the Vercel preview URL.
