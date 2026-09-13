import Link from "next/link";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { StatusBadge } from "./Badge";
import { CardMediaHeader } from "./CardMediaHeader";

const TIER = {
  start: ["bg-primary-tint", "text-primary-vivid", "Start"],
  sail: ["bg-info-light", "text-info-text", "Sail"],
  premium: ["bg-secondary-tint", "text-warning-text", "Premium"],
};

export function JobCard({ job, saved = false, applied = false, onToggleSave, onApply, href }) {
  const [tierBg, tierFg, tierLabel] = TIER[job.minimumTier] ?? TIER.premium;
  const showBadges = job.isFeatured || job.urgent || (job.minimumTier && job.minimumTier !== "start");

  return (
    <Card radius="lg" padding="none" className="relative flex h-full flex-col overflow-hidden">
      <CardMediaHeader logoSrc={job.logo} title={job.title} companyName={job.companyName} />


      {/* NOT `relative`. The title link's stretched ::after resolves against the
          nearest POSITIONED ancestor — if this block were relative, the click
          area would stop at the text and the whole image band would be dead.
          Card is the positioned ancestor instead, so the ::after covers the
          entire tile.

          Which is why Save is reserved with a GRID cell rather than `absolute`:
          it needs a fixed top-right slot (it used to drift as badges and title
          lengths changed), and a grid gives that without creating a positioning
          context that would shrink the link. */}
      <div className="flex flex-1 flex-col p-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div className="min-w-0">
            {showBadges ? (
              <div className="mb-2 flex flex-wrap items-center gap-1">
                {job.isFeatured ? <StatusBadge status="featured" /> : null}
                {job.urgent ? <StatusBadge status="under_review" label="Urgent" /> : null}
                {job.minimumTier && job.minimumTier !== "start" ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-xs font-bold uppercase ${tierBg} ${tierFg}`}
                  >
                    <Icon name="lock" size={9} />
                    {tierLabel}
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Stretched link. The title is the ONE real link and its ::after
                covers the whole card, so the entire tile is clickable without
                nesting Save and Apply inside an <a> — which is invalid HTML and
                would stop those buttons working at all.
                It also keeps the accessible name right: a screen reader
                announces one link called "Second Engineer", not a link wrapping
                two buttons. Next's <Link>, so it is a client navigation. */}
            <h3 className="line-clamp-2 text-[15px] leading-[18px] font-bold text-heading">
              {href ? (
                <Link
                  href={href}
                  className="after:absolute after:inset-0 after:content-[''] hover:text-primary"
                >
                  {job.title}
                </Link>
              ) : (
                job.title
              )}
            </h3>

            {job.companyName ? (
              <p className="mt-[2px] truncate text-sm text-body">{job.companyName}</p>
            ) : null}
          </div>

          {/* z-20 to sit above the stretched ::after, or the card link swallows
              the click and saving becomes impossible. */}
          <button
            type="button"
            onClick={() => onToggleSave?.(job.id)}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
            className={`relative z-20 -mt-[2px] -mr-1 h-fit cursor-pointer rounded-round p-[6px] transition-colors duration-[180ms] ease-standard hover:bg-primary-light ${
              saved ? "text-primary" : "text-hint hover:text-primary"
            }`}
          >
            <Icon name="bookmark" size={16} />
          </button>
        </div>

        {/* mt-auto is what bottom-aligns the footer across every tile in a row. */}
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-[2px] text-sm text-body">
            {job.location ? (
              <span className="flex min-w-0 items-center gap-1">
                <Icon name="map-marker-alt" size={11} className="shrink-0" />
                <span className="truncate">{job.location}</span>
              </span>
            ) : null}
            {job.type ? (
              <span className="flex items-center gap-1">
                <Icon name="briefcase" size={11} className="shrink-0" />
                {job.type}
              </span>
            ) : null}
          </div>

          {job.salary ? (
            <p className="mt-2 text-[13px] font-bold text-primary">
              {job.salary} <span className="text-xs font-medium text-hint">{job.salaryUnit}</span>
            </p>
          ) : null}

          <div className="mt-3">
            {applied ? (
              <span className="relative z-10 flex w-full items-center justify-center gap-1 rounded-xl border border-success bg-success-light px-4 py-2 text-xs font-bold text-success">
                <Icon name="check-circle" size={11} />
                Applied
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onApply?.(job.id)}
                className="relative z-10 w-full cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary transition-transform duration-[180ms] ease-standard active:scale-[0.96]"
              >
                Apply now
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default JobCard;
