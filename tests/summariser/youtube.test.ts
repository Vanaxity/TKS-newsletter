import { canonicalUrl, fetchOEmbed, parseYouTubeId } from "@/lib/summariser/youtube";

const ID = "aircAruvnKk";

test.each([
  `https://www.youtube.com/watch?v=${ID}`,
  `https://youtube.com/watch?v=${ID}&amp;t=30s`,
  `<https://www.youtube.com/watch?v=${ID}&amp;list=PLx|a video>`,
  `https://youtu.be/${ID}?si=abc123`,
  `https://m.youtube.com/watch?feature=share&v=${ID}`,
  `https://www.youtube.com/shorts/${ID}`,
  `https://www.youtube.com/live/${ID}?feature=share`,
  `check this out https://youtu.be/${ID} so cool`,
])("parses %s", (s) => expect(parseYouTubeId(s)).toBe(ID));

test.each([
  "https://vimeo.com/123",
  "https://www.youtube.com/@3blue1brown",
  "no link here",
  "https://youtu.be/short",
])("returns null for %s", (s) => expect(parseYouTubeId(s)).toBeNull());

test("fetchOEmbed maps title and author", async () => {
  const fake = vi.fn(async () => new Response(JSON.stringify({ title: "T", author_name: "A" }), { status: 200 }));
  expect(await fetchOEmbed(ID, fake)).toEqual({ ok: true, title: "T", authorName: "A" });
  expect(String((fake.mock.calls[0] as unknown[])[0])).toContain(encodeURIComponent(canonicalUrl(ID)));
});

test("fetchOEmbed marks private or deleted videos as unavailable", async () => {
  for (const status of [400, 401, 403, 404]) {
    expect(await fetchOEmbed(ID, async () => new Response("", { status }))).toEqual({
      ok: false,
      unavailable: true,
      reason: `HTTP ${status}`,
    });
  }
});

const throwsNetwork = async (): Promise<Response> => {
  throw new TypeError("fetch failed");
};

test.each([
  ["a YouTube outage", async () => new Response("", { status: 503 }), "HTTP 503"],
  ["a rate limit", async () => new Response("", { status: 429 }), "HTTP 429"],
  ["no network", throwsNetwork, "fetch failed"],
  ["a non-JSON page", async () => new Response("<html>consent</html>", { status: 200 }), "unexpected reply"],
  ["a reply without a title", async () => new Response(JSON.stringify({ author_name: "A" }), { status: 200 }), "unexpected reply"],
])("fetchOEmbed reports %s as a lookup failure, not unavailable", async (_, impl, reason) => {
  expect(await fetchOEmbed(ID, impl as typeof fetch)).toEqual({ ok: false, unavailable: false, reason });
});
