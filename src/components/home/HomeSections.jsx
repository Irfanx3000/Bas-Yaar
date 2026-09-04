"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, Icon } from "@/components/ui";
import { CATEGORIES } from "@/constants/categories.constants";

/* The Home screen's sections, built from the app's screenshots.
 *
 * The app screen is only 194 LOC because all of this lives in ten components —
 * so these are ported by eye from the running app, not inferred from JSX.
 */

/* ── Hero ───────────────────────────────────────────────────────────────────
   A short strip (260/300/320px) with the greeting ON the artwork.

   The artwork is 1648x954 (1.727:1) and this box is ~3.45:1. object-cover
   therefore scales it to the container's WIDTH and shows a horizontal band
   through the middle — the full width is always visible, so only the vertical
   position can be steered. That is why objectPosition tunes Y, not X.

   `50% 30%` puts the band across the ship and the seafarer and pushes the
   artwork's four feature columns below the crop. Those columns are small print
   written for a landing page; behind a dashboard greeting they would read as
   unrelated noise.

   The scrim is heavy on the left on purpose — solid header navy to 30%, still
   92% at 60%, transparent by the right edge. The artwork carries its own logo
   and headline over there, and a light wash would leave two headlines competing.
   At this strength the left third reads as a navy panel and the photography
   takes the right.

   Type is WHITE here rather than the usual dark tokens, because the panel
   behind it is navy. */
export function HomeHero({ userName, tagline, action }) {
  return (
    <section className="relative isolate h-[260px] overflow-hidden rounded-xl bg-header sm:h-[300px] lg:h-[320px]">
      <Image
        src="/hero-home.png"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 69rem, 100vw"
        className="-z-10 object-cover"
        style={{ objectPosition: "50% 30%" }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-header from-30% via-header/92 via-60% to-transparent" />

      <div className="flex h-full max-w-lg flex-col justify-center px-[15px] sm:px-6">
        <p className="text-lg font-bold text-white">
          Welcome Back <span aria-hidden="true">&#128075;</span>
        </p>
        <p className="text-h1 font-extrabold text-white">{userName || "there"}</p>
        <p className="mt-1 text-md text-white/80">{tagline || "Explore global cruise careers"}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </section>
  );
}

/* ── Section header with a "View All" affordance ───────────────────────────── */
export function SectionRow({ title, href, children }) {
  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-heading">{title}</h2>
        {href ? (
          <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View All <Icon name="arrow-right" size={11} />
          </Link>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/* ── Categories ────────────────────────────────────────────────────────────
   Five tiles. The app's own SVG icons are reused verbatim from its asset folder
   so the glyphs match; "Others" has no file, so it falls back to a tag icon. */
const CATEGORY_ICON = { deck: "deck", engine: "engine", hospitality: "hospitality", catering: "catering" };

export function CategoryTiles() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {CATEGORIES.map((cat) => {
        const file = CATEGORY_ICON[cat.icon?.key];
        return (
          <Link
            key={cat.name}
            href={`/jobs?category=${encodeURIComponent(cat.name)}`}
            className="press flex flex-col items-center gap-2 rounded-md border border-line-soft bg-surface px-2 py-3 shadow-sm hover:border-primary"
          >
            <span className="flex size-9 items-center justify-center text-primary">
              {file ? (
                <Image src={`/categories/${file}.svg`} alt="" width={28} height={28} />
              ) : (
                <Icon name="tag" size={22} />
              )}
            </span>
            <span className="text-sm font-semibold text-heading">{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

/* ── CV status strip ───────────────────────────────────────────────────────
   Relative dates via Intl.RelativeTimeFormat — no date library. `lastUpdated`
   arrives raw from the hook; applications arrive pre-formatted as `dateText`. */
const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const STEPS = [
  ["year", 31536000000],
  ["month", 2592000000],
  ["week", 604800000],
  ["day", 86400000],
  ["hour", 3600000],
  ["minute", 60000],
];

function relativeDate(value) {
  if (!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  if (Number.isNaN(diff)) return null;
  for (const [unit, ms] of STEPS) {
    if (Math.abs(diff) >= ms) return RELATIVE.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

export function CVMeta({ cvStatus }) {
  /* The hook returns { completionPercent, lastUpdated }. A CV exists once it has
     ever been touched, which lastUpdated is the honest signal for — a 0% CV that
     was saved is still a CV. */
  if (!cvStatus?.lastUpdated) return null;

  const percent = cvStatus.completionPercent ?? 0;
  const updatedLabel = relativeDate(cvStatus.lastUpdated);

  return (
    <div className="rounded-md bg-primary-light px-3 py-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-heading">
        <Icon name="check-circle" size={12} className="shrink-0 text-success" />
        CV uploaded{percent > 0 && percent < 100 ? ` · ${percent}% complete` : ""}
      </p>
      {updatedLabel ? <p className="mt-[2px] text-xs text-body">Updated {updatedLabel}</p> : null}
    </div>
  );
}

/* ── Promo tiles ──────────────────────────────────────────────────────────
   The job card's SHAPE, not its anatomy: same 16px radius, same `grid-cards`
   track, `h-full` so a row shares one height, and `mt-auto` so every CTA lands
   on the same baseline whatever the copy length.

   No media band. JobCard has one because a job has a company logo — real
   information. These have no artwork, so a 16:9 panel holding a single icon is
   just empty space at the top of every card. The icon moves inline beside the
   title, where it labels rather than fills. */
export function PromoCard({ icon, title, message, href, cta, variant = "primary", meta }) {
  const solid = variant === "primary";

  return (
    <Card radius="lg" className="flex h-full flex-col">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
          <Icon name={icon} size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="text-md font-bold text-heading">{title}</h3>
          <p className="mt-[2px] text-sm text-body">{message}</p>
        </div>
      </div>

      <div className="mt-auto pt-3">
        {meta}
        <Link
          href={href}
          className={
            solid
              ? "bg-gradient-primary press mt-2 block rounded-md py-2.5 text-center text-md font-bold text-on-primary shadow-sm"
              : "press mt-2 block rounded-md border-[1.5px] border-primary py-2.5 text-center text-md font-semibold text-primary"
          }
        >
          {cta}
        </Link>
      </div>
    </Card>
  );
}
