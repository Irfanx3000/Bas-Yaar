"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { tokenStorage } from "@/api/tokenStorage";

/* Route protection for everything under (app).
 *
 * This has to be a CLIENT guard, and that is a consequence of the auth design
 * rather than a shortcut: the session is a bearer token in localStorage, which
 * the server cannot read. Next middleware runs on the server, so it can see
 * nothing here. Moving to httpOnly cookies would make server-side protection
 * possible, but it needs backend changes plus a rewrite of the refresh
 * interceptor — out of scope, and recorded in PROGRESS.md.
 *
 * Three states, and the middle one matters:
 *
 *   checking       token read has not resolved yet. Render NOTHING of the page.
 *                  This is what stops a protected screen flashing its contents
 *                  for a frame before the redirect — the bug this guard exists
 *                  to prevent, not just an unauthorised fetch.
 *   authenticated  render the app.
 *   anonymous      replace() to /login, carrying ?next= so sign-in returns the
 *                  user where they were aiming. replace, not push, so Back does
 *                  not land on a page they cannot see.
 *
 * This is the SECOND layer, not the only one. api/client.js already tears the
 * session down and redirects on a 401 from the server, which is the layer that
 * actually enforces anything — a client guard only decides what is painted. The
 * backend is, as always, the real gate.
 */

/* Routes inside (app) that anonymous users must reach: the auth screens
   themselves, and the email-verification link the backend sends out. */
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export const isPublicPath = (pathname) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isPublic = isPublicPath(pathname);

  /* The result is STORED WITH THE PATH IT WAS COMPUTED FOR, and that pairing is
     the whole fix.

     Before, this was a bare "checking" | "authenticated" | "anonymous". Signing
     in then broke as follows: on /login the check resolved to "anonymous"
     (correctly — there was no token yet). login() stored the tokens and pushed
     to /dashboard. Both effects re-ran, but the token re-read is a promise while
     the redirect effect is synchronous — so the redirect read the stale
     "anonymous" from the previous route and bounced straight back to
     /login?next=/dashboard, before the fresh read could resolve.

     Pairing the answer with its path means a result from another route can never
     be acted on: anything not settled FOR THE CURRENT PATH reads as "checking",
     which redirects nowhere and renders nothing. */
  const [check, setCheck] = useState({ status: "checking", path: null });

  useEffect(() => {
    let cancelled = false;

    /* tokenStorage is promise-based (it wraps the AsyncStorage shim), so even on
       the web this resolves a tick later — hence a real "checking" state rather
       than a synchronous read. */
    tokenStorage.getAccessToken().then((token) => {
      if (cancelled) return;
      setCheck({ status: token ? "authenticated" : "anonymous", path: pathname });
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const state = check.path === pathname ? check.status : "checking";

  useEffect(() => {
    if (state !== "anonymous" || isPublic) return;

    const next = encodeURIComponent(pathname);
    router.replace(`/login?next=${next}`);
  }, [state, isPublic, pathname, router]);

  // Auth screens render for everyone, including while the token check runs.
  if (isPublic) return children;

  if (state === "authenticated") return children;

  /* checking OR anonymous-and-redirecting. Deliberately a neutral placeholder
     rather than a spinner: it is on screen for one tick in the normal case, and
     a spinner that flashes is worse than a blank panel.

     ⚠️ If you need to work on a protected screen without signing in, do NOT
     comment this out — a bypass committed here disables protection for everyone,
     which is exactly what happened once already. Sign in instead, or set the
     token directly in devtools:
       localStorage.setItem('@crewapply:access_token', '<token>')  */
  return (
    <div className="flex min-h-dvh items-center justify-center px-[15px]">
      <p className="sr-only">Checking your session…</p>
    </div>
  );
}

export default AuthGuard;
