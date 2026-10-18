import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Avatars live in a private bucket, so pages get a short-lived signed link.
export async function avatarSignedUrl(supabase: SupabaseClient, path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
