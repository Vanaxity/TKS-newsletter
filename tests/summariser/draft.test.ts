import { parseDraft } from "@/lib/summariser/draft";

const good = {
  video_title: "T",
  channel: "C",
  video_minutes: 18.7,
  headline: "H",
  dek: "D",
  tags: ["ai", "math"],
  article_markdown: "Body text.",
};

test("parses plain JSON and maps to camelCase", () => {
  expect(parseDraft(JSON.stringify(good))).toEqual({
    ok: true,
    draft: {
      videoTitle: "T",
      channel: "C",
      videoMinutes: 18.7,
      headline: "H",
      dek: "D",
      tags: ["ai", "math"],
      articleMarkdown: "Body text.",
    },
  });
});

test("accepts JSON wrapped in a code fence or surrounding prose", () => {
  expect(parseDraft("```json\n" + JSON.stringify(good) + "\n```").ok).toBe(true);
  expect(parseDraft("Here you go: " + JSON.stringify(good) + " Enjoy!").ok).toBe(true);
});

test.each([
  ["unknown tag", { ...good, tags: ["cooking"] }],
  ["too many tags", { ...good, tags: ["ai", "math", "physics", "space"] }],
  ["no tags", { ...good, tags: [] }],
  ["missing article", { ...good, article_markdown: undefined }],
])("rejects %s", (_, bad) => expect(parseDraft(JSON.stringify(bad)).ok).toBe(false));

test("rejects non-JSON", () => {
  expect(parseDraft("Sorry, I cannot watch that video.")).toEqual({ ok: false, reason: "reply was not JSON" });
});

test("tags are lowercased and de-duplicated before checking", () => {
  const r = parseDraft(JSON.stringify({ ...good, tags: ["AI", "ai", "Math"] }));
  expect(r.ok && r.draft.tags).toEqual(["ai", "math"]);
});
