const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

// Finds the first YouTube video in a Slack message or a plain URL and returns its 11-character ID.
// Handles Slack's <url|label> wrapping and &amp; escaping.
export function parseYouTubeId(input: string): string | null {
  const text = input.replace(/&amp;/g, "&");
  for (const match of text.matchAll(/https?:\/\/[^\s<>|]+/g)) {
    let url: URL;
    try {
      url = new URL(match[0]);
    } catch {
      continue;
    }
    if (!YOUTUBE_HOSTS.has(url.hostname)) continue;

    let id: string | null = null;
    if (url.hostname === "youtu.be") {
      id = url.pathname.split("/")[1] ?? null;
    } else if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const [, kind, rest] = url.pathname.split("/");
      if (kind === "shorts" || kind === "live") id = rest ?? null;
    }
    if (id && VIDEO_ID.test(id)) return id;
  }
  return null;
}

export function canonicalUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export type OEmbed = { title: string; authorName: string };

// YouTube's oEmbed doesn't answer for private or deleted videos, so null means we can't use it.
export async function fetchOEmbed(videoId: string, fetchImpl: typeof fetch = fetch): Promise<OEmbed | null> {
  const res = await fetchImpl(
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(canonicalUrl(videoId))}`,
  );
  if (res.status !== 200) return null;
  const body = (await res.json()) as { title: string; author_name: string };
  return { title: body.title, authorName: body.author_name };
}
