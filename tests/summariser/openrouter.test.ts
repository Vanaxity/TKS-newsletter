import { callOpenRouter } from "@/lib/summariser/openrouter";
import { SUMMARISER_PROMPT } from "@/lib/summariser/prompt";

const okBody = { choices: [{ message: { content: '{"a":1}' } }], usage: { cost: 0.0326 } };
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const noSleep = async () => {};

test("sends only the URL and the prompt, returns content and cost", async () => {
  const fake = vi.fn(async (..._args: unknown[]) => reply(200, okBody));
  const r = await callOpenRouter("https://www.youtube.com/watch?v=aircAruvnKk", {
    apiKey: "k",
    model: "google/gemini-3.5-flash-lite",
    fetchImpl: fake as unknown as typeof fetch,
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
