# Phase 1: Setup and Summariser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployed, empty Next.js site in TKS colours connected to Supabase and Vercel, plus a tested summariser that turns a YouTube link into a checked draft article.

**Architecture:** Next.js App Router at the repo root, Tailwind v4 theme tokens for the TKS palette, Supabase for data (one `interests` table in this phase, proving the connection through `/api/health`). The summariser is a framework-free TypeScript module in `src/lib/summariser/` with injected `fetch`, so it runs from a CLI now and from a Slack handler in a later phase. Later phases (accounts, feed, reader actions, homepage, Slack, issues, admin, launch) get their own plans.

**Tech Stack:** Node 24, Next.js 16.4, React 19, TypeScript (strict), Tailwind CSS 4.3, Vitest 5, zod 4, @supabase/supabase-js 2.118, tsx 4 for scripts, GitHub Actions, Vercel (Hobby), Supabase (free), OpenRouter → `google/gemini-3.5-flash-lite`.

**Spec:** `docs/superpowers/specs/2026-10-17-tks-video-articles-design.md`

## Global Constraints

- The repo is **public**: no secrets and no real student data in Git. Keys live in `.env.local` (ignored) and Vercel environment variables. `.env.example` lists names only.
- Never push to `main`. Each task group lands through a pull request.
- TKS colours, exactly: green `#51B04C`, green hover `#459A40`, black `#17191A`, off-white `#F2F2F2`, white `#FFFFFF`, grey `#8F9091`, lines `#D3D3D3`. Use black text on green; never green text on white.
- Font: Inter via `next/font/google` (free lookalike for PP Neue Montreal).
- Interest list (slug → label), in this order: `math` Math, `physics` Physics, `chemistry` Chemistry, `biology` Biology, `neuroscience` Neuroscience, `robotics` Robotics, `ai` AI, `computer-science` Computer science, `space` Space, `energy` Energy, `climate` Climate, `medicine` Medicine, `engineering` Engineering, `business` Business, `design` Design.
- Summariser model: `google/gemini-3.5-flash-lite` by default, overridable with `SUMMARISER_MODEL`. Only the video URL and fixed instructions are sent: never Slack text or names.
- Article length: videos of 5 minutes or less → 100–250 words, never padded. Longer videos → about 30 words per minute, at least 250, at most 1,500.
- Videos longer than 120 minutes are rejected. Videos YouTube's oEmbed can't see (private, unlisted, deleted) are rejected before any paid call.
- Each article carries 1–3 tags, all from the interest list.

## Review Focus

1. **Links as they arrive from Slack** (`<https://youtu.be/ID?si=x|label>`, `&amp;t=30s`, `m.youtube.com`, `/shorts/`, `/live/`) must yield the 11-character video ID; non-YouTube links yield `null`. Tested in Task 4.
2. **A private, unlisted or deleted video** must be rejected with a clear reason and no OpenRouter call (no cost). Tested in Task 7.
3. **Gemini replying with fenced JSON, extra prose, an unknown tag or a missing field** must give a `failed` result with a reason, never a crash. Tested in Task 6 and Task 7.
4. **Transient OpenRouter errors** (429, 5xx, 400 containing `INVALID_ARGUMENT`) are retried, 3 attempts total, then reported. Other 4xx errors are not retried. Tested in Task 6.
5. **Titles differing only in punctuation** ("Deep learning, chapter 1" vs "Deep learning chapter 1") must match; a different video's title must not. Tested in Task 5.

---

## File structure

