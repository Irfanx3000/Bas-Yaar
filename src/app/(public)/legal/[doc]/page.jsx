/* Privacy Policy and Terms & Conditions.
 *
 * PUBLIC, not behind AuthGuard, and a server component. Three reasons, all the
 * same reason: a legal document that only a logged-in user can read is not
 * published; app stores and payment providers link to these and follow the link
 * without a session; and PROGRESS lists them as the Phase 5 SEO surface, which
 * needs them crawlable and rendered without client JS.
 *
 * The app reaches them from Settings, which is signed-in — so the sidebar links
 * here and the pages simply do not care whether anyone is signed in.
 *
 * One route for both documents rather than two near-identical files: they differ
 * only in which key of LEGAL_PAGES they read.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL_PAGES } from "@/constants/legal.content";

/* Both documents are known at build time and neither takes a parameter, so
   they prerender as static HTML — no request-time work, and `dynamicParams`
   off means /legal/anything-else is a real 404 rather than a rendered blank. */
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }) {
  const { doc } = await params;
  const page = LEGAL_PAGES[doc];
  if (!page) return {};

  return {
    title: `${page.title} · CrewApply`,
    description: page.sections[0]?.body.slice(0, 155),
  };
}

export default async function LegalPage({ params }) {
  const { doc } = await params;
  const page = LEGAL_PAGES[doc];
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-3xl px-[15px] py-8 lg:px-6">
      <Link href="/settings" className="text-md font-semibold text-primary hover:underline">
        ← Settings
      </Link>

      <h1 className="mt-4 text-h1 font-extrabold text-heading">{page.title}</h1>
      <p className="mt-1 text-sm text-hint">{page.updatedAt}</p>

      <div className="mt-6 flex flex-col gap-6">
        {page.sections.map((section) => {
          /* A line starting with • is a bullet in the source. Consecutive
             bullets become one <ul> so screen readers announce a list of N
             items rather than a paragraph that happens to contain dots. */
          const lines = section.body.split("\n");
          const bullets = lines.filter((line) => line.startsWith("•"));
          const prose = lines.filter((line) => !line.startsWith("•"));

          return (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-heading">{section.heading}</h2>

              {prose.map((line) => (
                <p key={line} className="mt-2 text-md leading-relaxed text-body">
                  {line}
                </p>
              ))}

              {bullets.length ? (
                <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-md leading-relaxed text-body">
                  {bullets.map((line) => (
                    <li key={line}>{line.replace(/^•\s*/, "")}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
    </main>
  );
}
