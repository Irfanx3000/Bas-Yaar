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
  featured: ["bg-primary-light", "text-primary", "Featured"],
  applied: ["bg-[#EAF0F9]", "text-[#2F80ED]", "Applied"],
  interview: ["bg-info-light", "text-info-text", "Interview"],
  interview_scheduled: ["bg-info-light", "text-info-text", "Interview"],
  selected: ["bg-success-light", "text-success-text", "Selected"],
  offered: ["bg-success-light", "text-success-text", "Selected"],
  confirmed: ["bg-success-light", "text-success-text", "Selected"],
  under_review: ["bg-warning-light", "text-warning-text", "Under Review"],
  awaiting_confirmation: ["bg-warning-light", "text-warning-text", "Under Review"],
  rejected: ["bg-danger-light", "text-danger-text", "Rejected"],
  declined: ["bg-danger-light", "text-danger-text", "Rejected"],
  closed: ["bg-danger-light", "text-danger-text", "Rejected"],
};

/* APPLIED is the one badge whose colours are not in the palette — the app
 * hardcodes #EAF0F9/#2F80ED in StatusBadge.jsx. Copied verbatim rather than
 * substituted with info-light/info-text, which are visibly bluer. If these ever
 * become real tokens, fix both sides together. */

export function StatusBadge({ status, label, className = "" }) {
  const key = String(status ?? "").toLowerCase().replace(/\s+/g, "_");
  const [bg, fg, fallback] = STATUS[key] ?? ["bg-canvas", "text-body", status];

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
          aria-label={`Remove ${typeof children === "string" ? children : "filter"}`}
          className="-mr-1 cursor-pointer rounded-round px-1 leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
