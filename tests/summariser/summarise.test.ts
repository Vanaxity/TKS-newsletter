import { summariseVideo } from "@/lib/summariser/summarise";

const URL_ = "https://youtu.be/aircAruvnKk";
const YT_TITLE = "But what is a neural network? | Deep learning chapter 1";

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

function draftJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    video_title: "But what is a neural network? | Deep learning, chapter 1",
    channel: "3Blue1Brown",
    video_minutes: 19,
    headline: "Cracking the code of neural networks",
    dek: "How layers of numbers learn to read handwriting.",
    tags: ["ai", "math"],
    article_markdown: words(570),
    ...overrides,
  });
}

// A fake fetch that answers YouTube oEmbed and OpenRouter separately.
function routes(opts: { oembed?: Response; openrouter?: Response }) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("youtube.com/oembed")) {
      return opts.oembed ?? new Response(JSON.stringify({ title: YT_TITLE, author_name: "3Blue1Brown" }));
    }
    return (
      opts.openrouter ??
      new Response(JSON.stringify({ choices: [{ message: { content: draftJson() } }], usage: { cost: 0.0326 } }))
    );
  });
}

const openRouterReply = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }], usage: { cost: 0.0326 } }));

const openRouterCalls = (fake: ReturnType<typeof routes>) =>
  fake.mock.calls.filter(([u]) => String(u).includes("openrouter.ai")).length;

const noSleep = async () => {};

test("no YouTube link → rejected, no calls", async () => {
  const fake = vi.fn();
  expect(await summariseVideo("hello", { apiKey: "k", fetchImpl: fake })).toEqual({
    status: "rejected",
    videoId: null,
    reason: "No YouTube link found",
    costUsd: 0,
  });
  expect(fake).not.toHaveBeenCalled();
});

test("private or deleted video → rejected before any paid call", async () => {
  const fake = routes({ oembed: new Response("", { status: 401 }) });
  const r = await summariseVideo(URL_, { apiKey: "k", fetchImpl: fake });
  expect(r).toEqual({
    status: "rejected",
    videoId: "aircAruvnKk",
    reason: "Video is private or deleted",
    costUsd: 0,
  });
  expect(openRouterCalls(fake)).toBe(0);
});

test("happy path → ok with word count, read time and cost", async () => {
  const fake = routes({});
  const r = await summariseVideo(URL_, { apiKey: "k", fetchImpl: fake, sleep: noSleep });
  expect(r).toMatchObject({ status: "ok", videoId: "aircAruvnKk", problems: [], wordCount: 570, readMinutes: 3, costUsd: 0.0326 });
  if (r.status === "ok") expect(r.draft.tags).toEqual(["ai", "math"]);
  const call = fake.mock.calls.find(([u]) => String(u).includes("openrouter.ai"))!;
  const body = JSON.parse((call as unknown as [string, RequestInit])[1].body as string);
  expect(body.model).toBe("google/gemini-3.5-flash-lite");
  expect(body.messages[0].content[0].video_url.url).toBe("https://www.youtube.com/watch?v=aircAruvnKk");
});

test("title mismatch → failed (possible invented content)", async () => {
  const fake = routes({
    oembed: new Response(JSON.stringify({ title: "But what is a neural network?", author_name: "3Blue1Brown" })),
    openrouter: openRouterReply(draftJson({ video_title: "How transformers work" })),
  });
  expect(await summariseVideo(URL_, { apiKey: "k", fetchImpl: fake, sleep: noSleep })).toEqual({
    status: "failed",
    videoId: "aircAruvnKk",
    reason: 'Title mismatch: Gemini said "How transformers work", YouTube says "But what is a neural network?"',
    costUsd: 0.0326,
  });
});

test("word count outside the target → ok with a problem note", async () => {
  const fake = routes({ openrouter: openRouterReply(draftJson({ article_markdown: words(300) })) });
  const r = await summariseVideo(URL_, { apiKey: "k", fetchImpl: fake, sleep: noSleep });
  expect(r).toMatchObject({ status: "ok", problems: ["300 words; expected 456-684"] });
});

test("over 120 minutes → rejected after the call, cost reported", async () => {
  const fake = routes({ openrouter: openRouterReply(draftJson({ video_minutes: 150 })) });
  expect(await summariseVideo(URL_, { apiKey: "k", fetchImpl: fake, sleep: noSleep })).toEqual({
    status: "rejected",
    videoId: "aircAruvnKk",
    reason: "Video is longer than 2 hours",
    costUsd: 0.0326,
  });
});

test("unparseable reply → failed with reason and cost", async () => {
  const fake = routes({ openrouter: openRouterReply("Sorry, I cannot watch that video.") });
  expect(await summariseVideo(URL_, { apiKey: "k", fetchImpl: fake, sleep: noSleep })).toEqual({
    status: "failed",
    videoId: "aircAruvnKk",
    reason: "reply was not JSON",
    costUsd: 0.0326,
  });
});

test("OpenRouter failure → failed with its reason", async () => {
  const fake = routes({
    openrouter: new Response(JSON.stringify({ error: { message: "No auth credentials found" } }), { status: 401 }),
  });
  expect(await summariseVideo(URL_, { apiKey: "k", fetchImpl: fake, sleep: noSleep })).toEqual({
    status: "failed",
    videoId: "aircAruvnKk",
    reason: "OpenRouter: No auth credentials found",
    costUsd: 0,
  });
});

test("a model override reaches the request", async () => {
  const fake = routes({});
  await summariseVideo(URL_, { apiKey: "k", model: "google/gemini-3.8-flash", fetchImpl: fake, sleep: noSleep });
  const call = fake.mock.calls.find(([u]) => String(u).includes("openrouter.ai"))!;
  expect(JSON.parse((call as unknown as [string, RequestInit])[1].body as string).model).toBe("google/gemini-3.8-flash");
});

test("a YouTube lookup failure is a failure, not a rejection, and costs nothing", async () => {
  const fake = routes({ oembed: new Response("", { status: 503 }) });
  expect(await summariseVideo(URL_, { apiKey: "k", fetchImpl: fake })).toEqual({
    status: "failed",
    videoId: "aircAruvnKk",
    reason: "YouTube lookup failed: HTTP 503",
    costUsd: 0,
  });
  expect(openRouterCalls(fake)).toBe(0);
});

test("no network at all → failed with a reason, never a crash", async () => {
  const fake = vi.fn(async (): Promise<Response> => {
    throw new TypeError("fetch failed");
  });
  expect(await summariseVideo(URL_, { apiKey: "k", fetchImpl: fake, sleep: noSleep })).toEqual({
    status: "failed",
    videoId: "aircAruvnKk",
    reason: "YouTube lookup failed: fetch failed",
    costUsd: 0,
  });
});
