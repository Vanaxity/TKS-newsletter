# TKS video articles site: design

**Status:** draft for Sam's approval · 2026-10-17
**Owner:** Sam (@Vanaxity) · repo `Vanaxity/TKS-newsletter` (public, site only)

Calls marked **(my call)** were made by Claude as sensible defaults; everything else was decided by Sam.

## Intent

TKS students post cool YouTube videos in the Slack channel **#r-thisiscool**. Most people never watch most of them. This site turns each video into a readable article and shows every student only the articles that match their interests, so the good stuff in that channel actually reaches the people who'd care about it.

It is for **TKS students only**. Most of them are minors and most will read on their phones.

## Goals

1. Every YouTube video posted in #r-thisiscool becomes an article automatically, but **nothing goes live until a person approves it** in Slack.
2. A student signs up, picks interests, and gets a feed of **only** articles tagged with those interests.
3. Reading an article is a pleasure: they can **rate it out of 10**, **save it for later**, and **share a link**.
4. The homepage blows people away: TKS colours, React Bits components, a first impression that feels premium.
5. Ben's weekly **TKS Weekly newsletter issues** also live on the site, members only.
6. The project is built cleanly: feature branches, pull requests, no secrets in Git.

## Non-goals (v1)

- Google, Slack or any other single sign-on. Login is email + password.
- A recommendation algorithm beyond interest tags. "Recommended" means "tagged with one of your interests", newest first. (Ratings are stored, so smarter ranking can come later.)
- Comments or discussion threads.
- Building or changing Ben's newsletter pipeline (Apps Script, in `nubidubi09/tks-newsletter`). This site only *receives* his finished issues.
- Videos from anywhere other than YouTube.

## Anti-goals (would be a failure even if it technically works)

- An article that states things the video never said.
- Anything published without a human approving it.
- Student names or Slack messages visible to people outside TKS.
- A homepage so heavy it stutters on a mid-range phone. "Blown away" has to survive a phone on school Wi-Fi. The canvas effects (Dither, ASCII Text) pause when off-screen, drop resolution on phones, and fall back to a still image when the reader has "reduce motion" on. **(my call)**

## How a video becomes an article

1. **Detect.** A Slack app reads #r-thisiscool. When a message contains a YouTube link (`youtube.com/watch`, `youtu.be`, `/shorts/`, `/live/`), the video ID is extracted and a draft job starts. One article per video ID: reposts and Slack retries must not create duplicates.
2. **Submissions.** Anyone can also send a YouTube link to the bot directly (DM) to suggest it. Same pipeline. **(my call: DM, not a slash command)**
3. **Write.** The video URL goes to **Gemini through OpenRouter** (`google/gemini-3.5-flash-lite`, model id in config). Gemini watches the video and returns JSON: video title, channel, video length, headline, one-line subtitle, 1–3 interest tags from the fixed list, read time, and the article in Markdown.
   - **Length scales with the video:** about 150 words per 5 minutes, maximum 1,500. No fixed word count. Videos over 5 minutes get at least 250 words; short videos and Shorts get a short piece (roughly 100–250 words) and are **never padded** to hit a length. **(my call)**
   - **Rules:** only facts the video states; no "in this video"; no copying sentences from the narration; plain, vivid writing for curious teenagers.
   - **Only the URL and the instructions are sent.** Never the Slack message text or anyone's name.
4. **Check.** Before a draft reaches the approver: the title Gemini reports is compared (loosely) with YouTube's own title from oEmbed, to catch the model inventing content about the wrong video. Private, unlisted, live and over-2-hour videos are rejected with a clear message in Slack.
5. **Approve.** The draft is posted privately in Slack to the approver(s) with **Approve**, **Edit** (opens it on the site) and **Reject** buttons. Only people on an approver allowlist can press them. **(my call: approvers are Sam plus anyone he adds)**
6. **Publish.** Approve sets the article to published. It appears on the site immediately; no rebuild needed.
7. **Tell people.** The bot replies in the thread under the original #r-thisiscool post with the article link (Slack is TKS-only, so this is internal). For a DM submission, it DMs the person who sent it. **(my call)**

