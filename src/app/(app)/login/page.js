"use client";

/* Sign in. Uses the app's own useAuth hook and auth.service, copied verbatim.
 *
 * Honours ?next= so the AuthGuard can send someone here from a protected route
 * and land them back where they were aiming. The value is validated before use:
 * an open redirect is a real vulnerability, and `next` arrives from the URL, so
 * anything not starting with a single "/" is discarded. `//evil.com` is a
 * protocol-relative URL that browsers treat as absolute, which is why the second
 * character is checked too.
 */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button, Card, InlineAlert, Input } from "@/components/ui";

const safeNext = (value) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell />}>
      <LoginForm />
    </Suspense>
  );
}

/* Shared frame so the Suspense fallback and the form are the same box — no
   layout jump between them. */
function AuthShell({ children }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-[15px] py-8">
      <Card className="w-full max-w-sm" elevation="md">
        {children}
      </Card>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const { t } = useTranslation();
  const { login, isLoading, error } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      await login(identifier, password);
      router.replace(next);
    } catch {
      /* useAuth already captured the message into `error` */
    }
  };

  return (
    <AuthShell>
      <h1 className="text-h2 font-extrabold text-heading">{t("web.auth.login.title")}</h1>
      <p className="mt-[5px] text-md text-body">{t("web.auth.login.subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-5">
        <Input
          label={t("web.auth.login.identifierLabel")}
          type="text"
          autoComplete="username"
          required
          icon="email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
        />

        <Input
          label={t("web.auth.login.passwordLabel")}
          type="password"
          autoComplete="current-password"
          required
          icon="lock"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <div className="-mt-1 mb-3 text-right">
          <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            {t("auth.login.forgotPassword")}
          </Link>
        </div>

        {error ? (
          <InlineAlert tone="error" className="mb-3">
            {error}
          </InlineAlert>
        ) : null}

        <Button type="submit" fullWidth loading={isLoading}>
          {isLoading ? t("web.auth.login.submitting") : t("web.auth.login.submit")}
        </Button>
      </form>

      <p className="mt-4 text-center text-md text-body">
        {t("web.auth.login.newHere")}{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          {t("auth.welcome.createAccount")}
        </Link>
      </p>
    </AuthShell>
  );
}
