/* Global ref for transient toasts — the same host-ref pattern as alertRef.js,
 * for the same reason: SavedJobsContext raises these from a plain callback, not
 * from inside a component that could reach a provider.
 *
 * Deliberately NOT folded into alertRef. An alert is a modal that interrupts and
 * demands an answer; a toast is a confirmation you are allowed to ignore.
 * Bookmarking a job is the second kind — a dialog for it would be worse than no
 * feedback at all.
 *
 * config: { message, tone?: 'success'|'error'|'info', icon? }
 */
const hostRef = { current: null };

export function setToastHost(handlers) {
  hostRef.current = handlers;
}

export function showToast(config) {
  hostRef.current?.show(typeof config === "string" ? { message: config } : config);
}
