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

export type OEmbedResult =
  | { ok: true; title: string; authorName: string }
  // unavailable: YouTube says the video can't be shown (private or deleted). Otherwise the lookup itself failed.
  | { ok: false; unavailable: boolean; reason: string };

const UNAVAILABLE_STATUSES = new Set([400, 401, 403, 404]);

export async function fetchOEmbed(videoId: string, fetchImpl: typeof fetch = fetch): Promise<OEmbedResult> {
  let res: Response;
  try {
    res = await fetchImpl(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(canonicalUrl(videoId))}`);
  } catch (err) {
    return { ok: false, unavailable: false, reason: err instanceof Error ? err.message : String(err) };
  }
  if (res.status !== 200) {
    return { ok: false, unavailable: UNAVAILABLE_STATUSES.has(res.status), reason: `HTTP ${res.status}` };
  }
  try {
    const body = (await res.json()) as { title?: unknown; author_name?: unknown };
    if (typeof body?.title !== "string" || !body.title) throw new Error();
    return { ok: true, title: body.title, authorName: typeof body.author_name === "string" ? body.author_name : "" };
  } catch {
    return { ok: false, unavailable: false, reason: "unexpected reply" };
  }
}