| Path | Responsibility |
|---|---|
| `src/app/layout.tsx`, `src/app/globals.css` | Root layout, Inter font, Tailwind theme tokens for TKS colours |
| `src/app/page.tsx` | Placeholder homepage (replaced in the homepage phase) |
| `src/app/api/health/route.ts` | Proves Supabase is reachable from a deployment |
| `src/lib/interests.ts` | The single source of truth for interest slugs and labels |
| `src/lib/supabase/public.ts` | Supabase client using the publishable key (no session) |
| `supabase/migrations/0001_interests.sql` | `interests` table, RLS, seed rows |
| `src/lib/summariser/youtube.ts` | Video-ID parsing and oEmbed lookup |
| `src/lib/summariser/rules.ts` | Length targets, read time, title matching |
| `src/lib/summariser/draft.ts` | zod schema for Gemini's JSON and parsing of the raw reply |
| `src/lib/summariser/prompt.ts` | The fixed instruction text |
| `src/lib/summariser/openrouter.ts` | OpenRouter call with retries and cost |
| `src/lib/summariser/summarise.ts` | Orchestration: link in, `SummariseResult` out |
| `scripts/summarise.ts` | CLI wrapper for manual runs |
| `tests/**` | Vitest tests mirroring `src/` |
| `.github/workflows/ci.yml` | Lint, typecheck and test on every PR |

---

### Task 1: Next.js scaffold with TKS theme and CI

**Files:**
- Create: everything `create-next-app` generates, plus `vitest.config.ts`, `.github/workflows/ci.yml`, `.env.example`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `package.json`, `.gitignore` (keep ours; merge in anything Next adds)

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`); Tailwind colour utilities `tks-green`, `tks-green-hover`, `tks-black`, `tks-offwhite`, `tks-white`, `tks-grey`, `tks-line`; font variable `--font-inter`.

- [ ] **Step 1: Generate the app in place**

Run: `npx create-next-app@16.4.2 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack --yes`
The folder already has `README.md`, `.gitignore` and `docs/`; if the generator refuses a non-empty folder, generate into a temp folder and move the files over, keeping our `README.md` and `.gitignore` entries.
Expected: `npm run build` succeeds.

- [ ] **Step 2: Add theme tokens and font**

In `globals.css`, inside `@theme`, define `--color-tks-green: #51B04C`, `--color-tks-green-hover: #459A40`, `--color-tks-black: #17191A`, `--color-tks-offwhite: #F2F2F2`, `--color-tks-white: #FFFFFF`, `--color-tks-grey: #8F9091`, `--color-tks-line: #D3D3D3`, and `--font-sans: var(--font-inter)`. Body: off-white background, black text. In `layout.tsx`, load Inter with `variable: '--font-inter'`, set `<html lang="en">`, metadata title "TKS articles".

- [ ] **Step 3: Placeholder homepage**

`page.tsx`: full-height off-white page, the words "TKS articles" in black, a short line "Cool videos from #r-thisiscool, turned into articles. Coming soon.", and one green pill with black text reading "Coming soon". No other content.

- [ ] **Step 4: Vitest, typecheck script, env example**

Install dev deps `vitest@5 tsx@4`. `vitest.config.ts`: node environment, `globals: true`, `include: ['tests/**/*.test.ts']`, alias `@` → `./src`; add `"vitest/globals"` to `compilerOptions.types` in `tsconfig.json`. Add `"typecheck": "tsc --noEmit"` and `"test": "vitest run --passWithNoTests"`. Create `.env.example` with these names and empty values: `OPENROUTER_API_KEY`, `SUMMARISER_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

- [ ] **Step 5: CI workflow**

`.github/workflows/ci.yml`: on `pull_request` and on `push` to `main`; one job named `ci` on `ubuntu-latest`, Node 24, `npm ci`, then `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

- [ ] **Step 6: Verify locally**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: all four succeed. `npm run dev` then open `http://localhost:3000`: off-white page, black "TKS articles", green "Coming soon" pill.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js app with TKS theme, Vitest and CI"
```

### Task 2: Supabase project, interests table and health check

**Files:**
- Create: `src/lib/interests.ts`, `supabase/migrations/0001_interests.sql`, `src/lib/supabase/public.ts`, `src/app/api/health/route.ts`, `tests/interests.test.ts`
- Local only (ignored): `.env.local`

**Interfaces:**
- Produces:
  - `export const INTERESTS: readonly { slug: string; label: string }[]` (the 15 from Global Constraints, in order)
  - `export const INTEREST_SLUGS: readonly [string, ...string[]]` (for `z.enum`)
  - `export function createPublicClient(): SupabaseClient` (reads `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; throws `Error('Supabase env vars missing')` if either is empty)
  - `GET /api/health` → `200 {"ok":true,"interests":15}` or `503 {"ok":false,"error":"..."}`

