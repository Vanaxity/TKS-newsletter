"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import type { FormState } from "@/lib/auth/schemas";
import { signup } from "./actions";

export function SignupForm() {
  const [state, action] = useActionState<FormState, FormData>(signup, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field label="Email" name="email" type="email" autoComplete="email" required error={e.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters"
        error={e.password}
      />
      <Field
        label="TKS join code"
        name="joinCode"
        autoComplete="off"
        required
        hint="It's pinned in TKS Slack"
        error={e.joinCode}
      />
      <FormError message={state.error} />
      <SubmitButton pendingText="Creating your account…">Create account</SubmitButton>
      <p className="text-center text-sm text-tks-grey">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-tks-black underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}
