/* Ported from the app's AppCard.jsx.
 *
 *   white · 1px border.light (the soft blue stroke) · radius 10px
 *   padding 16px · shadow-sm by default
 *   pressable variant scales to 0.985 (motion.scale.cardPressIn) — deliberately
 *   subtler than a button, because cards should settle rather than jump
 *
 * NOTE the border: the app's cards are NOT borderless. That 1px
 * rgba(183,218,255,.35) stroke is what keeps a white card legible on the ocean
 * blue background, and dropping it is the single easiest way to make the web
 * look wrong at a glance.
 */
export function Card({
  children,
  as: Tag = "div",
  elevation = "sm",
  radius = "md",
  padding = "md",
  interactive = false,
  className = "",
  ...rest
}) {
  const shadow = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg" }[elevation] ?? "shadow-sm";
  /* Props, not className overrides. `className="rounded-lg"` cannot reliably beat
     a base `rounded-md` — same specificity, so Tailwind's output order decides,
     which is the bug that shipped a full-height button inside JobCard. Anything
     that varies belongs in a map here. */
  const corner = { md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }[radius] ?? "rounded-md";
  const pad = { none: "", sm: "p-3", md: "p-4" }[padding] ?? "p-4";

  return (
    <Tag
      className={`${corner} ${pad} border border-line-soft bg-surface ${shadow} ${
        interactive
          ? "cursor-pointer text-left transition-transform duration-[180ms] ease-standard active:scale-[0.985]"
          : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Card;
