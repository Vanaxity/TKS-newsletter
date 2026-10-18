"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import type { FormState } from "@/lib/auth/schemas";
import { saveProfile } from "./actions";
import { AvatarPicker } from "./avatar-picker";

export type Cohort = { id: number; name: string; type: "global" | "in_person" };

type Props = {
  userId: string;
  cohorts: Cohort[];
  avatarUrl: string | null;
  initialInitials: string;
  defaults: {
    username: string;
    firstName: string;
    lastName: string;
    city: string;
    cohortId: number | null;
    avatarPath: string | null;
  };
};

export function ProfileForm({ userId, cohorts, avatarUrl, initialInitials, defaults }: Props) {
  const [state, action] = useActionState<FormState, FormData>(saveProfile, {});
  const e = state.fieldErrors ?? {};
  // After a failed save, show what was typed rather than the saved profile.
  const v = { ...stringDefaults(defaults), ...state.values };
  const startType = cohorts.find((c) => c.id === defaults.cohortId)?.type ?? null;
  const [cohortType, setCohortType] = useState<Cohort["type"] | null>(startType);
  const options = cohorts.filter((c) => c.type === cohortType);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <AvatarPicker
        userId={userId}
        initialUrl={avatarUrl}
        initialPath={defaults.avatarPath}
        fallbackInitials={initialInitials}
      />
      <Field
        label="Username"
        name="username"
        autoComplete="username"
        defaultValue={v.username}
        hint="Lowercase letters, numbers or _. This is your profile address."
        error={e.username}
        required
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="First name" name="firstName" autoComplete="given-name" defaultValue={v.firstName} error={e.firstName} required />
        <Field label="Last name" name="lastName" autoComplete="family-name" defaultValue={v.lastName} error={e.lastName} required />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-ink">Which cohort are you from?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["global", "Global"],
              ["in_person", "In-person"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${
                cohortType === value ? "border-ink bg-tks-green text-on-green" : "border-line bg-card text-on-green"
              }`}
            >
              <input
                type="radio"
                name="cohortType"
                value={value}
                checked={cohortType === value}
                onChange={() => setCohortType(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        {cohortType ? (
          <select
            name="cohortId"
            aria-label="Cohort"
            defaultValue={cohorts.some((c) => String(c.id) === v.cohortId && c.type === cohortType) ? v.cohortId : ""}
            key={cohortType}
            className={`mt-1 rounded-xl border bg-card px-4 py-3 text-base text-ink ${e.cohortId ? "border-red-600" : "border-line"}`}
          >
            <option value="" disabled>
              Pick your cohort
            </option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : null}
        {e.cohortId || e.cohortType ? <p className="text-sm text-red-700">{e.cohortId ?? e.cohortType}</p> : null}
      </fieldset>

      <Field label="City" name="city" autoComplete="address-level2" defaultValue={v.city} error={e.city} required />
      <FormError message={state.error} />
      <SubmitButton pendingText="Saving…">Next: pick your interests</SubmitButton>
    </form>
  );
}

function stringDefaults(d: Props["defaults"]): Record<string, string> {
  return {
    username: d.username,
    firstName: d.firstName,
    lastName: d.lastName,
    city: d.city,
    cohortId: d.cohortId ? String(d.cohortId) : "",
  };
}
