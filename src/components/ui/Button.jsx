import { Icon } from "./Icon";

/* Ported from the app's AppButton.jsx, measurement for measurement.
 *
 *   md (default) → min-height 48px · radius 10px · px 20px · 14px semibold
 *   sm           → min-height 36px · radius 10px · px 16px · 12px semibold
 *
 *   solid   → the primary/secondary gradient, white label
 *   outline → transparent, 1.5px border in the tone colour, label in that colour
 *   text    → no background, no padding
 *   disabled solid → #D9D9D9 with hint-grey text
 *   press   → scale 0.96 (motion.scale.pressIn)
 *
 * NOTE the radius: the app's buttons are 10px, NOT pills. Pills are for badges
 * and chips. Getting this wrong makes every screen read as "close but off".
 *
 * SIZE IS A PROP, NOT A className OVERRIDE. Passing `className="min-h-9"` does
 * not reliably win against the base `min-h-12` — Tailwind's output order decides
 * which rule applies, not the order they appear in the string. That silently
 * rendered a full-height Apply button inside JobCard. Anything that varies by
 * size belongs in SIZE below, never appended by a caller.
 */

const TONE = {
  primary: { gradient: "bg-gradient-primary", border: "border-primary", text: "text-primary" },
  secondary: { gradient: "bg-gradient-secondary", border: "border-secondary", text: "text-secondary" },
  danger: { gradient: "bg-danger", border: "border-danger", text: "text-danger" },
};

const SIZE = {
  md: { box: "min-h-12 px-5 text-md gap-2", icon: 16, spinner: "size-4" },
  sm: { box: "min-h-9 px-4 text-sm gap-[5px]", icon: 12, spinner: "size-3" },
};

const BASE =
  "inline-flex items-center justify-center rounded-md font-semibold select-none transition-[transform,opacity] duration-[180ms] ease-standard";

export function Button({
  children,
  variant = "solid",
  tone = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  type = "button",
  ...rest
}) {
  const t = TONE[tone] ?? TONE.primary;
  const s = SIZE[size] ?? SIZE.md;
  const isDisabled = disabled || loading;

  const variantClasses = {
    solid: isDisabled
      ? "bg-line text-hint"
      : `${t.gradient} text-on-primary shadow-sm active:scale-[0.96]`,
    outline: isDisabled
      ? "border-[1.5px] border-line text-hint"
      : `border-[1.5px] ${t.border} ${t.text} active:scale-[0.96]`,
    text: isDisabled
      ? "text-hint"
      : `${t.text} active:scale-[0.96]`,
  }[variant];

  // The `text` variant drops the box entirely — no min-height, no padding.
  const box = variant === "text" ? `gap-2 ${s.box.replace(/min-h-\S+|px-\S+/g, "")}` : s.box;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`${BASE} ${box} ${variantClasses} ${fullWidth ? "w-full" : ""} ${
        isDisabled ? "cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className={`${s.spinner} animate-spin rounded-round border-2 border-current border-t-transparent`}
        />
      ) : (
        <>
          {icon && iconPosition === "left" ? <Icon name={icon} size={s.icon} /> : null}
          <span className="truncate">{children}</span>
          {icon && iconPosition === "right" ? <Icon name={icon} size={s.icon} /> : null}
        </>
      )}
    </button>
  );
}

export default Button;
