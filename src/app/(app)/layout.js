"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   THE client boundary. There is exactly one, and this is it.

   Everything under (app)/ is the signed-in product, running the data layer
   copied verbatim from the mobile app: axios client, services, hooks and
   contexts, all of which need localStorage, effects and browser APIs. Marking
   the boundary once here is why those ~7,200 lines needed no "use client" of
   their own.

   Do NOT server-render anything below this point. Auth is a bearer token in
   localStorage with a rotating refresh; the server cannot read it, and moving
   to cookies would mean backend changes plus rewriting the refresh interceptor.
   Signed-in pages are not indexed anyway.

   Public, indexable routes live in (public)/ and stay server components.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard, isPublicPath } from "@/components/layout/AuthGuard";
import { AlertHost } from "@/components/layout/AlertHost";
import { useProfile } from "@/context/ProfileContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { CareerProfileProvider } from "@/context/CareerProfileContext";
import { setRouter } from "@/navigation/navigationRef";
import { dataSync } from "@/store/dataSync";
import { ConnectivityProvider } from "@/context/ConnectivityContext";
import { SavedJobsProvider } from "@/context/SavedJobsContext";
import { AppliedJobsProvider } from "@/context/AppliedJobsContext";

/* Which routes render bare (no sidebar, no top bar) is exactly the same
   question as which routes an anonymous user may reach, so there is ONE list —
   in AuthGuard — rather than two that can drift apart. A route added to one and
   missed in the other would either show a sidebar of destinations to someone
   with no session, or lock people out of the page that lets them sign in. */
export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const bare = isPublicPath(pathname);

  /* api/client.js signs the user out from inside its axios interceptor — from
     outside React entirely — so the router has to be reachable globally. Set
     before paint so an immediate 401 on first load can still redirect. */
  useEffect(() => {
    setRouter(router);
  }, [router]);

  /* Registers the AppState + connectivity listeners that revalidate every
     cached resource on reconnect and on returning to a backgrounded tab. */
  useEffect(() => {
    dataSync.startAutoSync();
    return () => dataSync.stopAutoSync();
  }, []);

  /* Providers are added as the screens that consume them arrive — an unused
     provider is a fetch on every page load for data nothing reads. Profile
     joined in Block B: the shell's avatar needs it. */
  return (
    <ConnectivityProvider>
      <ProfileProvider>
        <SubscriptionProvider>
          <SavedJobsProvider>
            <AppliedJobsProvider>
              {/* CareerProfileProvider fetches at most once per session and only
                  when a screen calls load(), so mounting it costs nothing until
                  Profile or CV asks. */}
              <CareerProfileProvider>
                <AuthGuard>{bare ? children : <Chrome>{children}</Chrome>}</AuthGuard>
                {/* Registers the global alert host. Without it every showAlert()
                    in the copied hooks — and in api/client.js's interceptor —
                    silently no-ops. */}
                <AlertHost />
              </CareerProfileProvider>
            </AppliedJobsProvider>
          </SavedJobsProvider>
        </SubscriptionProvider>
      </ProfileProvider>
    </ConnectivityProvider>
  );
}

/* Split out so it can read ProfileContext, which is mounted above it. */
function Chrome({ children }) {
  const { profile } = useProfile() ?? {};
  return <AppShell user={profile}>{children}</AppShell>;
}
