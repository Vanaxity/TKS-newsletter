# Phase 4: Reader Actions and Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Members can rate (Comet Dial, 1–10), save, repost (Pulse Heart) and share articles; reposts lift articles in feeds and widely reposted ones reach people outside their interests; members have a Saved page and a profile page (Profile Card) with their reposts; the whole site has a dark mode switch.

**Architecture:** Three tables (`ratings`, `saves`, `reposts`) with RLS so members only write their own rows. Counters on `articles` (`repost_count`, `rating_sum`, `rating_count`) are kept by `SECURITY DEFINER` triggers, so feeds can rank without reading other members' rows. Ranking is a pure function in TypeScript. Reader actions are Server Actions that re-read the session. Dark mode uses semantic colour tokens switched by `data-theme` on `<html>`, set before first paint by an inline script (Next's "preventing flash" guide), remembered in `localStorage`.

**Tech Stack:** Next.js 16.4, Supabase, React Bits Comet Dial (`motion`), Pulse Heart and Profile Card (`@hugeicons/react`, `@hugeicons/core-free-icons`), Tailwind 4 custom variant, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-17-tks-video-articles-design.md` ("The feed", "Rating, saving, reposting, sharing", "Pages: Saved, Profile").

## Global Constraints

- One rating (1–10), one save and one repost per member per article; each can be changed or undone.
- The average rating shows only once an article has 3 or more ratings.
- Repost: shows on the reposter's profile under "Reposts"; lifts the article in everyone's feed. Your own reposts don't lift articles in your own feed.
- Feed rank (own interests): newest first, where each repost counts as 12 hours newer and an article you've rated counts as 48 hours older. Explore picks: articles outside your interests with 5+ reposts first (most reposted), then newest.
- Share: the phone share sheet when available, otherwise copy the link and say "Link copied".
- Saved list is private to the member.
- Dark mode: Light, Dark or System (default System); no flash of the wrong theme; green elements keep black text in both themes.
- React Bits components are copied unchanged (JS + CSS) into `src/components/react-bits/`, recoloured through props.

## Review Focus

1. **A member rating, saving or reposting someone else's behalf through the API** (another `user_id`) is refused by the database. Tested in Task 1.
2. **Double-clicking Repost or Save** never creates two rows or a negative counter. Tested in Task 1 (primary keys; counter never below 0).
3. **Undoing a repost or deleting a rating** brings the counters back exactly. Tested in Task 1.
4. **A member who reposted their own-interest article** doesn't see it boosted in their own feed. Tested in Task 2.
5. **Switching to dark mode** keeps every page readable: no black-on-black text, green buttons keep black text. Verified in the Task 6 browser run on feed, article, saved, profile and sign-up pages.

---

### Task 1: Ratings, saves, reposts and counters

**Files:** Create `supabase/migrations/0007_reader_actions.sql`, `tests/integration/reader-actions.int.test.ts`.

**Interfaces:**
- `ratings(user_id uuid → auth.users on delete cascade, article_id bigint → articles on delete cascade, score int check 1..10, updated_at timestamptz default now(), pk(user_id, article_id))`; `saves(user_id, article_id, created_at, pk)`; `reposts(user_id, article_id, created_at, pk)`; `user_id` defaults to `auth.uid()`.
- RLS: ratings and saves — select/insert/update/delete own rows only; reposts — select for `authenticated`, insert/delete own.
- `articles` gains `repost_count int not null default 0 check (>= 0)`, `rating_sum int not null default 0`, `rating_count int not null default 0`; triggers on the three tables keep them exact (insert, update of score, delete).

- [ ] **Step 1: Failing integration tests:** member A rates 7 then 9 → `rating_count` 1, `rating_sum` 9; deletes → 0/0. A reposts → `repost_count` 1; repost again → error (duplicate), count stays 1; un-repost → 0. A saves → own select sees it; B's select of saves → `[]`. A inserting a repost with B's `user_id` → error. Members can't update `repost_count` directly.
- [ ] **Step 2: Run** → FAIL. **Step 3: Apply** migration (fixture article created/removed with MCP SQL). **Step 4: Run** → PASS; `get_advisors`; clean up.
- [ ] **Step 5: Commit** — `git commit -m "Add ratings, saves, reposts and article counters"`

### Task 2: Feed ranking

**Files:** Create `src/lib/articles/rank.ts`, `tests/articles/rank.test.ts`; modify `src/lib/articles/feed.ts` (`ArticleCard` gains `repostCount: number`), `src/lib/articles/queries.ts`.

**Interfaces:**
- `rankMine(cards: ArticleCard[], opts: { ratedSlugs: Set<string>; ownRepostSlugs: Set<string> }): ArticleCard[]` — score = `publishedAt + 12h × (repostCount − (own repost ? 1 : 0)) − (rated ? 48h : 0)`, sort desc, stable.
- `rankOutside(cards: ArticleCard[]): ArticleCard[]` — `repostCount >= 5` first (by repostCount desc, then newest), then the rest newest first.
- `getFeed` fetches 60 newest own-interest and 30 newest outside articles plus up to 10 outside with `repost_count >= 5`, the viewer's rated and reposted slugs, then `composeFeed(rankMine(...), rankOutside(...))`.

- [ ] **Step 1: Failing tests:** two own articles one day apart, the older with 3 reposts (36h) → older first; same but the reposts include the viewer's (24h) → newer first; a rated newer article drops below an unrated older one within 48h; outside: a 6-repost old article beats a newer 0-repost one; a 4-repost one does not.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement + wire.** **Step 4: Run** → PASS. **Step 5: Commit** — `git commit -m "Rank feeds by freshness, reposts and what you've rated"`

### Task 3: Rate, save, repost and share on the article page

**Files:** Create `src/app/a/[slug]/actions.ts`, `src/app/a/[slug]/article-actions.tsx`, `src/components/react-bits/CometDial.jsx|.css`, `PulseHeart.jsx|.css`; modify `src/app/a/[slug]/page.tsx`, `src/lib/articles/queries.ts` (`FullArticle` gains `id`, `repostCount`, `ratingAvg: number | null`, and `mine: { score: number | null; saved: boolean; reposted: boolean }`).

**Interfaces:**
- `rateArticle(articleId: number, score: number): Promise<{ ok: boolean }>` (score 1–10 integer, else refused); `clearRating(articleId)`; `toggleSave(articleId): Promise<{ saved: boolean }>`; `toggleRepost(articleId): Promise<{ reposted: boolean; count: number }>`. Each calls `getViewer()`; no viewer → `{ ok: false }`.
- `ArticleActions` (client): Comet Dial `min 1 max 10 step 1 unit ""`, label "Your rating", accent TKS green, saves 600 ms after the last change; Pulse Heart with a repost icon, `likedColor` TKS green, count = repost count; Save toggle; Share button (Web Share API → clipboard fallback → "Link copied" for 2 s). Shows "Average 8.2 from 5 ratings" when `ratingAvg` is set.

- [ ] **Step 1:** Implement. **Step 2:** `npm run lint && npm run typecheck && npm test`. **Step 3: Commit** — `git commit -m "Add rating, save, repost and share to articles"`

### Task 4: Saved page, profile page, site header

**Files:** Create `src/app/saved/page.tsx`, `src/app/u/[username]/page.tsx`, `src/components/site-header.tsx`, `src/components/react-bits/ProfileCard.jsx|.css`; modify `src/app/feed/page.tsx` (use `SiteHeader`), `src/app/a/[slug]/page.tsx` (header for members).

**Interfaces:**
- `SiteHeader` — "TKS articles" (→ `/feed`), Feed, Saved, Profile (→ `/u/<username>`), theme toggle, Log out.
- `/saved` — `requireStep('done')`; the member's saved articles, newest saved first, as `FeedGrid`; empty state "Nothing saved yet. Tap Save on any article."
- `/u/[username]` — `requireStep('done')`; profile by username (only finished profiles); Profile Card: avatar (signed URL or initials image), name, title = "<cohort> · <city>", handle, status = interests, `showUserInfo` true with contact hidden; below it "Reposts" as `FeedGrid`; unknown username → not found.

- [ ] **Step 1:** Implement. **Step 2:** checks pass. **Step 3: Commit** — `git commit -m "Add Saved page, profile pages and the site header"`

### Task 5: Dark mode

**Files:** Modify `src/app/globals.css`, `src/app/layout.tsx`, every component using `tks-offwhite`/`tks-white`/`tks-black`/`tks-grey`/`tks-line` for surfaces or text; create `src/components/theme-toggle.tsx`, `src/lib/theme.ts`, `tests/theme.test.ts`.

**Interfaces:**
- Tokens: `--color-page`, `--color-card`, `--color-ink`, `--color-muted`, `--color-line`, `--color-on-green` (always `#17191A`). Light: page `#F2F2F2`, card `#FFFFFF`, ink `#17191A`, muted `#8F9091`, line `#D3D3D3`. Dark: page `#101213`, card `#1B1D1F`, ink `#F2F2F2`, muted `#A3A5A7`, line `#2E3133`.
- `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`
- `export type ThemeChoice = 'light' | 'dark' | 'system'`; `resolveTheme(choice: ThemeChoice, prefersDark: boolean): 'light' | 'dark'`; `THEME_SCRIPT: string` (reads `localStorage.theme`, resolves with `matchMedia`, sets `data-theme` on `<html>`; `try/catch`).
- `ThemeToggle` — cycles Light → Dark → System, shows the current choice, writes `localStorage.theme`, updates `data-theme`, follows system changes while on System.

- [ ] **Step 1: Failing test** for `resolveTheme` (4 cases) and that `THEME_SCRIPT` contains `localStorage` and `data-theme`. **Step 2: Run** → FAIL. **Step 3: Implement**; replace classes (`bg-tks-offwhite`→`bg-page`, `bg-tks-white`→`bg-card`, `text-tks-black`→`text-ink` except on green elements → `text-on-green`, `text-tks-grey`→`text-muted`, `border/ring-tks-line`→`border/ring-line`, `border-tks-black`→`border-ink`). **Step 4: Run** → PASS + checks. **Step 5: Commit** — `git commit -m "Add dark mode with a no-flash theme switch"`

### Task 6: Walkthrough and PR

- [ ] Test member (mailinator) with interests; rate an article (dial), save, repost, share (copy); counts update; Saved page lists it; profile shows Profile Card and the repost; feed order reflects reposts; dark mode on every page listed in Review Focus 5, and reload keeps the theme without a flash. Clean up the test member. Push, PR, checks pass.
