# TKS articles

The website for TKS students: cool YouTube videos from Slack's #r-thisiscool, turned into short articles and filtered to each reader's interests. Ben's TKS Weekly newsletter issues live here too.

The design is in [docs/superpowers/specs/2026-10-17-tks-video-articles-design.md](docs/superpowers/specs/2026-10-17-tks-video-articles-design.md).

## How we work

- `main` is always deployable. Nobody pushes to it directly.
- One branch per change (`feat/…`, `fix/…`, `docs/…`), then a pull request into `main`.
- Keys go in `.env.local` and in Vercel's environment variables. Never in Git: this repo is public.
