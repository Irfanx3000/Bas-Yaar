"use client";

/* Forgot password, step 2 of 2.
 *
 * `resetPasswordWithOtp({ email, otp, newPassword, confirmPassword })` — the API
 * takes confirmPassword and checks the match server-side, so unlike signup this
 * field is not just a local typo guard. It is still checked here too, so a
 * mismatch costs no round trip and no rate-limit budget.
 */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/i18n/getErrorMessage";
import { Button, Card, InlineAlert, Input } from "@/components/ui";

const OTP_LENGTH = 6;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState(params.get("email") || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setFieldError(null);

    if (newPassword !== confirmPassword) {
      setFieldError("Those passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await authService.resetPasswordWithOtp({
        email: email.trim(),
        otp,
        newPassword,
        confirmPassword,
      });
      router.replace("/login?reset=1");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-[15px] py-8">
      <Card className="w-full max-w-sm" elevation="md">
        <h1 className="text-h2 font-extrabold text-heading">Choose a new password</h1>
        <p className="mt-[5px] text-md text-body">Enter the code we emailed you.</p>

        <form onSubmit={onSubmit} className="mt-5">
          <Input
            label="Email address"
            type="email"
            required
            icon="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Verification code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
            placeholder="000000"
          />

          <Input
            label="New password"
            type="password"
            required
            minLength={8}
            icon="lock"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint="At least 8 characters."
          />

          <Input
            label="Confirm new password"
            type="password"
            required
            icon="lock"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldError}
          />

          {error ? (
            <InlineAlert tone="error" className="mb-3">
              {error}
            </InlineAlert>
          ) : null}

          <Button type="submit" fullWidth loading={submitting} disabled={otp.length !== OTP_LENGTH}>
            Reset password
          </Button>
        </form>

        <p className="mt-4 text-center text-md text-body">
          <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
            Send a new code
          </Link>
        </p>
      </Card>
    </main>
  );
}