- [ ] **Step 1: Create the Supabase project** (needs Sam's okay on the $0 cost)

With the Supabase MCP: `create_project` name `tks-articles`, region `us-east-1`, org "Vanaxity's Org". Wait for `ACTIVE` with `get_project`. Get the URL with `get_project_url` and a publishable key with `get_publishable_keys`; write both into `.env.local`. Copy `OPENROUTER_API_KEY` from `C:\Coding\TKS-newsletter\.env` into `.env.local`.

- [ ] **Step 2: Write the failing test**

```ts
// tests/interests.test.ts
import { readFileSync } from 'node:fs'
import { INTERESTS, INTEREST_SLUGS } from '@/lib/interests'

test('15 interests with unique slugs, in the agreed order', () => {
  expect(INTEREST_SLUGS).toEqual(['math','physics','chemistry','biology','neuroscience','robotics','ai',
    'computer-science','space','energy','climate','medicine','engineering','business','design'])
  expect(new Set(INTEREST_SLUGS).size).toBe(15)
  expect(INTERESTS.find(i => i.slug === 'ai')?.label).toBe('AI')
})

test('migration seeds exactly the same slugs', () => {
  const sql = readFileSync('supabase/migrations/0001_interests.sql', 'utf8')
  const seeded = [...sql.matchAll(/\('([a-z-]+)',\s*'[^']+',\s*\d+\)/g)].map(m => m[1])
  expect(seeded).toEqual([...INTEREST_SLUGS])
})
```

- [ ] **Step 3: Run it to see it fail**

Run: `npm test -- tests/interests.test.ts`
Expected: FAIL, cannot resolve `@/lib/interests`.

- [ ] **Step 4: Implement `interests.ts` and the migration**

Migration: `create table public.interests (slug text primary key, label text not null, sort int not null)`; `alter table ... enable row level security`; policy `interests are readable by everyone` for `select` to `anon, authenticated` using `true`; then one `insert ... values` with rows written as `('math', 'Math', 1),` etc. in the agreed order.

- [ ] **Step 5: Run the test to see it pass**

Run: `npm test -- tests/interests.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Apply the migration and add the health route**

Apply with the Supabase MCP `apply_migration` (name `0001_interests`, the file's SQL). Then run `get_advisors` (security) and fix anything it flags for this table. `route.ts`: `createPublicClient()`, `select('slug', { count: 'exact', head: true })` on `interests`, return the shapes in Interfaces; any thrown error or Supabase error → 503 with its message.

- [ ] **Step 7: Verify**

Run: `npm run dev`, then `curl -s localhost:3000/api/health`
Expected: `{"ok":true,"interests":15}`. With `NEXT_PUBLIC_SUPABASE_URL` blanked in `.env.local` and the dev server restarted: `503` and `{"ok":false,"error":"Supabase env vars missing"}` (restore the value after).

- [ ] **Step 8: Commit, push, open PR**

```bash
git add -A
git commit -m "Add Supabase interests table, public client and health check"
git push -u origin feat/setup
gh pr create --base main --title "Setup: Next.js app, TKS theme, Supabase, CI" --body "Phase 1 tasks 1-2. See docs/superpowers/plans/2026-10-17-phase-1-setup-and-summariser.md"
```
Expected: the `ci` check passes on the PR.

### Task 3: Vercel project and branch protection (with Sam)

**Files:** none in the repo.

**Interfaces:**
- Produces: a Vercel project linked to `Vanaxity/TKS-newsletter` with preview deployments per PR; a GitHub ruleset on `main`.

- [ ] **Step 1: Sam imports the repo on Vercel**

Sam, signed in to Vercel with GitHub: vercel.com/new → Import `Vanaxity/TKS-newsletter` (grant the Vercel GitHub app access to that repo if asked) → Framework "Next.js" → add environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (values from `.env.local`) for Production and Preview → Deploy.

- [ ] **Step 2: Verify the preview**

Open the Vercel preview URL that appears on the setup PR, then `<preview-url>/api/health`.
Expected: the placeholder homepage, and `{"ok":true,"interests":15}`.

- [ ] **Step 3: Protect `main`**

```bash
gh api -X POST repos/Vanaxity/TKS-newsletter/rulesets --input - <<'EOF'
{"name":"protect-main","target":"branch","enforcement":"active",
 "conditions":{"ref_name":{"include":["~DEFAULT_BRANCH"],"exclude":[]}},
 "rules":[{"type":"deletion"},{"type":"non_fast_forward"},
  {"type":"pull_request","parameters":{"required_approving_review_count":0,"dismiss_stale_reviews_on_push":false,
   "require_code_owner_review":false,"require_last_push_approval":false,"required_review_thread_resolution":false}},
  {"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":false,
   "required_status_checks":[{"context":"ci"}]}}]}
