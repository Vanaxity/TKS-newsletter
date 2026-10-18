"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import type { FormState } from "@/lib/auth/schemas";
import { login } from "./actions";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={v.email} error={e.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required error={e.password} />
      <FormError message={state.error} />
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}
