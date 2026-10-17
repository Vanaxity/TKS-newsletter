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
    const res = await fetchImpl(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "TKS articles",
      },
      body,
    });
    const text = await res.text();
    let json: { choices?: { message?: { content?: string } }[]; usage?: { cost?: number }; error?: { message?: string } } = {};
    try {
      json = JSON.parse(text);
    } catch {
      // Non-JSON error page; fall through with an empty body.
    }
    const costUsd = json.usage?.cost ?? 0;

    if (res.ok) {
      return { ok: true, content: json.choices?.[0]?.message?.content ?? "", costUsd };
    }
    if (!isRetryable(res.status, text) || attempt >= BACKOFF_MS.length) {
      return { ok: false, status: res.status, reason: json.error?.message ?? `HTTP ${res.status}`, costUsd };
    }
    await sleep(BACKOFF_MS[attempt]);
  }
}