EOF
```
Expected: JSON with `"enforcement":"active"`, and `gh api repos/Vanaxity/TKS-newsletter/rulesets --jq '.[].name'` prints `protect-main`.

- [ ] **Step 4: Sam merges the setup PR**

Expected: Vercel deploys production; `<production-url>/api/health` returns `{"ok":true,"interests":15}`.

### Task 4: YouTube link parsing and oEmbed lookup

Start a new branch from updated `main`: `git switch main && git pull && git switch -c feat/summariser`.

**Files:**
- Create: `src/lib/summariser/youtube.ts`, `tests/summariser/youtube.test.ts`

**Interfaces:**
- Produces:
  - `export function parseYouTubeId(input: string): string | null`
  - `export function canonicalUrl(videoId: string): string` → `https://www.youtube.com/watch?v=<id>`
  - `export type OEmbed = { title: string; authorName: string }`
  - `export async function fetchOEmbed(videoId: string, fetchImpl?: typeof fetch): Promise<OEmbed | null>` (null on any non-200)

- [ ] **Step 1: Write the failing tests**

```ts
const ID = 'aircAruvnKk'
test.each([
  `https://www.youtube.com/watch?v=${ID}`,
  `https://youtube.com/watch?v=${ID}&amp;t=30s`,
  `<https://www.youtube.com/watch?v=${ID}&amp;list=PLx|a video>`,
  `https://youtu.be/${ID}?si=abc123`,
  `https://m.youtube.com/watch?feature=share&v=${ID}`,
  `https://www.youtube.com/shorts/${ID}`,
  `https://www.youtube.com/live/${ID}?feature=share`,
  `check this out https://youtu.be/${ID} so cool`,
])('parses %s', s => expect(parseYouTubeId(s)).toBe(ID))

test.each(['https://vimeo.com/123', 'https://www.youtube.com/@3blue1brown', 'no link here', 'https://youtu.be/short'])(
  'returns null for %s', s => expect(parseYouTubeId(s)).toBeNull())

test('fetchOEmbed maps title and author', async () => {
  const fake = vi.fn(async () => new Response(JSON.stringify({ title: 'T', author_name: 'A' }), { status: 200 }))
  expect(await fetchOEmbed(ID, fake)).toEqual({ title: 'T', authorName: 'A' })
  expect(String(fake.mock.calls[0][0])).toContain(encodeURIComponent(canonicalUrl(ID)))
})

test('fetchOEmbed returns null for private or missing videos', async () => {
  for (const status of [401, 403, 404]) {
    expect(await fetchOEmbed(ID, async () => new Response('', { status }))).toBeNull()
  }
})
```

- [ ] **Step 2: Run to see them fail**

Run: `npm test -- tests/summariser/youtube.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `youtube.ts`**

Unescape `&amp;` first, take the first URL found (inside `<...|...>` or bare), and accept hosts `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`. ID must match `/^[A-Za-z0-9_-]{11}$/`. oEmbed URL: `https://www.youtube.com/oembed?format=json&url=` + encoded canonical URL.

