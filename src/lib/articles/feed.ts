export type ArticleCard = {
  slug: string;
  headline: string;
  dek: string;
  tags: string[];
  readMinutes: number;
  youtubeVideoId: string;
  publishedAt: string;
  repostCount: number;
};

export type FeedItem = { article: ArticleCard; outside: boolean };

// The member's own articles in order, with every `every`-th slot given to an article outside their interests.
export function composeFeed(mine: ArticleCard[], outside: ArticleCard[], every = 5): FeedItem[] {
  const mineSlugs = new Set(mine.map((a) => a.slug));
  const extra = outside.filter((a) => !mineSlugs.has(a.slug));
  const feed: FeedItem[] = [];
  let m = 0;
  let o = 0;
  while (m < mine.length) {
    if ((feed.length + 1) % every === 0 && o < extra.length) feed.push({ article: extra[o++], outside: true });
    else feed.push({ article: mine[m++], outside: false });
  }
  while (o < extra.length) feed.push({ article: extra[o++], outside: true });
  return feed;
}

export function thumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
