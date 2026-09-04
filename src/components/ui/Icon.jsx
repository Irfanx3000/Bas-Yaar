import { ICON_PATHS } from "./icon-paths";

/* The app's icons, drawn as inline SVG.
 *
 * Replaces react-native-vector-icons/FontAwesome, which 73 of the app's 80
 * icon-using files import. Names are the app's own, so a ported component keeps
 * name="map-marker-alt" unchanged.
 *
 * FontAwesome glyphs are FILL-based with a per-glyph viewBox — unlike the
 * stroke-based 24×24 set the admin panel uses, which is why this is written
 * fresh rather than copied from there. Colour comes from `currentColor`, so
 * `text-primary` on the icon or any ancestor tints it.
 *
 * Decorative by default. Pass a `title` when the icon is the only label, and it
 * becomes an accessible image instead of being hidden from screen readers.
 */
export function Icon({ name, size = 16, className, title, ...rest }) {
  const glyph = ICON_PATHS[name];

  if (!glyph) {
    // Loud in development, invisible in production — a missing icon should
    // never collapse a layout, but it also should not pass review unnoticed.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`<Icon name="${name}"> is not in icon-paths.js. Add it to scripts/extract-icons.mjs and re-run.`);
    }
    return null;
  }

  const [width, height, path] = glyph;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : "true"}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={path} />
    </svg>
  );
}

export default Icon;
