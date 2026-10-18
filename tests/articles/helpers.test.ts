import { composeFeed, type ArticleCard } from "@/lib/articles/feed";
import { splitPreview } from "@/lib/articles/preview";
import { randomSuffix, slugify } from "@/lib/articles/slug";

const cards = (prefix: string, n: number): ArticleCard[] =>
  Array.from({ length: n }, (_, i) => ({
    slug: `${prefix}${i + 1}`,
    headline: `${prefix}${i + 1}`,
    dek: "",
    tags: ["ai"],
    readMinutes: 1,
    youtubeVideoId: "aircAruvnKk",
    publishedAt: "2026-10-18T00:00:00Z",
  }));

test("slug from a normal headline", () =>
  expect(slugify("Cracking the Code of Neural Networks", "ab12cd")).toBe("cracking-the-code-of-neural-networks-ab12cd"));

test("accents, emoji and punctuation", () => expect(slugify("Pokémon 🚀 — évolution!?", "x1y2z3")).toBe("pokemon-evolution-x1y2z3"));

test("punctuation only falls back", () => expect(slugify("?!… 🚀", "q9w8e7")).toBe("article-q9w8e7"));

test("long headlines are cut on a word", () => {
  const s = slugify("word ".repeat(40), "abc123");
  expect(s.length).toBeLessThanOrEqual(67);
  expect(s).toMatch(/^(word-)+word-abc123$/);
});

test("random suffix is 6 lowercase letters or digits", () => expect(randomSuffix()).toMatch(/^[a-z0-9]{6}$/));

test("preview takes about the first half", () => {
  const md = ["one two three four", "five six seven eight", "nine ten eleven twelve", "thirteen fourteen fifteen sixteen"].join("\n\n");
  expect(splitPreview(md)).toBe("one two three four\n\nfive six seven eight");
});



test("headings count as blocks too", () => {
  expect(splitPreview("## Start\n\none two three\n\n## Later\n\nfour five six")).toBe("## Start\n\none two three");
});

test("every fifth item is from outside your interests", () => {
  const feed = composeFeed(cards("m", 8), cards("o", 3));
  expect(feed.map((i) => i.article.slug)).toEqual(["m1", "m2", "m3", "m4", "o1", "m5", "m6", "m7", "m8", "o2", "o3"]);
  expect(feed.filter((i) => i.outside).map((i) => i.article.slug)).toEqual(["o1", "o2", "o3"]);
});

test("no matching articles → only outside picks", () =>
  expect(composeFeed([], cards("o", 2)).map((i) => i.outside)).toEqual([true, true]));

test("nothing at all → empty", () => expect(composeFeed([], [])).toEqual([]));

test("an article in both lists appears once", () => {
  const mine = cards("m", 4);
  const feed = composeFeed(mine, [mine[1], ...cards("o", 1)]);
  expect(feed.map((i) => i.article.slug)).toEqual(["m1", "m2", "m3", "m4", "o1"]);
});
