# Phase 3: Articles and the Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real article pages (full for members, first half + sign-up wall for everyone else) and a members' feed of articles in their interests with some picks from outside them, shown as React Bits Chroma Grid cards, seeded with the first summariser-written articles.

**Architecture:** An `articles` table in Supabase. Members read published articles through RLS. Non-members never touch the table: a `SECURITY DEFINER` function `public_article(slug)` returns only the headline, subtitle, tags and a precomputed `preview_md` (the first half), so the second half never reaches their browser. The feed is assembled on the server: newest articles matching the member's interests, with every fifth slot an "Outside your interests" pick. Reposts and trending come in Phase 4.

**Tech Stack:** Next.js 16.4 (Cache Components, Suspense), Supabase, `react-markdown` 10 + `remark-gfm` 4, React Bits Chroma Grid (JS + CSS, from `C:\Coding\TKS-newsletter\React components\Chroma Grid..txt`), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-17-tks-video-articles-design.md` ("Pages", "Sharing and the half-article wall", "The feed", "Data").

## Global Constraints

- The wall is server-side: a non-member's response must not contain the second half of the article.
- The public half never shows who shared the video (no Slack ids or names in `public_article`).
- Feed: published articles tagged with any of the member's interests, newest first; about 1 in 5 items is an "Outside your interests" pick (newest articles that match none of their interests). Filter by one interest.
- Article URL: `/a/<slug>`, slug = lowercase headline words joined by `-` (max 60 chars) + `-` + 6-char random suffix; unique.
- Article page shows: headline, subtitle, tags, read time, the YouTube video (privacy-enhanced embed `youtube-nocookie.com`), the article. Rating, save, repost and share are Phase 4.
- Chroma Grid cards use the YouTube thumbnail (`https://i.ytimg.com/vi/<id>/hqdefault.jpg`), light theme, TKS green accents; on touch screens (`(hover: none)`) cards show in colour (`grayscale` 0, `dim` 0).
- Markdown is rendered without raw HTML.
- Only admins (`profiles.role = 'admin'`) can write articles; no browser path writes them in this phase. Seeding uses the summariser CLI plus SQL through the Supabase MCP.

## Review Focus

1. **A non-member opening `/a/<slug>`** gets the headline, subtitle and first half only; the page's HTML contains no sentence from the second half. Tested in Task 1 (RPC) and Task 5 (page HTML via curl).
2. **A draft or rejected article's slug** returns 404 for members and non-members alike. Tested in Task 1.
3. **A member with interests no article has yet** sees Outside-your-interests picks or a friendly empty state, never a blank page or an error. Tested in Task 2 (`composeFeed`) and Task 6.
4. **An article with one paragraph, or a very short one,** still gets a sensible preview (at least one paragraph, never the whole thing when there are two or more). Tested in Task 2.
5. **A headline with emoji, accents or punctuation only** still gets a valid, unique slug. Tested in Task 2.

---

### Task 1: Articles schema and the public preview function

**Files:** Create `supabase/migrations/0005_articles.sql`, `tests/integration/articles.int.test.ts`.

**Interfaces:**
- Table `articles(id bigint identity pk, slug text unique not null, youtube_video_id text unique not null check (~ '^[A-Za-z0-9_-]{11}$'), source text not null check in ('channel','submission','written'), status text not null default 'draft' check in ('draft','published','rejected'), headline text not null, dek text not null, body_md text not null, preview_md text not null, tags text[] not null check (cardinality between 1 and 3), read_minutes int not null check (> 0), video_title text, channel_name text, video_minutes numeric, shared_by_slack_id text, created_at timestamptz default now(), published_at timestamptz)`; indexes: GIN on `tags`, btree on `(status, published_at desc)`.
- Tags must be interest slugs: trigger `check_article_tags` (before insert/update) raises if any tag isn't in `interests`.
- RLS: `authenticated` select where `status = 'published'`; admins (exists profile with role 'admin' for `auth.uid()`) select/insert/update all. No anon policy.
- `public.public_article(p_slug text) returns table(slug text, headline text, dek text, tags text[], read_minutes int, youtube_video_id text, preview_md text, published_at timestamptz)` — security definer, `search_path = ''`, only `status = 'published'`, executable by `anon, authenticated`.
- Helper `public.is_admin()` returns boolean (security definer, stable).

- [ ] **Step 1: Failing integration test** (reuses the member helper pattern from `accounts.int.test.ts`; a draft and a published row are inserted with MCP `execute_sql` before the run and removed after):
  - anon `from('articles').select()` → `[]`
  - anon `rpc('public_article', { p_slug: <published> })` → one row with `preview_md`, and the row has no `body_md` key
  - anon/member `rpc('public_article', { p_slug: <draft> })` → `[]`
  - member `from('articles').select('body_md').eq('slug', <published>)` → the full body; `.eq('slug', <draft>)` → `[]`
  - member `insert` → error
