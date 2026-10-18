export const MAX_VIDEO_MINUTES = 120;

// Short videos get a short piece and are never padded; longer ones get about 30 words a minute.
export function lengthTarget(videoMinutes: number): { min: number; max: number } {
  if (videoMinutes <= 5) return { min: 100, max: 250 };
  const target = Math.min(1500, Math.max(250, Math.round(30 * videoMinutes)));
  return {
    min: Math.max(250, Math.round(0.8 * target)),
    max: Math.min(1500, Math.round(1.2 * target)),
  };
}

export function countWords(markdown: string): number {
  return markdown
    .replace(/[#*_>`~\[\]()-]/g, " ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function readMinutes(words: number): number {
  return Math.max(1, Math.round(words / 220));
}

function normalise(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // drop accents so "Pokémon" matches "Pokemon"
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const numberWords = (words: Set<string>) => [...words].filter((w) => /\d/.test(w)).sort().join(" ");

// Loose match so punctuation differences pass but a different video's title doesn't.
export function titlesMatch(a: string, b: string): boolean {
  const na = normalise(a);
  const nb = normalise(b);
  if (na === nb) return true;
  const wa = new Set(na.split(" "));
  const wb = new Set(nb.split(" "));
  // "chapter 1" vs "chapter 2" is a different video even though almost every word matches.
  if (numberWords(wa) !== numberWords(wb)) return false;
  const shared = [...wa].filter((w) => wb.has(w)).length;
  return shared / new Set([...wa, ...wb]).size >= 0.8;
}
