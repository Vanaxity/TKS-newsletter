"use client";

import { useRef, useState } from "react";
import { AVATAR_SIZE, avatarPathFor, checkAvatarFile, squareCrop } from "@/lib/avatar";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Props = { userId: string; initialUrl: string | null; initialPath: string | null; fallbackInitials: string };

// Pick a photo, crop it to a centred 512×512 WebP in the browser, upload it, and hand the path to the form.
export function AvatarPicker({ userId, initialUrl, initialPath, fallbackInitials }: Props) {
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [path, setPath] = useState<string>(initialPath ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onChange(file: File | undefined) {
    if (!file) return;
    const problem = checkAvatarFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const blob = await cropToWebp(file);
      const target = avatarPathFor(userId);
      const { error: uploadError } = await createBrowserSupabase()
        .storage.from("avatars")
        .upload(target, blob, { upsert: true, contentType: "image/webp" });
      if (uploadError) throw new Error(uploadError.message);
      setPreview(URL.createObjectURL(blob));
      setPath(target);
    } catch {
      setError("That photo didn't upload. Try another one.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-tks-green">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed or object URL, not optimisable
          <img src={preview} alt="Your profile photo" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-2xl font-semibold text-on-green">
            {fallbackInitials}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="cursor-pointer text-sm font-medium text-ink underline underline-offset-4">
          {busy ? "Uploading…" : preview ? "Change photo" : "Add a photo"}
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(e) => onChange(e.target.files?.[0])}
          />
        </label>
        <p className="text-sm text-muted">Optional. JPG, PNG or WebP, up to 5 MB.</p>
        {error ? <p className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}
      </div>
      <input type="hidden" name="avatarPath" value={path} />
    </div>
  );
}

async function cropToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { sx, sy, size } = squareCrop(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  canvas.getContext("2d")!.drawImage(bitmap, sx, sy, size, size, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/webp", 0.9),
  );
}
