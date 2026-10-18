import type { ArticleCard } from "@/lib/articles/feed";
import { rankMine, rankOutside } from "@/lib/articles/rank";

const DAY = 24 * 3600 * 1000;
const base = Date.parse("2026-10-18T12:00:00Z");
const card = (slug: string, daysAgo: number, repostCount = 0): ArticleCard => ({
  slug,
  headline: slug,
  dek: "",
  tags: ["ai"],
  readMinutes: 1,
  youtubeVideoId: "aircAruvnKk",
  publishedAt: new Date(base - daysAgo * DAY).toISOString(),
  repostCount,
});
const none = { ratedSlugs: new Set<string>(), ownRepostSlugs: new Set<string>() };

test("newest first when nothing else differs", () => {
  expect(rankMine([card("old", 2), card("new", 0)], none).map((c) => c.slug)).toEqual(["new", "old"]);
});

test("each repost counts as 12 hours newer", () => {
  expect(rankMine([card("new", 0), card("older", 1, 3)], none).map((c) => c.slug)).toEqual(["older", "new"]);
});

test("your own repost doesn't lift it in your feed", () => {
  const opts = { ...none, ownRepostSlugs: new Set(["older"]) };
  expect(rankMine([card("new", 0), card("older", 1, 2)], opts).map((c) => c.slug)).toEqual(["new", "older"]);
});

test("an article you've rated moves down by 48 hours", () => {
  const opts = { ...none, ratedSlugs: new Set(["new"]) };
  expect(rankMine([card("new", 0), card("older", 1)], opts).map((c) => c.slug)).toEqual(["older", "new"]);
});

test("outside picks: 5+ reposts come first, most reposted first", () => {
  const ranked = rankOutside([card("fresh", 0), card("hot6", 10, 6), card("warm4", 1, 4), card("hot9", 20, 9)]);
  expect(ranked.map((c) => c.slug)).toEqual(["hot9", "hot6", "fresh", "warm4"]);
});
