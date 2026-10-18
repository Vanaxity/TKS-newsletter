"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import type { FormState } from "@/lib/auth/schemas";
import { INTERESTS } from "@/lib/interests";
import { saveInterests } from "./actions";

export function InterestsForm({ initial, finishedBefore }: { initial: string[]; finishedBefore: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(saveInterests, {});
  const [picked, setPicked] = useState<Set<string>>(new Set(initial));

  function toggle(slug: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <fieldset>
        <legend className="sr-only">Your interests</legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(({ slug, label }) => {
            const on = picked.has(slug);
            return (
              <label
                key={slug}
                className={`cursor-pointer select-none rounded-full border px-4 py-2 text-sm font-medium transition ${
                  on ? "border-tks-green bg-tks-green text-on-green" : "border-line bg-card text-ink hover:border-ink"
                }`}
              >
                <input type="checkbox" name="interests" value={slug} checked={on} onChange={() => toggle(slug)} className="sr-only" />
                {label}
              </label>
            );
          })}
        </div>
        {state.fieldErrors?.interests ? <p className="mt-3 text-sm text-red-700">{state.fieldErrors.interests}</p> : null}
      </fieldset>
      <FormError message={state.error} />
      <div className="flex items-center justify-between gap-3">
        <Link href="/onboarding/profile" className="text-sm font-medium text-ink underline underline-offset-4">
          Back
        </Link>
        <SubmitButton disabled={picked.size === 0} pendingText="Saving…">
          {finishedBefore ? "Save interests" : `Finish${picked.size ? ` (${picked.size})` : ""}`}
        </SubmitButton>
      </div>
    </form>
  );
}
