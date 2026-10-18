import { countWords } from "@/lib/summariser/rules";

const DOMINANT_SHARE = 0.65;
const isHeadingOnly = (block: string) => /^#{1,6}\s/.test(block) && !block.includes("\n");

// The first half of an article for non-members. It stops at the paragraph boundary closest to halfway,
// never ends on a bare heading, and cuts inside the opening paragraph when that paragraph is most of the
// article, so the preview is always clearly less than the whole.
export function splitPreview(markdown: string): string {
  const blocks = markdown
    .trim()
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const counts = blocks.map(countWords);
  const total = counts.reduce((a, b) => a + b, 0);
  if (blocks.length === 0) return "";

  if (blocks.length === 1 || counts[0] > total * DOMINANT_SHARE) return cutBlock(blocks[0], total / 2);

  let best = -1;
  let bestGap = Infinity;
  let taken = 0;
  for (let i = 0; i < blocks.length - 1; i++) {
    taken += counts[i];
    if (isHeadingOnly(blocks[i])) continue;
    const gap = Math.abs(taken - total / 2);
    if (gap < bestGap) {
      best = i;
      bestGap = gap;
    }
  }
  if (best < 0) return cutBlock(blocks[0], total / 2);
  return blocks.slice(0, best + 1).join("\n\n");
}

// Part of one paragraph: whole sentences up to about `targetWords`, or half its words when it's one sentence.
function cutBlock(block: string, targetWords: number): string {
  const sentences = block.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 1) {
    let best = 1;
    let bestGap = Infinity;
    let words = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      words += countWords(sentences[i]);
      const gap = Math.abs(words - targetWords);
      if (gap < bestGap) {
        best = i + 1;
        bestGap = gap;
      }
    }
    return sentences.slice(0, best).join(" ");
  }
  const parts = block.split(/\s+/);
  if (parts.length < 2) return "";
  return `${parts.slice(0, Math.max(1, Math.floor(parts.length / 2))).join(" ")}…`;
}
