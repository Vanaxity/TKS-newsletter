import type { ArticleCard } from "./feed";

const HOUR = 3600 * 1000;
const REPOST_LIFT = 12 * HOUR;
const RATED_DROP = 48 * HOUR;
export const TRENDING_REPOSTS = 5;

// Own-interest articles: newest first, each repost counts as 12 hours newer (your own doesn't count for you),
// and articles you've already rated sink by 48 hours.
export function rankMine(
  cards: ArticleCard[],
  opts: { ratedSlugs: Set<string>; ownRepostSlugs: Set<string> },
): ArticleCard[] {
  const score = (c: ArticleCard) => {
    const reposts = c.repostCount - (opts.ownRepostSlugs.has(c.slug) ? 1 : 0);
    return Date.parse(c.publishedAt) + Math.max(0, reposts) * REPOST_LIFT - (opts.ratedSlugs.has(c.slug) ? RATED_DROP : 0);
  };
  return [...cards].sort((a, b) => score(b) - score(a));
}

// Picks from outside your interests: widely reposted ones first (most reposted, then newest), then the newest.
export function rankOutside(cards: ArticleCard[]): ArticleCard[] {
  const newest = (a: ArticleCard, b: ArticleCard) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  const trending = cards.filter((c) => c.repostCount >= TRENDING_REPOSTS).sort((a, b) => b.repostCount - a.repostCount || newest(a, b));
  const rest = cards.filter((c) => c.repostCount < TRENDING_REPOSTS).sort(newest);
  return [...trending, ...rest];
}
