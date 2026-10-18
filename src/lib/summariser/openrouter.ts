import { SUMMARISER_PROMPT } from "./prompt";

export type CallResult =
  | { ok: true; content: string; costUsd: number }
  | { ok: false; status: number; reason: string; costUsd: number };

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const BACKOFF_MS = [1000, 3000];

function isRetryable(status: number, bodyText: string): boolean {
  return status === 429 || status >= 500 || (status === 400 && bodyText.includes("INVALID_ARGUMENT"));
}

// Sends the video URL and the fixed prompt to Gemini through OpenRouter. Nothing else goes out.
export async function callOpenRouter(
  videoUrl: string,
  opts: { apiKey: string; model: string; fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void> },
): Promise<CallResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const body = JSON.stringify({
    model: opts.model,
    max_tokens: 6000,
    response_format: { type: "json_object" },
    usage: { include: true },
    messages: [
      {
        role: "user",
        content: [
          { type: "video_url", video_url: { url: videoUrl } },
          { type: "text", text: SUMMARISER_PROMPT },
        ],
      },
    ],
  });

  for (let attempt = 0; ; attempt++) {
    const result = await attemptOnce(fetchImpl, opts.apiKey, body);
    if (result.ok || !result.retryable || attempt >= BACKOFF_MS.length) {
      if (result.ok) return result;
      return { ok: false, status: result.status, reason: result.reason, costUsd: result.costUsd };
    }
    await sleep(BACKOFF_MS[attempt]);
  }
}

type OpenRouterBody = {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  usage?: { cost?: number };
  error?: { code?: number; message?: string };
};

async function attemptOnce(
  fetchImpl: typeof fetch,
  apiKey: string,
  body: string,
): Promise<{ ok: true; content: string; costUsd: number } | { ok: false; retryable: boolean; status: number; reason: string; costUsd: number }> {
  let res: Response;
  try {
    res = await fetchImpl(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "TKS articles" },
      body,
    });
  } catch (err) {
    // A dropped connection or DNS failure: the most transient error there is.
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, retryable: true, status: 0, reason: `network error: ${message}`, costUsd: 0 };
  }

  const text = await res.text();
  let json: OpenRouterBody = {};
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object") json = parsed as OpenRouterBody;
  } catch {
    // Non-JSON error page; carry on with an empty body.
  }
  const costUsd = json.usage?.cost ?? 0;

  if (!res.ok) {
    return { ok: false, retryable: isRetryable(res.status, text), status: res.status, reason: json.error?.message ?? `HTTP ${res.status}`, costUsd };
  }
  // OpenRouter can answer 200 with an error from the provider behind it.
  if (json.error) {
    const code = json.error.code ?? 0;
    return { ok: false, retryable: code === 429 || code >= 500, status: res.status, reason: json.error.message ?? `provider error ${code}`, costUsd };
  }
  const choice = json.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    const why = choice?.finish_reason ? ` (${choice.finish_reason})` : "";
    return { ok: false, retryable: false, status: res.status, reason: `empty reply${why}`, costUsd };
  }
  return { ok: true, content, costUsd };
}
