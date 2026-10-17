import { parseDraft, type Draft } from "./draft";
import { callOpenRouter } from "./openrouter";
import { countWords, lengthTarget, MAX_VIDEO_MINUTES, readMinutes, titlesMatch } from "./rules";
import { canonicalUrl, fetchOEmbed, parseYouTubeId } from "./youtube";

export const DEFAULT_MODEL = "google/gemini-3.5-flash-lite";

export type SummariseResult =
  | { status: "ok"; videoId: string; draft: Draft; wordCount: number; readMinutes: number; problems: string[]; costUsd: number }
  | { status: "rejected"; videoId: string | null; reason: string; costUsd: number }
  | { status: "failed"; videoId: string; reason: string; costUsd: number };

// Turns a Slack message or URL into a checked draft article. `problems` are notes for the approver;
// anything that suggests the article is about the wrong video fails outright.
export async function summariseVideo(
  input: string,
  deps: { apiKey: string; model?: string; fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void> },
): Promise<SummariseResult> {
  const videoId = parseYouTubeId(input);
  if (!videoId) return { status: "rejected", videoId: null, reason: "No YouTube link found", costUsd: 0 };

  const oembed = await fetchOEmbed(videoId, deps.fetchImpl);
  if (!oembed) return { status: "rejected", videoId, reason: "Video is private, unlisted or deleted", costUsd: 0 };

  const call = await callOpenRouter(canonicalUrl(videoId), {
    apiKey: deps.apiKey,
    model: deps.model ?? DEFAULT_MODEL,
    fetchImpl: deps.fetchImpl,
    sleep: deps.sleep,
  });
  if (!call.ok) return { status: "failed", videoId, reason: `OpenRouter: ${call.reason}`, costUsd: call.costUsd };
  const { costUsd } = call;

  const parsed = parseDraft(call.content);
  if (!parsed.ok) return { status: "failed", videoId, reason: parsed.reason, costUsd };
  const { draft } = parsed;

  if (draft.videoMinutes > MAX_VIDEO_MINUTES) {
    return { status: "rejected", videoId, reason: "Video is longer than 2 hours", costUsd };
  }
  if (!titlesMatch(draft.videoTitle, oembed.title)) {
    return {
      status: "failed",
      videoId,
      reason: `Title mismatch: Gemini said "${draft.videoTitle}", YouTube says "${oembed.title}"`,
      costUsd,
    };
  }

  const wordCount = countWords(draft.articleMarkdown);
  const { min, max } = lengthTarget(draft.videoMinutes);
  const problems = wordCount < min || wordCount > max ? [`${wordCount} words; expected ${min}-${max}`] : [];

  return { status: "ok", videoId, draft, wordCount, readMinutes: readMinutes(wordCount), problems, costUsd };
}
