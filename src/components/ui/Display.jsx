import Image from "next/image";
import { Icon } from "./Icon";
import { toMediaUrl } from "@/constants/app.constants";

/* Small presentational pieces that carry no behaviour of their own. */

const AVATAR_SIZE = { sm: 32, md: 40, lg: 56, xl: 88 };

/* Falls back to initials rather than a generic silhouette — a real name reads
 * better than a placeholder, and most users have no photo. `toMediaUrl` is the
 * app's own helper, so a stored relative path ("uploads/profile/x.webp") and an
 * absolute URL both work. */
export function Avatar({ src, name = "", size = "md", showEditOverlay = false, onEditClick, className = "" }) {
  const px = AVATAR_SIZE[size] ?? AVATAR_SIZE.md;
  const url = toMediaUrl(src);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <span
        className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-primary-light font-bold text-primary ring-2 ring-primary/25 shadow-sm transition-transform hover:scale-[1.02]"
        style={{ width: px, height: px, fontSize: Math.round(px * 0.36) }}
      >
        {url ? (
          <Image src={url} alt={name || "Profile photo"} width={px} height={px} className="size-full object-cover" />
        ) : initials ? (
          initials
        ) : (
          <Icon name="user" size={Math.round(px * 0.5)} />
        )}
      </span>

      {showEditOverlay ? (
        <button
          type="button"
          onClick={onEditClick}
          aria-label="Change photo"
          className="absolute right-0 bottom-0 flex size-6 cursor-pointer items-center justify-center rounded-full border border-surface bg-primary text-white shadow-xs transition-transform hover:scale-110 active:scale-95"
        >
          <Icon name="camera" size={11} />
        </button>
      ) : null}
    </div>
  );
}

export function ProgressBar({ value = 0, label, className = "" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  // Color semantics based on completion percent
  let barGradient = "bg-gradient-primary";
  let textColor = "text-primary";

  if (pct < 50) {
    barGradient = "bg-gradient-to-r from-red-500 to-amber-500";
    textColor = "text-red-600 font-extrabold";
  } else if (pct < 80) {
    barGradient = "bg-gradient-to-r from-amber-500 to-primary";
    textColor = "text-amber-600 font-extrabold";
  }

  return (
    <div className={className}>
      {label ? (
        <div className="mb-[5px] flex items-baseline justify-between">
          <span className="text-sm font-medium text-body">{label}</span>
          <span className={`text-sm font-bold ${textColor}`}>{pct}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
        className="h-2.5 w-full overflow-hidden rounded-full bg-primary-tint/60 p-[1px]"
      >
        <div
          className={`${barGradient} h-full rounded-full transition-[width] duration-[350ms] ease-decelerate`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}


/* Mirrors the app's SectionHeader: a title on the left, an optional "View All"
 * style action on the right. */
export function SectionTitle({ children, action, className = "" }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${className}`}>
      <h2 className="text-xl font-bold text-heading">{children}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
