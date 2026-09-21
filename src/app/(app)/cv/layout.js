"use client";

/* Resume configurations (My Resumes + the template gallery) for /cv and
 * /cv/resume — the app mounts this provider inside CareerProfileProvider.
 *
 * Mounted HERE, not in (app)/layout.js, on purpose. That layout survives
 * sign-out (it also wraps /login), and this provider caches with a `loaded` ref
 * that logout's dataSync reset does not know about — mounted there, the next
 * person to sign in on the same tab would be shown the previous user's resumes.
 * Scoped to the CV section, it unmounts on the way out and fetches fresh on the
 * way back in, while /cv ↔ /cv/resume still share one cache and one fetch.
 */

import { ResumeConfigurationsProvider } from "@/context/ResumeConfigurationsContext";

export default function CVLayout({ children }) {
  return <ResumeConfigurationsProvider>{children}</ResumeConfigurationsProvider>;
}
