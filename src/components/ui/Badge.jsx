"use client";

import { useTranslation } from "react-i18next";

/* StatusBadge is ported from the app's StatusBadge.jsx, including its status
 * vocabulary and its oddities — see APPLIED below. Pill radius, 8px/5px padding,
 * 10px bold UPPERCASE with 0.5px tracking.
 *
 * Chip is the soft filter/attribute pill. Its colours come straight from the
 * palette's own annotation: primary.tint is documented as "progress track /
 * soft chip".
 */

/* The app maps several server statuses onto one badge, so the same map lives
 * here rather than being re-derived per screen. */
const STATUS = {
  featured: ["bg-primary-light", "text-primary", "jobs.details.tagFeatured"],
  applied: ["bg-[#EAF0F9]", "text-[#2F80ED]", "jobs.details.tagApplied"],
  interview: ["bg-info-light", "text-info-text", "jobs.details.tagInterview"],
  interview_scheduled: ["bg-info-light", "text-info-text", "jobs.details.tagInterview"],
  selected: ["bg-success-light", "text-success-text", "jobs.details.tagSelected"],
  offered: ["bg-success-light", "text-success-text", "jobs.details.tagSelected"],
  confirmed: ["bg-success-light", "text-success-text", "jobs.details.tagSelected"],
  under_review: ["bg-warning-light", "text-warning-text", "jobs.details.tagUnderReview"],
  awaiting_confirmation: ["bg-warning-light", "text-warning-text", "jobs.details.tagUnderReview"],
  rejected: ["bg-danger-light", "text-danger-text", "jobs.details.tagRejected"],
  declined: ["bg-danger-light", "text-danger-text", "web.ui.badge.declined"],
  closed: ["bg-slate-100", "text-slate-600", "applications.tabs.closed"],
  withdrawn: ["bg-slate-100", "text-slate-600", "web.ui.badge.withdrawn"],
};


/* APPLIED is the one badge whose colours are not in the palette — the app
 * hardcodes #EAF0F9/#2F80ED in StatusBadge.jsx. Copied verbatim rather than
 * substituted with info-light/info-text, which are visibly bluer. If these ever
 * become real tokens, fix both sides together. */

export function StatusBadge({ status, label, className = "" }) {
  const key = String(status ?? "").toLowerCase().replace(/\s+/g, "_");
  const { t } = useTranslation();
  const known = STATUS[key];
  const [bg, fg] = known ?? ["bg-canvas", "text-body"];
  // Unknown statuses fall back to the raw server value, untranslated.
  const fallback = known ? t(known[2]) : status;

  return (
    <span
      className={`inline-flex items-center rounded-round px-2 py-[5px] text-xs font-bold tracking-[0.5px] uppercase ${bg} ${fg} ${className}`}
    >
      {label ?? fallback}
    </span>
  );
}

const CHIP_TONE = {
  default: "bg-primary-tint text-primary-vivid",
  neutral: "bg-canvas text-body",
  warning: "bg-secondary-tint text-warning-text",
  success: "bg-success-light text-success-text",
};

export function Chip({ children, tone = "default", onRemove, className = "" }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-round px-3 py-[5px] text-xs font-semibold ${
        CHIP_TONE[tone] ?? CHIP_TONE.default
      } ${className}`}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("web.ui.badge.remove", { name: typeof children === "string" ? children : t("web.ui.badge.filter") })}
          className="-mr-1 cursor-pointer rounded-round px-1 leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
