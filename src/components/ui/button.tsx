"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string };

// Green TKS button with black text; shows a pending label while its form submits.
export function SubmitButton({ children, pendingText, disabled, className, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`rounded-full bg-tks-green px-6 py-3 text-base font-semibold text-tks-black transition hover:bg-tks-green-hover disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
      {...rest}
    >
      {pending ? (pendingText ?? "Working…") : children}
    </button>
  );
}
