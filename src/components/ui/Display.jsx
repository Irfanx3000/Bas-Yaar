import Image from "next/image";
import { Icon } from "./Icon";
import { toMediaUrl } from "@/constants/app.constants";

/* Small presentational pieces that carry no behaviour of their own. */

const AVATAR_SIZE = { sm: 32, md: 40, lg: 56, xl: 88 };

/* Falls back to initials rather than a generic silhouette — a real name reads
 * better than a placeholder, and most users have no photo. `toMediaUrl` is the
 * app's own helper, so a stored relative path ("uploads/profile/x.webp") and an
 * absolute URL both work. */
export function Avatar({ src, name = "", size = "md", className = "" }) {
  const px = AVATAR_SIZE[size] ?? AVATAR_SIZE.md;
  const url = toMediaUrl(src);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-round bg-primary-light font-bold text-primary ${className}`}
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
  );
}

/* Track colour is primary.tint, which the palette annotates as exactly this:
 * "Progress track / soft chip". */
export function ProgressBar({ value = 0, label, className = "" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={className}>
      {label ? (
        <div className="mb-[5px] flex items-baseline justify-between">
          <span className="text-sm font-medium text-body">{label}</span>
          <span className="text-sm font-bold text-primary">{pct}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
        className="h-2 w-full overflow-hidden rounded-round bg-primary-tint"
      >
        <div
          className="bg-gradient-primary h-full rounded-round transition-[width] duration-[280ms] ease-decelerate"
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