**Old videos:** no automatic backfill at launch. The pipeline starts from go-live; anyone who wants an older video turned into an article can send its link to the bot. **(my call: avoids flooding the approver with hundreds of drafts on day one)**

**Sam's own articles:** Sam (and other admins) can write an article directly in an admin page on the site and publish it. **(my call: a simple Markdown editor page behind an admin role, instead of going through Slack)**

**Measured in the spike (2026-10-17):** a 19-minute 3Blue1Brown video produced a correct 483-word article tagged ai / computer-science / math in 23 seconds for $0.033. Two fixes came out of it: the prompt must forbid copying narration sentences, and the title check must be fuzzy (one comma broke an exact match).

## The site

**Stack:** Next.js on **Vercel**, **Supabase** for the database and auth (decided by Sam). Tailwind + React Bits components. **(my call: Next.js App Router at the repo root, because React Bits and Kokonut install as React + Tailwind source)**

**Repo:** `Vanaxity/TKS-newsletter`, owned by Sam, who also owns the Vercel and Supabase projects (decided by Sam). It holds only the site. Ben's newsletter pipeline stays in `nubidubi09/tks-newsletter`. The repo is **public**, so it must never contain secrets or real student data; all content lives in Supabase and seed data is made up.

### Pages

| Page | Who sees it | What's on it |
|---|---|---|
| **Homepage** | Everyone | The big first impression in TKS colours, what the site is, Sign up / Log in. Built from Sam's React Bits favourites. |
| **Sign up** | Everyone | Three steps: **account** (email, password, TKS join code) → **profile** (username, photo, name, cohort, city) → **interests**. See below. |
| **Log in** | Everyone | Email + password. |
| **Feed** | Members | Articles tagged with any of the member's interests, newest first. Filter by one interest. |
| **Article** | Members: full. Non-members: first half | Headline, subtitle, tags, read time, embedded YouTube video, the article. Rate /10 (React Bits **Comet Dial**), Save, Share. |
| **Newsletter** | Members only | Ben's TKS Weekly issues, newest first: title, week, TL;DR. Each issue opens as its own page. |
| **Saved** | Members | Articles they saved. |
| **Profile** `/u/<username>` | Members only | **Every student has one** (decided by Sam), shown as a React Bits **Profile Card**: photo, name, @username, cohort, city, interests. Members can view each other's profiles; non-members never can. Your own profile has an Edit button. |
| **Interests** | Members | Change interests any time. |
| **Admin** | Admins | Write/edit articles, see drafts, manage the join code and interest list. |

### Signing up: account, then profile, then interests

1. **Account:** email, password, TKS join code.
2. **Profile** (decided by Sam):
   - **Username:** unique, 3–20 characters, lowercase letters, numbers and underscores. It becomes the profile address `/u/<username>`. **(rules are my call)**
   - **Profile picture:** upload a photo (JPG/PNG/WebP, up to 5 MB). It's cropped to a square and resized to 512×512 before saving, stored in Supabase Storage. Until someone uploads one, they get an avatar with their initials on TKS green. Changeable any time from Edit profile. **(my call)**
   - **Name:** first and last, shown on the profile.
   - **Cohort:** **Global** or **In-person**.
   - **City:** free text, required. **(my call: free text rather than a fixed list)**
3. **Interests:** pick at least one.

The member can't reach the feed until all three steps are done; if they leave halfway, they resume at the step they left.

### Accounts and the TKS check

