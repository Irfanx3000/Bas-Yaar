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
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
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
  const { t } = useTranslation();
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
      setFieldError(i18n.t("auth.stayConnected.passwordMismatchBody"));
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
        <h1 className="text-h2 font-extrabold text-heading">{t("web.auth.reset.title")}</h1>
        <p className="mt-[5px] text-md text-body">{t("web.auth.reset.subtitle")}</p>

        <form onSubmit={onSubmit} className="mt-5">
          <Input
            label={t("auth.stayConnected.emailLabel")}
            type="email"
            required
            icon="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label={t("web.auth.reset.codeLabel")}
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
            placeholder="000000"
          />

          <Input
            label={t("auth.resetPassword.newPasswordLabel")}
            type="password"
            required
            minLength={8}
            icon="lock"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint={t("web.auth.reset.passwordHint")}
          />

          <Input
            label={t("web.auth.reset.confirmLabel")}
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
            {t("auth.resetPassword.submit")}
          </Button>
        </form>

        <p className="mt-4 text-center text-md text-body">
          <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
            {t("web.auth.reset.sendNewCode")}
          </Link>
        </p>
      </Card>
    </main>
  );
}
