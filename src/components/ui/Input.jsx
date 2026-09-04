import { useId, useState } from "react";
import { Icon } from "./Icon";

/* Ported from the app's AppInput.jsx.
 *
 *   wrapper  min-height 50px · 1px border · radius 12px · white · py 8 · px 16
 *   border   error → danger · focused → primary · otherwise #E2E8F0 (border.input)
 *   label    12px medium, slate, 5px below
 *   error    12px danger, 5px above
 *   icons    8px from the field text
 *
 * The 12px radius is an arbitrary value on purpose: the app's own comment says
 * no radius token equals 12 (md is 10, lg is 16) and that swapping to either
 * would visibly change the corner. Copied, not rounded to the nearest token.
 *
 * Focus is tracked in state rather than with focus-within so the border colour
 * can lose to `error` — an invalid field stays red while focused, which is what
 * the app does.
 */
export function Input({
  label,
  error,
  hint,
  icon,
  iconRight,
  id,
  required,
  className = "",
  containerClassName = "",
  ...rest
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? "border-danger"
    : isFocused
      ? "border-primary"
      : "border-line-input";

  return (
    <div className={`mb-3 ${containerClassName}`}>
      {/* The asterisk is aria-hidden because the input already carries the real
          `required` attribute — a screen reader announces "required" from that,
          and reading out a stray "star" on top of it is noise. The marker is
          purely visual. */}
      {label ? (
        <label htmlFor={inputId} className="mb-[5px] block text-sm font-medium text-body">
          {label}
          {required ? <span className="ml-[2px] text-danger" aria-hidden="true">*</span> : null}
        </label>
      ) : null}

      {/* The wrapper carries the whole field treatment — border, radius, focus.
          The <input> inside draws nothing of its own (see focus-visible:outline-none
          below), so there is exactly one box, not a box inside a box. The soft
          ring keeps keyboard focus obvious now that the input's own outline is
          suppressed; a 1px colour change alone is too quiet to rely on. */}
      <div
        className={`flex min-h-[50px] items-center rounded-[12px] border bg-surface px-4 py-2 transition-[color,box-shadow] duration-[180ms] ease-standard ${borderColor} ${
          isFocused ? "ring-4 ring-primary/15" : ""
        }`}
      >
        {icon ? <Icon name={icon} size={16} className="mr-2 shrink-0 text-hint" /> : null}

        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          className={`w-full bg-transparent text-md text-heading outline-none focus-visible:outline-none placeholder:text-hint ${className}`}
          {...rest}
        />

        {iconRight ? <Icon name={iconRight} size={16} className="ml-2 shrink-0 text-hint" /> : null}
      </div>

      {error || hint ? (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={`mt-[5px] text-sm ${error ? "text-danger" : "text-hint"}`}
        >
          {error || hint}
        </p>
      ) : null}
    </div>
  );
}

export default Input;
