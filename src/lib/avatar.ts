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
  const letters = [first, last].map((n) => n?.trim().charAt(0).toUpperCase() ?? "").join("");
  return letters || "?";
}

export function avatarPathFor(userId: string): string {
  return `${userId}/avatar.webp`;
}