- [ ] **Step 2: Run** `TEST_JOIN_CODE=… npm run test:int -- tests/integration/articles.int.test.ts` → FAIL.
- [ ] **Step 3: Write and apply** the migration (MCP `apply_migration`), insert the two fixture rows, run `get_advisors`.
- [ ] **Step 4: Run** → PASS. Remove fixtures and test users.
- [ ] **Step 5: Commit** — `git commit -m "Add articles table, member read rules and the public preview function"`

### Task 2: Article helpers

**Files:** Create `src/lib/articles/slug.ts`, `src/lib/articles/preview.ts`, `src/lib/articles/feed.ts`, `tests/articles/*.test.ts`.

**Interfaces:**
- `slugify(headline: string, suffix: string): string` — NFKD, strip accents, lowercase, non-alphanumerics → `-`, trim dashes, max 60 chars (cut on a dash), fallback `article` when empty, then `-<suffix>`.
- `randomSuffix(): string` — 6 chars `[a-z0-9]`.
- `splitPreview(markdown: string): string` — split into blocks on blank lines; take blocks until the taken words reach half the total; always at least one block; never all blocks when there are two or more.
- `type FeedItem = { article: ArticleCard; outside: boolean }`, `type ArticleCard = { slug: string; headline: string; dek: string; tags: string[]; readMinutes: number; youtubeVideoId: string; publishedAt: string }`
- `composeFeed(mine: ArticleCard[], outside: ArticleCard[], every = 5): FeedItem[]` — keeps `mine` in order; slot 5, 10, 15… takes the next `outside` article (skipping any already in `mine`); when `mine` runs out, remaining `outside` articles follow; no duplicates.
- `thumbnailUrl(videoId: string): string` → `https://i.ytimg.com/vi/<id>/hqdefault.jpg`

- [ ] **Step 1: Failing tests**

