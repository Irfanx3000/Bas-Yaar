import { Icon } from "./Icon";
import { Button } from "./Button";

/* The three states every data-backed screen needs, kept together because they
 * are always considered together: nothing yet, still loading, something wrong.
 *
 * Copy rule from the design brief: an empty screen is an invitation to act, and
 * an error says what happened and how to fix it. Neither apologises. So both
 * take an action rather than just a mood.
 */

export function EmptyState({ icon = "inbox", title, message, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center px-4 py-8 text-center ${className}`}>
      <span className="mb-3 flex size-14 items-center justify-center rounded-round bg-primary-light text-primary">
        <Icon name={icon} size={22} />
      </span>
      <p className="text-lg font-bold text-heading">{title}</p>
      {message ? <p className="mt-[5px] max-w-prose text-md text-body">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* Skeletons, not spinners, wherever the shape of the result is known — a
 * spinner tells you nothing, a skeleton tells you what is coming. Mirrors the
 * app's CardSkeleton. */
export function Skeleton({ className = "" }) {
  return <span className={`block animate-pulse rounded-xs bg-line-soft ${className}`} />;
}

export function LoadingState({ rows = 3, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rounded-md border border-line-soft bg-surface p-4 shadow-sm">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2 h-3 w-1/3" />
          <Skeleton className="mt-3 h-3 w-1/4" />
        </div>
      ))}
    </div>
  );
}

const ALERT = {
  info: ["bg-info-light", "text-info-text", "info-circle"],
  success: ["bg-success-light", "text-success-text", "check-circle"],
  warning: ["bg-warning-light", "text-warning-text", "exclamation-triangle"],
  error: ["bg-danger-light", "text-danger-text", "exclamation-circle"],
};

export function InlineAlert({ tone = "info", title, children, action, className = "" }) {
  const [bg, fg, icon] = ALERT[tone] ?? ALERT.info;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-md px-4 py-3 ${bg} ${className}`}
    >
      <Icon name={icon} size={16} className={`mt-[3px] shrink-0 ${fg}`} />
      <div className="min-w-0 flex-1">
        {title ? <p className={`text-md font-semibold ${fg}`}>{title}</p> : null}
        {children ? <div className="text-sm text-body">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}

/* The standard "we could not load this" block, so screens stop hand-rolling it.
 * Message comes from getErrorMessage(), which already turned a server code into
 * something a person can act on. */
export function ErrorState({ message, onRetry, className = "" }) {
  return (
    <InlineAlert
      tone="error"
      title="Couldn't load this"
      className={className}
      action={
        onRetry ? (
          <Button variant="outline" tone="danger" onClick={onRetry}>
            Try again
          </Button>
        ) : null
      }
    >
      {message}
    </InlineAlert>
  );
}
