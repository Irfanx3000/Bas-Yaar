/* A document URL an <iframe> on this site is allowed to display.
 *
 * The API sends helmet's defaults — `X-Frame-Options: SAMEORIGIN` and CSP
 * `frame-ancestors 'self'` — so framing api.crewapply.com from crewapply.com is
 * refused, and the browser draws "api.crewapply.com refused to connect" in the
 * frame. Those headers apply to FRAMING only, not to fetch: the web origin is
 * already on the API's CORS allow-list, and the view URL authenticates by its
 * query token, so a plain fetch (no custom headers, no preflight) reads the file.
 * A blob: URL made from it is same-origin to the page, so the iframe renders it.
 *
 * The caller owns the result and must URL.revokeObjectURL() it when the preview
 * closes. ponytail: whole file held in memory (the API caps uploads at 20 MB);
 * switch to a backend frame-ancestors allowance if documents ever get larger.
 */
export async function framableUrl(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    // Shaped like the axios normalizer's errors, so getErrorMessage() reads it.
    throw Object.assign(new Error(body?.message || `Request failed (${res.status})`), { data: body });
  }
  return URL.createObjectURL(await res.blob());
}
