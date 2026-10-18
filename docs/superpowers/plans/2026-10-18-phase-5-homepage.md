# Phase 5: Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A homepage that makes a first-time TKS student say "whoa": a full-screen dark hero with React Bits Dither and Laser Flow, "this is cool" in ASCII Text, a Specular Button call to action, then how it works, the newest articles and the interests, fast on phones.

**Architecture:** `src/app/page.tsx` stays a server page with a static shell. The hero's WebGL effects live in one client component loaded with `next/dynamic` (`ssr: false`) behind a static gradient fallback, so the HTML and the headline arrive instantly. Effects scale down on small screens and stop when "reduce motion" is on or the hero is scrolled away. The newest articles come from a new public function `latest_articles(p_limit)` that returns only what a shared link already shows.

**Tech Stack:** Next.js 16.4, React Bits Dither, Laser Flow, ASCII Text, Specular Button, Animated Content (`gsap`), Supabase.

**Spec:** `docs/superpowers/specs/2026-10-17-tks-video-articles-design.md` ("Homepage", "Look and feel", anti-goal on heavy pages).

## Global Constraints

- Hero is always dark (TKS black `#0B0C0D` background) in both themes; sections below follow the theme.
- Colours: TKS green `#51B04C` for the laser and highlights; black text on green.
- Copy: headline "The coolest videos in TKS, turned into reads made for you." Emphasis in ASCII Text: "this is cool". CTA "Join with your TKS code" (→ `/signup`), secondary "Log in". Signed-in visitors see "Go to your feed" / "Finish setting up".
- Phones (`max-width: 768px`): no Laser Flow, ASCII Text replaced by the same words in bold type, Dither at `dpr` 1. `prefers-reduced-motion`: no Laser Flow, static ASCII, Dither frozen. Effects pause when the hero is off screen.
- The headline and buttons are server HTML (readable before any JavaScript).
- `latest_articles` returns only slug, headline, dek, tags, read_minutes, youtube_video_id, published_at for published articles (the same fields `public_article` already exposes).

## Review Focus

1. **A phone on a slow connection** sees the headline and buttons immediately, with no 3D effect running (Laser Flow and ASCII Text absent). Verified at 375px in the browser.
2. **"Reduce motion" turned on** gets a still page. Verified by forcing the media query.
3. **Scrolling past the hero** stops the WebGL animation (no wasted battery). Verified by checking the `paused`/`disableAnimation` props flip.
4. **No published articles** hides the "Fresh from #r-thisiscool" section rather than showing Chroma Grid's sample photos. Tested by `getLatest` returning `[]`.
5. **Signed-in visitors** still get "Go to your feed". Verified in the browser.

---

### Task 1: Public latest-articles function
**Files:** `supabase/migrations/0008_latest_articles.sql`, `tests/integration/articles.int.test.ts` (one test), `src/lib/articles/queries.ts` (`getLatest(limit = 6): Promise<FeedItem[]>` via the public client).
- [ ] Failing integration test: anon `rpc('latest_articles', { p_limit: 3 })` returns at most 3 published rows, newest first, with no `body_md`; drafts never appear. Apply, pass, commit.

### Task 2: Vendored components and typed handles
**Files:** `src/components/react-bits/{Dither,LaserFlow,ASCIIText,SpecularButton,AnimatedContent}.*` (unchanged copies), `src/components/react-bits/typed.ts` (props from each documented table); add `gsap`.
- [ ] Copy, add types, lint/typecheck. Commit.

### Task 3: Hero
**Files:** `src/app/home/hero.tsx` (server: headline, buttons, fallback), `src/app/home/hero-effects.tsx` (client, dynamic import), `src/app/home/use-motion.ts` (`useMotionPrefs(): { small: boolean; reduced: boolean }` and `useInView(ref)`).
- [ ] Implement; browser check at desktop, 375px and with reduced motion. Commit.

### Task 4: Below the hero
**Files:** `src/app/page.tsx`, `src/app/home/how-it-works.tsx` (three Animated Content cards), `src/app/home/fresh.tsx` (server, `getLatest`, `FeedGrid`, hidden when empty), `src/app/home/interests-strip.tsx`, footer.
- [ ] Implement; checks pass; browser check light + dark. Commit.

### Task 5: PR
- [ ] Lint, typecheck, tests, push, PR, checks green, review, merge.