```ts
test('slug from a normal headline', () => expect(slugify('Cracking the Code of Neural Networks', 'ab12cd')).toBe('cracking-the-code-of-neural-networks-ab12cd'))
test('accents, emoji and punctuation', () => expect(slugify('Pokémon 🚀 — évolution!?', 'x1y2z3')).toBe('pokemon-evolution-x1y2z3'))
test('punctuation only falls back', () => expect(slugify('?!… 🚀', 'q9w8e7')).toBe('article-q9w8e7'))
test('long headlines cut on a word', () => { const s = slugify('word '.repeat(40), 'abc123'); expect(s.length).toBeLessThanOrEqual(67); expect(s).not.toMatch(/--|-abc123$.*-$/) })
test('preview takes about the first half', () => {
  const md = ['one two three four', 'five six seven eight', 'nine ten eleven twelve', 'thirteen fourteen fifteen sixteen'].join('\n\n')
  expect(splitPreview(md)).toBe('one two three four\n\nfive six seven eight')
})
test('one paragraph previews that paragraph', () => expect(splitPreview('only one here')).toBe('only one here'))
test('two paragraphs never preview both', () => expect(splitPreview('a b c d e f g h i j\n\nk')).toBe('a b c d e f g h i j'))
test('every fifth item is from outside', () => {
  const mine = cards('m', 8), out = cards('o', 3)
  expect(composeFeed(mine, out).map(i => i.article.slug)).toEqual(['m1','m2','m3','m4','o1','m5','m6','m7','m8','o2','o3'])
  expect(composeFeed(mine, out).filter(i => i.outside).map(i => i.article.slug)).toEqual(['o1','o2','o3'])
})
test('no matching articles → only outside picks', () => expect(composeFeed([], cards('o', 2)).map(i => i.outside)).toEqual([true, true]))
test('nothing at all → empty', () => expect(composeFeed([], [])).toEqual([]))
test('an article in both lists appears once', () => { /* mine m1..m4 + outside [m2, o1] → o1 at slot 5, m2 once */ })
```
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "Add slug, preview and feed composition helpers"`

### Task 3: Article data access

**Files:** Create `src/lib/articles/queries.ts` (server-only).

**Interfaces:**
- `getFeed(viewer: Viewer, opts: { topic?: string }): Promise<FeedItem[]>` — member's interest slugs from `profile_interests`; `topic` (must be an interest slug, else ignored) narrows `mine` to that tag and turns off outside picks; `mine` = 30 newest published with `tags && interests`; `outside` = 10 newest published with no overlap; `composeFeed`.
- `getArticle(slug: string): Promise<{ kind: 'full'; article: FullArticle } | { kind: 'preview'; article: PreviewArticle } | null>` — signed-in member → select from `articles` (RLS); anyone else → `rpc('public_article')`. `FullArticle = ArticleCard & { bodyMd: string; videoTitle: string | null; channelName: string | null }`; `PreviewArticle = ArticleCard & { previewMd: string }`.

- [ ] **Step 1:** Implement (verified through Tasks 5–6 and the integration rules from Task 1). **Step 2:** `npm run typecheck`. **Step 3: Commit** — `git commit -m "Add feed and article queries"`

### Task 4: Chroma Grid component

**Files:** Create `src/components/react-bits/ChromaGrid.jsx`, `src/components/react-bits/ChromaGrid.css` (copied from the React Bits file, unchanged except the CSS import path), `src/components/feed-grid.tsx` (client wrapper).

**Interfaces:**
- `FeedGrid({ items }: { items: FeedItem[] })` — maps to Chroma Grid items `{ image: thumbnailUrl, title: headline, subtitle: '<n> min read · <tags>' (+ ' · Outside your interests' when outside), accent: '#51B04C', url: '/a/<slug>' }`; props `theme="light"`, `columns={3}`, `minCardWidth={240}`, `aspectRatio="16 / 9"`; on `(hover: none)` passes `grayscale={0}` and `dim={0}`.

- [ ] **Step 1:** Copy the component and CSS; add the wrapper. **Step 2:** `npm run lint && npm run typecheck` (add an ESLint ignore for `src/components/react-bits/**` only if the vendored file trips rules). **Step 3: Commit** — `git commit -m "Add React Bits Chroma Grid and the feed grid wrapper"`

### Task 5: Article page with the half-article wall

**Files:** Create `src/app/a/[slug]/page.tsx`, `src/components/markdown.tsx`, `src/components/youtube-embed.tsx`; add `react-markdown`, `remark-gfm`.

**Interfaces:**
- Page: static frame + `<Suspense>` around `ArticleBody`, which calls `getArticle(slug)`; null → `notFound()`. Full: headline, dek, tag chips, "<n> min read", `YouTubeEmbed`, `Markdown`. Preview: same top, `Markdown` of `previewMd` fading out, then a card "Read the rest on TKS articles — for TKS students only" with Sign up and Log in buttons.
- `generateMetadata`: title = headline, description = dek (both from `public_article`, so it works for anyone).
- `Markdown({ children }: { children: string })` — `react-markdown` + `remark-gfm`, no raw HTML, Tailwind typography by hand (h2, p, ul, strong, code).
- `YouTubeEmbed({ videoId, title })` — `https://www.youtube-nocookie.com/embed/<id>` iframe, 16:9, lazy.

- [ ] **Step 1:** Implement. **Step 2: Verify the wall** — with a seeded article: `curl -s localhost:3000/a/<slug>` (no cookies) contains the first preview sentence and **does not** contain the article's last sentence; a signed-in browser shows the whole article. `curl -s -o /dev/null -w '%{http_code}' localhost:3000/a/does-not-exist-000000` → `404`.
- [ ] **Step 3: Commit** — `git commit -m "Add article page with the half-article wall"`

### Task 6: The feed

**Files:** Modify `src/app/feed/page.tsx`; create `src/app/feed/topic-filter.tsx`.

**Interfaces:**
- `/feed?topic=<slug>`: header (avatar, "Hi <first name>", Log out, Edit links) + topic chips ("All" + the member's interests; active chip green) + `FeedGrid` of `getFeed(viewer, { topic })`; empty → "No articles yet. New ones appear here as soon as they're approved." The page reads `searchParams`, inside Suspense.

- [ ] **Step 1:** Implement. **Step 2:** `npm run lint && npm run typecheck && npm test` pass. **Step 3: Commit** — `git commit -m "Show articles in the feed with Chroma Grid and topic filter"`

### Task 7: Seed articles, walkthrough, PR

**Files:** Create `scripts/draft-article.ts` (prints a summarised draft as JSON: slug, headline, dek, body_md, preview_md, tags, read_minutes, video ids/titles).

- [ ] **Step 1:** `npm run draft-article -- "<url>"` for the 3Blue1Brown video and each link Sam provides; insert each as `status = 'published', source = 'channel', published_at = now()` with MCP `execute_sql`.
- [ ] **Step 2: Browser run** (signed-in test account with interests overlapping some seeds): feed shows Chroma Grid cards; an outside pick is labelled; topic chip filters; card opens the article with video and full text; logged out, the same URL shows the first half and the sign-up card.
- [ ] **Step 3:** Clean up the test account. Push, open the PR; `ci` and Vercel pass; check the wall on the preview URL with curl.