- **Email + password via Supabase Auth.** No Google sign-in.
- **Join code:** sign-up requires a code that's posted inside TKS Slack. It is checked **on the server**, never in the browser. Admins can change it; changing it doesn't log anyone out. (Sam chose a join code over a director's name.)
- **Email confirmation:** off for v1 **(my call)**. The join code is the gate.
- **Password reset:** uses Supabase's built-in email, which only sends a few emails an hour on the free plan. That's enough for occasional resets at club size. No custom domain in v1 **(my call)**; if one is bought later, switch to a proper sender such as Resend.

### Sharing and the half-article wall

- Every article has a public URL. A non-member who opens it sees the headline, subtitle and **the first half** of the article, then a sign-up prompt.
- **The cut happens on the server.** The second half is never sent to a non-member's browser (otherwise "View source" defeats the wall).
- The public half never shows who shared the video.

### Newsletter issues (Ben's pipeline)

- Ben's pipeline already produces each issue as Markdown with YAML front matter (`title`, `newsletter`, `issue`, `date`, `period`, `tldr`); the format is in `website/README.md` of his repo.
- **How issues arrive (my call):** when Ben's pipeline publishes an issue, it POSTs the Markdown to `/api/issues` on this site with a shared secret. The site validates the front matter and stores it in Supabase. Re-sending the same issue number updates it. This replaces the "commit to `content/issues/`" step in Ben's TASKS.md, so **Ben needs to be told** before he builds that step.
- **Stricter wall than articles:** issues name students, so a non-member who opens an issue link sees only the title and a sign-up prompt. No public first half.
- The body already starts with the title as a `# heading`; the page shows it once.

### Rating, saving, sharing

- **Rate 1–10** with Comet Dial. One rating per member per article; they can change it. Show the average once an article has a few ratings **(my call: 3+)**.
- **Save** toggles the article in their Saved list.
- **Share** copies the link (native share sheet on phones).

### Interests

A fixed list that every article tag must come from, so the filter stays consistent. Starting list **(my call, edit freely)**: math, physics, chemistry, biology, neuroscience, robotics, AI, computer science, space, energy, climate, medicine, engineering, business, design.

### Look and feel

- **TKS colours** (from tks.world's own stylesheet):
  - Green `#51B04C` (hover `#459A40`)
  - Black `#17191A`
  - Off-white `#F2F2F2`, white `#FFFFFF`
  - Grey `#8F9091`, lines `#D3D3D3`
- Green is too light for body text on white (contrast about 2.6:1). Use it for shapes, highlights and buttons with **black text on green**, not green text on white.
- **Font:** tks.world uses PP Neue Montreal, which needs a paid licence for this kind of use. **(my call: a free lookalike such as Inter or Geist unless TKS can share its licence)**
- **Components: Sam's React Bits favourites** (decided by Sam). The integration prompts with full source are in `React components/` in the old `TKS-newsletter` folder on Sam's PC. All are JavaScript + CSS variants, recoloured to TKS colours:

  | Component | Where it goes | Needs |
  |---|---|---|
  | **Dither** | Homepage hero background | Canvas/WebGL, no library |
  | **ASCII Text** | One or two words that need emphasis, such as the hero headline | Canvas/WebGL, no library |
  | **Chroma Grid** | The feed: article cards built on the YouTube thumbnail, grey until hovered | none |
  | **Animated Content** | Sections and cards revealing on scroll | `gsap` |
  | **Comet Dial** | Rating an article 1–10 | `motion` |
  | **Option Wheel** | Choosing which interest to view in the feed; also browsing interests during sign-up **(my guess)** | none |
  | **Profile Card** | The member's Profile page | `@hugeicons/react` |

  On phones, where there's no hover, Chroma Grid cards show in colour. **(my call)** Plain Tailwind covers everything else (forms, buttons, the article body).
- Mobile first. Animations respect "reduce motion".

## Data (Supabase)

Rough shape; the builder may refine it.

- `profiles`: user id, username (unique), first name, last name, avatar path, cohort (global / in_person), city, role (member / admin), onboarding step, created at.
- `interests`: id, slug, label.
- `profile_interests`: user ↔ interest.
- `articles`: id, YouTube video id (unique), source (channel / submission / written), status (draft / published / rejected), headline, subtitle, body Markdown, tags, read minutes, video title, channel, video minutes, shared-by Slack user id (private), created / published at.
- `ratings`: user, article, score 1–10.
- `saves`: user, article.
- `issues`: issue number (unique), title, date, period, TL;DR list, body Markdown, received at.
- `settings`: join code, approver Slack ids, pipeline on/off switch.

- Storage bucket `avatars`: readable by signed-in members only; each member can write only their own file.

Row Level Security on everything. Members read published articles and their own ratings, saves and interests. Only the server (service role) writes drafts and publishes.

## Slack app

- A **separate "TKS Articles" Slack app** **(my call)**, so it doesn't tangle with Ben's newsletter bot. Needs the workspace owner to create it from a manifest, like the newsletter app.
- Bot scopes: `channels:history` and `groups:history` (so it works whether #r-thisiscool is public or private), `chat:write`, `im:history` (for DMs), `users:read`.
- **Events** (`message.channels`, `message.groups`, `message.im`) and **Interactivity** both point at one signed endpoint on the production domain: `/api/slack/events`, using `@vercel/slack-bolt`.
- The endpoint answers Slack within 3 seconds and does the Gemini work afterwards. Vercel's free plan stops a function at 300 seconds; a 19-minute video took 23 seconds, so this fits, with the 2-hour limit as a guard.
- A once-a-day catch-up job re-reads the channel in case Slack dropped an event (Vercel's free plan allows one cron a day).
- The bot must be invited to #r-thisiscool.

## Git and GitHub

- `main` is always deployable. Nobody pushes to it directly.
- One branch per feature: `feat/<thing>`, `fix/<thing>`, `docs/<thing>`. Open a pull request into `main`; Vercel builds a preview for every PR; merge when it works.
- Small, clear commit messages. Squash-merge PRs.
- **No secrets in Git.** Keys live in `.env.local` (ignored) and in Vercel's environment variables.
- The repo is public, so GitHub's free rulesets can **enforce** this: `main` requires a pull request (0 approvals, since Sam is the only developer for now) and blocks force-pushes.

## Phases

**Planning**
1. This design, approved by Sam.
2. A step-by-step implementation plan.

**Executing**, one or more PRs each:
1. **Scaffold:** Next.js app at the repo root, Tailwind, TKS colours and fonts, Supabase project, Vercel project, preview deploys working.
2. **Accounts:** sign up with join code, log in, pick interests.
3. **Articles:** article page with the half-article wall, feed filtered by interests, seed articles (including the spike article).
4. **Reader actions:** rate (Comet Dial), save, share, Saved page.
5. **Homepage:** the jaw-dropper, with Sam's React Bits favourites.
6. **Pipeline:** first the video summariser (YouTube link in, checked draft article out, runnable from the command line and tested), then the Slack app around it: link detection, approval buttons, publish. Built now but **switched off** for real student videos until a director okays using Gemini (decided by Sam).
7. **Newsletter issues:** `/api/issues` endpoint, issue pages, members-only wall. Tell Ben the new hand-off.
8. **Admin:** write your own article, manage drafts, join code and interests.
9. **Launch:** password reset tested, final checks on phones, director sign-off, invite TKS.

## Constraints and risks

- **Google's Gemini terms** say the account holder must be 18+ and bar use in services likely to be used by under-18s. The OpenRouter route still ends at Google. A TKS director should sign off before launch.
- **Vercel free plan:** non-commercial only (fine for a club), one owner (Sam), one cron a day, 300-second functions.
- **Supabase free plan** pauses a project after a week with no activity (e.g. school holidays). Unpausing is one click, but the site is down until then.
- **YouTube input to Gemini is a "preview" feature.** Expect occasional failures; retry, then tell the approver in Slack.
- **OpenRouter key** was pasted into chat on 2026-10-17 and should be rotated.

## Still open (Sam's to answer)

- Site name and domain.

## Left to the builder

Exact table columns and policies, the prompt wording, component composition, animation details, error and empty states, and anything else not decided above.
