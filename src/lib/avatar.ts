export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_SIZE = 512;

// null when the file is fine, otherwise the message to show.
export function checkAvatarFile(file: { type: string; size: number }): string | null {
  if (!AVATAR_TYPES.includes(file.type)) return "Photos must be JPG, PNG or WebP.";
  if (file.size > AVATAR_MAX_BYTES) return "Photos must be 5 MB or smaller.";
  return null;
}

// The largest square in the middle of the photo.
export function squareCrop(width: number, height: number): { sx: number; sy: number; size: number } {
  const size = Math.min(width, height);
  return { sx: Math.round((width - size) / 2), sy: Math.round((height - size) / 2), size };
}

export function initials(first: string | null, last: string | null): string {
  // Array.from splits by character, so an emoji isn't cut in half.
  const letters = [first, last].map((n) => (Array.from(n?.trim() ?? "")[0] ?? "").toUpperCase()).join("");
  return letters || "?";
}

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// A green card with the member's initials, used by the Profile Card when there's no photo.
export function initialsImageUrl(text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="640"><rect width="100%" height="100%" fill="#51B04C"/><text x="50%" y="52%" font-family="Inter,Arial,sans-serif" font-size="200" font-weight="600" fill="#17191A" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function avatarPathFor(userId: string): string {
  return `${userId}/avatar.webp`;
}
