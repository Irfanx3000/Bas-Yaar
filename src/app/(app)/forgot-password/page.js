"use client";

/* Forgot password, step 1 of 2.
 *
 * The backend emails a 6-digit OTP, not a reset link — auth.service's own
 * comment says why: "there's no web app to hand a reset link off to." That is
 * now untrue, but changing it is a backend change, so this follows the OTP flow
 * the API actually implements.
 *
 * The success message is deliberately identical whether or not the address is
 * registered. The endpoint is silent by design so it cannot be used to discover
 * which emails have accounts, and a UI that said "no account found" would hand
 * that back.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/i18n/getErrorMessage";
import { Button, Card, InlineAlert, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-[15px] py-8">
      <Card className="w-full max-w-sm" elevation="md">
        <h1 className="text-h2 font-extrabold text-heading">Reset your password</h1>
        <p className="mt-[5px] text-md text-body">
          Enter your email and we&apos;ll send you a 6-digit code.
        </p>

        <form onSubmit={onSubmit} className="mt-5">
          <Input
            label="Email address"
            type="email"
            required
            autoFocus
            icon="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          {error ? (
            <InlineAlert tone="error" className="mb-3">
              {error}
            </InlineAlert>
          ) : null}

          <Button type="submit" fullWidth loading={submitting}>
            Send code
          </Button>
        </form>

        <p className="mt-4 text-center text-md text-body">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
