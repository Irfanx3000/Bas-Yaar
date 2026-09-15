/* Readable job URLs: /jobs/second-engineer-bulk-carrier-6a6f09fa3962f90607b606c5
 *
 * Slug AND id, not slug alone — which is what the real job boards do:
 *   LinkedIn  /jobs/view/deck-officer-at-maersk-3812345678
 *   Stack Overflow  /questions/12345/how-to-...
 *
 * Why not a pure /jobs/deck-officer: jobs have no slug field in the database
 * (verified in Phase 0) and there is no lookup-by-slug endpoint. Adding both is
 * backend work, which this project does not do. Keeping the id in the URL means
 * the link resolves with zero backend change, titles can be edited without
 * breaking shared links, and two jobs with the same title cannot collide.
 *
 * The slug leads and the id trails on purpose. WhatsApp and SMS truncate long
 * URLs from the END, so the readable half is the half that survives — and
 * WhatsApp sharing is a first-class feature here (there is a whatsapp icon in
 * the icon set and a Refer This Job flow built around it).
 *
 * BACKWARD COMPATIBLE BY CONSTRUCTION. The app already shares links as
 * `crewapply.com/jobs/<id>` (see ReferJobModal), so those exist in the wild.
 * A bare id still parses here: the id is simply the whole segment and the slug
 * is empty. No redirect table, no special case.
 *
 * ponytail: no canonical redirect yet. Two URLs for one job is an SEO concern,
 * and this route is behind auth where nothing is indexed. Add a canonical
 * redirect when /jobs moves to the public surface in Phase 5.
 */

/* Mongo ObjectIds are 24 hex characters, which is what makes the id
   unambiguously separable from a slug that may itself contain digits and
   hyphens. Anchored to the end. */
const ID_PATTERN = /([0-9a-f]{24})$/i;

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFKD")                 // strip accents rather than drop the letter
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);                     // keeps the URL shareable, not a paragraph

/** Build the canonical href for a job. Falls back to a bare id when there is
 *  no title to slug, which still parses. */
export function jobHref(job) {
  const id = job?.id ?? job?._id;
  if (!id) return "/jobs";

  const slug = slugify(job.title);
  return slug ? `/jobs/${slug}-${id}` : `/jobs/${id}`;
}

/** Pull the job id back out of a URL segment.
 *  Accepts "second-engineer-6a6f…c5" and a bare "6a6f…c5" alike. */
export function jobIdFromSlug(segment) {
  const match = ID_PATTERN.exec(String(segment || ""));
  return match ? match[1] : null;
}

export { slugify };
