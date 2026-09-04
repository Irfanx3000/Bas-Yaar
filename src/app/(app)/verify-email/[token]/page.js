"use client";

/* The link the backend has been emailing since day one with nothing behind it.
 *
 * `email.service.js:37` sends `${CLIENT_URL}/verify-email/${token}`, and
 * CLIENT_URL has always pointed at a client that did not exist — so every
 * verification email ever sent led to a dead page. Discovered in Phase 0; this
 * is the fix.
 *
 * The request is made with apiClient directly rather than by adding a method to
 * services/auth.service.js. That file is part of the VERBATIM mirror of the
 * mobile app (see Phase 2), and the mobile app has no verify-email call because
 * it never had a web client to open the link. Adding one there would break the
 * property that re-copying a service is a plain file copy. If the mobile app
 * ever gains this call, move it and delete this note.
 *
 * The endpoint is public and idempotent-ish: an already-used token returns an
 * error, which is correct and is shown as such rather than being swallowed into
 * a false success.
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/api/client";
import { getErrorMessage } from "@/i18n/getErrorMessage";
import { Button, Card, Icon } from "@/components/ui";

export default function VerifyEmailPage({ params }) {
  const { token } = use(params);
  const [state, setState] = useState("verifying");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await apiClient.get(`/auth/verify-email/${encodeURIComponent(token)}`);
        if (!cancelled) setState("verified");
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err));
        setState("failed");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const view = {
    verifying: {
      icon: "sync-alt",
      tone: "bg-primary-light text-primary",
      title: "Verifying your email…",
      body: "This only takes a moment.",
    },
    verified: {
      icon: "check-circle",
      tone: "bg-success-light text-success",
      title: "Email verified",
      body: "Your address is confirmed. You can sign in now.",
    },
    failed: {
      icon: "exclamation-circle",
      tone: "bg-danger-light text-danger",
      title: "That link didn't work",
      body: error || "The link may have expired or already been used.",
    },
  }[state];

  return (
    <main className="flex min-h-dvh items-center justify-center px-[15px] py-8">
      <Card className="w-full max-w-sm text-center" elevation="md">
        <span className={`mx-auto flex size-16 items-center justify-center rounded-round ${view.tone}`}>
          <Icon name={view.icon} size={28} className={state === "verifying" ? "animate-spin" : undefined} />
        </span>

        <h1 className="mt-4 text-h3 font-extrabold text-heading">{view.title}</h1>
        <p className="mt-1 text-md text-body">{view.body}</p>

        {state !== "verifying" ? (
          <Link href="/login" className="mt-5 block">
            <Button fullWidth>Go to sign in</Button>
          </Link>
        ) : null}
      </Card>
    </main>
  );
}
