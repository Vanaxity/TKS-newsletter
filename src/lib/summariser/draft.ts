import { z } from "zod";
import { INTEREST_SLUGS } from "@/lib/interests";

// The JSON shape Gemini is asked to return (see prompt.ts).
export const DraftSchema = z.object({
  video_title: z.string().min(1),
  channel: z.string().min(1),
  video_minutes: z.number().positive(),
  headline: z.string().min(1),
  dek: z.string().min(1),
  // Lowercase and de-duplicate first, so "AI" for the slug "ai" doesn't throw away a paid draft.
  tags: z.preprocess(
    (v) => (Array.isArray(v) ? [...new Set(v.map((t) => (typeof t === "string" ? t.trim().toLowerCase() : t)))] : v),
    z.array(z.enum(INTEREST_SLUGS)).min(1).max(3),
  ),
  article_markdown: z.string().min(1),
});

export type Draft = {
  videoTitle: string;
  channel: string;
  videoMinutes: number;
  headline: string;
  dek: string;
  tags: string[];
  articleMarkdown: string;
};

export function parseDraft(raw: string): { ok: true; draft: Draft } | { ok: false; reason: string } {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  let json: unknown;
  try {
    if (start === -1 || end < start) throw new Error();
    json = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return { ok: false, reason: "reply was not JSON" };
  }

  const result = DraftSchema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, reason: `${issue.path.join(".") || "reply"}: ${issue.message}` };
  }
  const d = result.data;
  return {
    ok: true,
    draft: {
      videoTitle: d.video_title,
      channel: d.channel,
      videoMinutes: d.video_minutes,
      headline: d.headline,
      dek: d.dek,
      tags: d.tags,
      articleMarkdown: d.article_markdown,
    },
  };
}
