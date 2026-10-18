const MAX_BASE = 60;

// "Cracking the Code!" → "cracking-the-code-ab12cd". The suffix keeps slugs unique.
export function slugify(headline: string, suffix: string): string {
  let base = headline
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base.length > MAX_BASE) {
    base = base.slice(0, MAX_BASE);
    const lastDash = base.lastIndexOf("-");
    if (lastDash > 0) base = base.slice(0, lastDash);
    base = base.replace(/-+$/g, "");
  }
  return `${base || "article"}-${suffix}`;
}

export function randomSuffix(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
