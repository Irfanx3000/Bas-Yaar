/* Web version of the app's constants.

   This is the one copied file that had to be rewritten rather than aliased: the
   original picks its base URL from React Native's `__DEV__` global and points
   dev builds at the USB reverse-tunnel on localhost:5000. Neither concept
   exists in a browser, so the URL comes from the environment instead.

   Everything below API_BASE_URL — MEDIA_BASE_URL, TIMEOUT, toMediaUrl — is
   copied verbatim from CrewApply/src/constants/app.constants.js. */

// Set NEXT_PUBLIC_API_URL in .env.local (dev) and in Vercel (production).
// Include the /api/v1 suffix, no trailing slash.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const APP_CONFIG = {
  API_BASE_URL,
  // Origin for static files (uploads) — API base without the /api/v1 suffix.
  // This is also what connectivity.js probes /health against.
  MEDIA_BASE_URL: API_BASE_URL.replace(/\/api\/v\d+\/?$/, ""),
  TIMEOUT: 15000,
  SUPPORT_EMAIL: "support@crewapply.com",
  VERSION: "1.0.0",
};

// Turn a stored relative path ("uploads/profile/x.webp") into a loadable URL.
// Absolute URLs (http/https) and local file URIs are returned unchanged.
export const toMediaUrl = (pathOrUrl) => {
  if (!pathOrUrl) return null;
  if (/^(https?:|file:|content:|data:)/.test(pathOrUrl)) return pathOrUrl;
  const clean = String(pathOrUrl).replace(/^\/+/, "");
  return `${APP_CONFIG.MEDIA_BASE_URL}/${clean}`;
};
