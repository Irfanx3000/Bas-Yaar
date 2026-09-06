import { redirect } from "next/navigation";

/* The site root.
 *
 * Until Phase 4 builds the real public landing page, `/` hands straight off to
 * the app rather than showing anything of its own. AuthGuard then does the
 * deciding it already does everywhere else: a signed-in visitor lands on their
 * dashboard, anyone else is sent to /login with ?next= so signing in returns
 * them here.
 *
 * What was here before was a Phase 1 placeholder — "the design tokens are
 * ported… nothing else is built yet" — whose only button opened /theme. Fine
 * while the domain was not live; it is the first thing a real visitor reads now.
 *
 * 307, not 308: this is temporary and should stop being a redirect the moment
 * there is a landing page. A permanent redirect is cached by browsers and by
 * Google, and undoing one is slow. `redirect()` defaults to 307 here.
 */
export default function RootPage() {
  redirect("/dashboard");
}
