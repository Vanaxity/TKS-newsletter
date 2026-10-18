import { countWords } from "@/lib/summariser/rules";

// The first half of an article, by paragraphs: at least one block, and never all of them when there are two or more.
export function splitPreview(markdown: string): string {
  const blocks = markdown
    .trim()
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length <= 1) return blocks.join("");

  const half = blocks.reduce((n, b) => n + countWords(b), 0) / 2;
  const taken: string[] = [];
  let words = 0;
  for (const block of blocks.slice(0, -1)) {
    taken.push(block);
    words += countWords(block);
    if (words >= half) break;
  }
  return taken.join("\n\n");
}