- [ ] **Step 4: Run to see them pass**

Run: `npm test -- tests/summariser/youtube.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/summariser/youtube.ts tests/summariser/youtube.test.ts
git commit -m "Add YouTube link parsing and oEmbed lookup"
```

### Task 5: Length, read-time and title-matching rules

**Files:**
- Create: `src/lib/summariser/rules.ts`, `tests/summariser/rules.test.ts`

**Interfaces:**
- Produces:
  - `export const MAX_VIDEO_MINUTES = 120`
  - `export function lengthTarget(videoMinutes: number): { min: number; max: number }`
  - `export function countWords(markdown: string): number` (words in the text, ignoring Markdown symbols like `#`, `*`, `-`)
  - `export function readMinutes(words: number): number` → `Math.max(1, Math.round(words / 220))`
  - `export function titlesMatch(a: string, b: string): boolean`

- [ ] **Step 1: Write the failing tests**

```ts
test('short videos get 100-250 words', () => {
  expect(lengthTarget(1)).toEqual({ min: 100, max: 250 })
  expect(lengthTarget(5)).toEqual({ min: 100, max: 250 })
})
test('longer videos scale at about 30 words a minute, 250 to 1500', () => {
  expect(lengthTarget(6)).toEqual({ min: 250, max: 300 })      // 180 -> floored to 250; max 1.2x of target
  expect(lengthTarget(19)).toEqual({ min: 456, max: 684 })     // target 570
  expect(lengthTarget(90)).toEqual({ min: 1200, max: 1500 })   // target capped at 1500
})
test('read minutes', () => {
  expect(readMinutes(50)).toBe(1); expect(readMinutes(483)).toBe(2); expect(readMinutes(1500)).toBe(7)
})
test('countWords ignores markdown symbols', () => {
  expect(countWords('## Two words\n\n* **bold** item')).toBe(4)
})
test('titles that differ only in punctuation match', () => {
  expect(titlesMatch('But what is a neural network? | Deep learning chapter 1',
                     'But what is a neural network? | Deep learning, chapter 1')).toBe(true)
  expect(titlesMatch('  HELLO   World!! ', 'hello world')).toBe(true)
})
test('different titles do not match', () => {
  expect(titlesMatch('But what is a neural network?', 'How transformers work')).toBe(false)
})
```

- [ ] **Step 2: Run to see them fail**

Run: `npm test -- tests/summariser/rules.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `rules.ts`**

`lengthTarget`: if `videoMinutes <= 5` return `{min:100,max:250}`; else `target = min(1500, max(250, round(30*m)))`, `min = max(250, round(0.8*target))`, `max = min(1500, round(1.2*target))`, except when `target` hit the 1,500 cap use `{min: 1200, max: 1500}` (which the formula already gives). `titlesMatch`: normalise both (NFKD, lowercase, non-alphanumerics → space, collapse spaces, trim); true if equal, else true if the Jaccard similarity of their word sets is at least 0.8.

- [ ] **Step 4: Run to see them pass**

Run: `npm test -- tests/summariser/rules.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/summariser/rules.ts tests/summariser/rules.test.ts
git commit -m "Add article length, read time and title matching rules"
```

### Task 6: Prompt, draft schema and OpenRouter client

**Files:**
- Create: `src/lib/summariser/prompt.ts`, `src/lib/summariser/draft.ts`, `src/lib/summariser/openrouter.ts`, `tests/summariser/draft.test.ts`, `tests/summariser/openrouter.test.ts`
- Modify: `package.json` (add `zod@4`)

**Interfaces:**
- Consumes: `INTEREST_SLUGS` (Task 2).
- Produces:
  - `export const SUMMARISER_PROMPT: string`
  - `export const DraftSchema` (zod) and `export type Draft = { videoTitle: string; channel: string; videoMinutes: number; headline: string; dek: string; tags: string[]; articleMarkdown: string }`
  - `export function parseDraft(raw: string): { ok: true; draft: Draft } | { ok: false; reason: string }`
  - `export type CallResult = { ok: true; content: string; costUsd: number } | { ok: false; status: number; reason: string; costUsd: number }`
  - `export async function callOpenRouter(videoUrl: string, opts: { apiKey: string; model: string; fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void> }): Promise<CallResult>`

- [ ] **Step 1: Write the prompt (exact copy)**

```ts
export const SUMMARISER_PROMPT = `Watch this video and write an article about it for curious teenagers in an innovation program.

Length: if the video is 5 minutes or shorter, write 100-250 words and never pad. If it is longer, write about 30 words per minute of video, at least 250 and at most 1500 words. Use ## subheadings when the article is longer than about 400 words.

Rules:
- Only state things the video actually says or shows. If unsure, leave it out.
- Write in your own words. Do not copy sentences from the narration.
- Plain, vivid, accurate. No filler. Never write "in this video" or "the video discusses".
- Pick 1 to 3 tags, only from this list: ${INTEREST_SLUGS.join(', ')}.

Return ONLY a JSON object with these keys:
"video_title" (the video's exact title), "channel" (the channel name), "video_minutes" (number),
"headline" (your article's headline), "dek" (one-sentence subtitle), "tags" (array), "article_markdown" (the article, Markdown, no headline).`
```

- [ ] **Step 2: Write the failing tests**

```ts
// draft.test.ts
const good = { video_title: 'T', channel: 'C', video_minutes: 18.7, headline: 'H', dek: 'D',
               tags: ['ai', 'math'], article_markdown: 'Body text.' }
