import { callOpenRouter } from "@/lib/summariser/openrouter";
import { SUMMARISER_PROMPT } from "@/lib/summariser/prompt";

const okBody = { choices: [{ message: { content: '{"a":1}' } }], usage: { cost: 0.0326 } };
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const noSleep = async () => {};

test("sends only the URL and the prompt, returns content and cost", async () => {
  const fake = vi.fn<typeof fetch>(async () => reply(200, okBody));
  const r = await callOpenRouter("https://www.youtube.com/watch?v=aircAruvnKk", {
    apiKey: "k",
    model: "google/gemini-3.5-flash-lite",
    fetchImpl: fake,
    sleep: noSleep,
  });
  expect(r).toEqual({ ok: true, content: '{"a":1}', costUsd: 0.0326 });
  const init = fake.mock.calls[0][1] as RequestInit;
  const body = JSON.parse(init.body as string);
  expect(body.model).toBe("google/gemini-3.5-flash-lite");
  expect(body.messages[0].content).toEqual([
    { type: "video_url", video_url: { url: "https://www.youtube.com/watch?v=aircAruvnKk" } },
    { type: "text", text: SUMMARISER_PROMPT },
  ]);
});

test("the prompt lists every interest slug", () => {
  expect(SUMMARISER_PROMPT).toContain("math, physics, chemistry");
  expect(SUMMARISER_PROMPT).toContain("business, design");
});

test.each([429, 500, 503])("retries %i then succeeds", async (status) => {
  const fake = vi.fn().mockResolvedValueOnce(reply(status, {})).mockResolvedValueOnce(reply(200, okBody));
  const r = await callOpenRouter("u", { apiKey: "k", model: "m", fetchImpl: fake, sleep: noSleep });
  expect(r.ok).toBe(true);
  expect(fake).toHaveBeenCalledTimes(2);
});

test("retries a 400 INVALID_ARGUMENT", async () => {
  const fake = vi
    .fn()
    .mockResolvedValueOnce(reply(400, { error: { message: "INVALID_ARGUMENT: try again" } }))
    .mockResolvedValueOnce(reply(200, okBody));
  const r = await callOpenRouter("u", { apiKey: "k", model: "m", fetchImpl: fake, sleep: noSleep });
  expect(r.ok).toBe(true);
});

test("gives up after 3 attempts", async () => {
  const fake = vi.fn(async () => reply(503, { error: { message: "down" } }));
  const r = await callOpenRouter("u", { apiKey: "k", model: "m", fetchImpl: fake, sleep: noSleep });
  expect(r).toMatchObject({ ok: false, status: 503, reason: "down" });
  expect(fake).toHaveBeenCalledTimes(3);
});

test("does not retry other 4xx (bad key)", async () => {
  const fake = vi.fn(async () => reply(401, { error: { message: "No auth credentials found" } }));
  const r = await callOpenRouter("u", { apiKey: "k", model: "m", fetchImpl: fake, sleep: noSleep });
  expect(r).toMatchObject({ ok: false, status: 401, reason: "No auth credentials found" });
  expect(fake).toHaveBeenCalledTimes(1);
});

test("a dropped connection is retried, then reported", async () => {
  const fake = vi.fn(async (): Promise<Response> => {
    throw new TypeError("fetch failed");
  });
  const r = await callOpenRouter("u", { apiKey: "k", model: "m", fetchImpl: fake, sleep: noSleep });
  expect(r).toEqual({ ok: false, status: 0, reason: "network error: fetch failed", costUsd: 0 });
  expect(fake).toHaveBeenCalledTimes(3);
});

test("a dropped connection followed by success works", async () => {
  const fake = vi.fn().mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce(reply(200, okBody));
  expect((await callOpenRouter("u", { apiKey: "k", model: "m", fetchImpl: fake, sleep: noSleep })).ok).toBe(true);
});

test("a 200 carrying a retryable provider error is retried", async () => {
  const fake = vi
    .fn()
    .mockResolvedValueOnce(reply(200, { error: { code: 502, message: "Provider returned error" } }))
    .mockResolvedValueOnce(reply(200, okBody));
  expect((await callOpenRouter("u", { apiKey: "k", model: "m", fetchImpl: fake, sleep: noSleep })).ok).toBe(true);
  expect(fake).toHaveBeenCalledTimes(2);
});

test("a 200 with no content reports why instead of passing an empty reply on", async () => {
  const filtered = { choices: [{ message: { content: null }, finish_reason: "content_filter" }], usage: { cost: 0.01 } };
  const r = await callOpenRouter("u", { apiKey: "k", model: "m", fetchImpl: async () => reply(200, filtered), sleep: noSleep });
  expect(r).toEqual({ ok: false, status: 200, reason: "empty reply (content_filter)", costUsd: 0.01 });
  const empty = await callOpenRouter("u", { apiKey: "k", model: "m", fetchImpl: async () => reply(200, { choices: [] }), sleep: noSleep });
  expect(empty).toMatchObject({ ok: false, status: 200, reason: "empty reply" });
});

test("a body of literally null doesn't crash", async () => {
  const r = await callOpenRouter("u", {
    apiKey: "k",
    model: "m",
    fetchImpl: async () => new Response("null", { status: 200 }),
    sleep: noSleep,
  });
  expect(r).toMatchObject({ ok: false, reason: "empty reply" });
});
