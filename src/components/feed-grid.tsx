"use client";

import { useSyncExternalStore } from "react";
import { thumbnailUrl, type FeedItem } from "@/lib/articles/feed";
import { INTERESTS } from "@/lib/interests";
import ChromaGrid from "./react-bits/ChromaGrid";

const LABELS = new Map<string, string>(INTERESTS.map((i) => [i.slug, i.label]));

const touchQuery = "(hover: none)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(touchQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

// The feed as React Bits Chroma Grid cards. Phones have no hover, so cards show in colour there.
export function FeedGrid({ items }: { items: FeedItem[] }) {
  const isTouch = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(touchQuery).matches,
    () => false,
  );

  const cards = items.map(({ article, outside }) => ({
    image: thumbnailUrl(article.youtubeVideoId),
    title: article.headline,
    subtitle: [
      `${article.readMinutes} min read`,
      article.tags.map((t) => LABELS.get(t) ?? t).join(", "),
      outside ? "Outside your interests" : null,
    ]
      .filter(Boolean)
      .join(" · "),
    accent: "#51B04C",
    url: `/a/${article.slug}`,
  }));

  return (
    <ChromaGrid
      items={cards}
      theme="light"
      columns={3}
      minCardWidth={240}
      aspectRatio="16 / 9"
      grayscale={isTouch ? 0 : 1}
      dim={isTouch ? 0 : 0.12}
    />
  );
}