test('parses plain JSON and maps to camelCase', () => {
  const r = parseDraft(JSON.stringify(good))
  expect(r).toEqual({ ok: true, draft: { videoTitle: 'T', channel: 'C', videoMinutes: 18.7, headline: 'H',
    dek: 'D', tags: ['ai', 'math'], articleMarkdown: 'Body text.' } })
})
test('accepts JSON wrapped in a code fence or surrounding prose', () => {
  expect(parseDraft('```json\n' + JSON.stringify(good) + '\n```').ok).toBe(true)
  expect(parseDraft('Here you go: ' + JSON.stringify(good) + ' Enjoy!').ok).toBe(true)
})
test.each([
  ['unknown tag', { ...good, tags: ['cooking'] }],
  ['too many tags', { ...good, tags: ['ai', 'math', 'physics', 'space'] }],
  ['no tags', { ...good, tags: [] }],
  ['missing article', { ...good, article_markdown: undefined }],
])('rejects %s', (_, bad) => expect(parseDraft(JSON.stringify(bad)).ok).toBe(false))
test('rejects non-JSON', () => {
  const r = parseDraft('Sorry, I cannot watch that video.')
  expect(r.ok).toBe(false)
})

// openrouter.test.ts
const okBody = { choices: [{ message: { content: '{"a":1}' } }], usage: { cost: 0.0326 } }
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
const noSleep = async () => {}
test('sends only the URL and the prompt, returns content and cost', async () => {
  const fake = vi.fn(async () => reply(200, okBody))
  const r = await callOpenRouter('https://www.youtube.com/watch?v=aircAruvnKk',
    { apiKey: 'k', model: 'google/gemini-3.5-flash-lite', fetchImpl: fake, sleep: noSleep })
  expect(r).toEqual({ ok: true, content: '{"a":1}', costUsd: 0.0326 })
  const body = JSON.parse(fake.mock.calls[0][1]!.body as string)
  expect(body.model).toBe('google/gemini-3.5-flash-lite')
  expect(body.messages[0].content).toEqual([
    { type: 'video_url', video_url: { url: 'https://www.youtube.com/watch?v=aircAruvnKk' } },
    { type: 'text', text: SUMMARISER_PROMPT },
  ])
})
test.each([429, 500, 503])('retries %i then succeeds', async status => {
  const fake = vi.fn().mockResolvedValueOnce(reply(status, {})).mockResolvedValueOnce(reply(200, okBody))
  const r = await callOpenRouter('u', { apiKey: 'k', model: 'm', fetchImpl: fake, sleep: noSleep })
  expect(r.ok).toBe(true); expect(fake).toHaveBeenCalledTimes(2)
})
test('retries a 400 INVALID_ARGUMENT', async () => {
  const fake = vi.fn().mockResolvedValueOnce(reply(400, { error: { message: 'INVALID_ARGUMENT: try again' } }))
                      .mockResolvedValueOnce(reply(200, okBody))
  expect((await callOpenRouter('u', { apiKey: 'k', model: 'm', fetchImpl: fake, sleep: noSleep })).ok).toBe(true)
})
test('gives up after 3 attempts', async () => {
  const fake = vi.fn(async () => reply(503, { error: { message: 'down' } }))
  const r = await callOpenRouter('u', { apiKey: 'k', model: 'm', fetchImpl: fake, sleep: noSleep })
  expect(r).toMatchObject({ ok: false, status: 503 }); expect(fake).toHaveBeenCalledTimes(3)
})
test('does not retry other 4xx (bad key)', async () => {
  const fake = vi.fn(async () => reply(401, { error: { message: 'No auth credentials found' } }))
  const r = await callOpenRouter('u', { apiKey: 'k', model: 'm', fetchImpl: fake, sleep: noSleep })
  expect(r).toMatchObject({ ok: false, status: 401, reason: 'No auth credentials found' })
  expect(fake).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 3: Run to see them fail**

Run: `npm test -- tests/summariser/draft.test.ts tests/summariser/openrouter.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement `draft.ts` and `openrouter.ts`**

`parseDraft`: take the substring from the first `{` to the last `}`; `JSON.parse`; validate with `DraftSchema` (snake_case keys, `tags: z.array(z.enum(INTEREST_SLUGS)).min(1).max(3)`, non-empty strings, positive `video_minutes`); map to camelCase. On failure return a one-line `reason` (`'reply was not JSON'` or the first zod issue's path and message).
`callOpenRouter`: POST `https://openrouter.ai/api/v1/chat/completions`, headers `Authorization: Bearer <key>`, `Content-Type: application/json`, `X-Title: TKS articles`; body `{ model, max_tokens: 6000, response_format: { type: 'json_object' }, usage: { include: true }, messages: [{ role: 'user', content: [video_url item, text item] }] }`. Retry on 429, ≥500, or 400 whose body text contains `INVALID_ARGUMENT`; waits 1000 ms then 3000 ms via `sleep`; 3 attempts total. `costUsd` from `usage.cost` (0 if absent); `reason` from `error.message`, else `HTTP <status>`.

- [ ] **Step 5: Run to see them pass**

Run: `npm test -- tests/summariser/draft.test.ts tests/summariser/openrouter.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add summariser prompt, draft schema and OpenRouter client with retries"
```

### Task 7: summariseVideo, the CLI, and a live run

**Files:**
- Create: `src/lib/summariser/summarise.ts`, `scripts/summarise.ts`, `tests/summariser/summarise.test.ts`
- Modify: `package.json` (script `"summarise": "tsx scripts/summarise.ts"`)

**Interfaces:**
- Consumes: Tasks 4–6.
- Produces:
  ```ts
  export type SummariseResult =
    | { status: 'ok'; videoId: string; draft: Draft; wordCount: number; readMinutes: number; problems: string[]; costUsd: number }
    | { status: 'rejected'; videoId: string | null; reason: string; costUsd: number }
    | { status: 'failed'; videoId: string; reason: string; costUsd: number }
  export async function summariseVideo(input: string, deps: { apiKey: string; model?: string; fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void> }): Promise<SummariseResult>
  ```
  `problems` holds non-blocking notes for the approver, e.g. `"483 words; expected 456-684"`.

- [ ] **Step 1: Write the failing tests**

Build a fake `fetch` that answers the oEmbed URL and the OpenRouter URL separately.

```ts
test('no YouTube link → rejected, no calls', async () => {
  const fake = vi.fn()
  expect(await summariseVideo('hello', { apiKey: 'k', fetchImpl: fake }))
    .toEqual({ status: 'rejected', videoId: null, reason: 'No YouTube link found', costUsd: 0 })
  expect(fake).not.toHaveBeenCalled()
})
test('private or deleted video → rejected before any paid call', async () => {
  const fake = routes({ oembed: new Response('', { status: 401 }) })
  const r = await summariseVideo('https://youtu.be/aircAruvnKk', { apiKey: 'k', fetchImpl: fake })
  expect(r).toMatchObject({ status: 'rejected', reason: 'Video is private, unlisted or deleted' })
  expect(openRouterCalls(fake)).toBe(0)
})
test('happy path → ok with word count, read time and cost', async () => { /* oEmbed title matches; 570-word article; 19 min */
  // expect status 'ok', problems [], wordCount 570, readMinutes 3, costUsd 0.0326, model default 'google/gemini-3.5-flash-lite'
})
test('title mismatch → failed (possible invented content)', async () => {
  // oEmbed title 'But what is a neural network?' vs draft video_title 'How transformers work'
  // expect { status: 'failed', reason: 'Title mismatch: Gemini said "How transformers work", YouTube says "But what is a neural network?"' }
})
test('word count outside the target → ok with a problem note', async () => {
  // 19-min video, 300-word article → problems ['300 words; expected 456-684']
})
test('over 120 minutes → rejected after the call, cost reported', async () => {
  // video_minutes 150 → { status: 'rejected', reason: 'Video is longer than 2 hours', costUsd: 0.0326 }
})
test('unparseable reply → failed with reason and cost', async () => {
  // content 'Sorry, I cannot watch that video.' → { status: 'failed', reason: 'reply was not JSON', costUsd: 0.0326 }
})
test('OpenRouter failure → failed with its reason', async () => {
  // 401 'No auth credentials found' → { status: 'failed', reason: 'OpenRouter: No auth credentials found' }
})
test('SUMMARISER_MODEL overrides the default', async () => { /* deps.model 'google/gemini-3.8-flash' reaches the request body */ })
```
Fill each test body with the stated inputs and the stated `expect`s.

- [ ] **Step 2: Run to see them fail**

Run: `npm test -- tests/summariser/summarise.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `summarise.ts`**

Order: `parseYouTubeId` → `fetchOEmbed` (null → rejected) → `callOpenRouter(canonicalUrl(id))` (not ok → failed `OpenRouter: <reason>`) → `parseDraft` (not ok → failed) → `videoMinutes > MAX_VIDEO_MINUTES` → rejected → `titlesMatch` (false → failed with the exact message format above) → `countWords` vs `lengthTarget` (outside → problem note `"<n> words; expected <min>-<max>"`) → ok. Default model: `deps.model ?? 'google/gemini-3.5-flash-lite'`.

- [ ] **Step 4: Run to see them pass**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: CLI**

`scripts/summarise.ts <youtube-url>`: `process.loadEnvFile('.env.local')`; exit 1 with a clear message if `OPENROUTER_API_KEY` is missing; call `summariseVideo` with `model: process.env.SUMMARISER_MODEL`; print status, problems, cost, then the article as Markdown (`# headline`, `_dek_`, tags · read time · words, then body). Non-ok results print the reason and exit 1.

- [ ] **Step 6: Live run (costs about 3¢)**

Run: `npm run summarise -- "https://www.youtube.com/watch?v=aircAruvnKk"`
Expected: `status: ok`, cost about $0.03, tags including `ai`, an article of roughly 450–700 words, and the title check passing even though YouTube's title has no comma.
Run: `npm run summarise -- "https://www.youtube.com/watch?v=xxxxxxxxxxx"`
Expected: `rejected: Video is private, unlisted or deleted`, cost $0.

- [ ] **Step 7: Commit, push, open PR**

```bash
git add -A
git commit -m "Add summariseVideo orchestration and CLI"
git push -u origin feat/summariser
gh pr create --base main --title "Summariser: YouTube link to checked draft article" --body "Phase 1 tasks 4-7. Live run output in the PR description."
```
Paste the live-run output (status, cost, word count, first paragraph) into the PR description. Expected: `ci` passes; Sam merges.
