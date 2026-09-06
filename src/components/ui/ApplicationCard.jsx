import Image from "next/image";
import Link from "next/link";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { StatusBadge } from "./Badge";
import { toMediaUrl } from "@/constants/app.constants";
import { jobHref } from "@/lib/jobUrl";

/* An application, in the same media-tile shape as JobCard.
 *
 * Same anatomy on purpose — 16:9 image band at ~47%, contained logo on a tinted
 * panel, pinned footer, `h-full` + `mt-auto` so a grid row bottom-aligns. A job
 * and an application are the same object at two points in its life, so making
 * them two different shapes would be a small lie about the information.
 *
 * What differs is the payload and therefore the emphasis:
 *   JobCard         → salary and an Apply CTA, because the decision is ahead
 *   ApplicationCard → status and when it was sent, because the decision is
 *                     someone else's now and the only useful action is to look
 *
 * Fields come from mapApplicationFromApi and no others:
 *   { id, jobId, title, location, logo, status, dateText, appliedAt }
 * There is no salary, no employmentType and no statusLabel on this payload —
 * StatusBadge derives its own label from `status`.
 */
export function ApplicationCard({ application, onWithdraw }) {
  const logo = toMediaUrl(application.logo);
  const href = application.jobId
    ? jobHref({ id: application.jobId, title: application.title })
    : null;

  /* Stretched link, same pattern as JobCard: the title is the one real link and
     its ::after covers the whole tile. Withdraw stays clickable because it sits
     above the overlay, rather than being nested inside a link. */
  const title = href ? (
    <Link
      href={href}
      className="after:absolute after:inset-0 after:content-[''] hover:text-primary"
    >
      {application.title}
    </Link>
  ) : (
    application.title
  );

  return (
    <Card radius="lg" padding="none" className="relative flex h-full flex-col overflow-hidden">
      <div className="flex aspect-[16/9] max-h-44 w-full items-center justify-center border-b border-line-soft bg-primary-light">
        {logo ? (
          <Image
            src={logo}
            alt=""
            width={160}
            height={160}
            className="max-h-[55%] w-auto max-w-[60%] object-contain"
          />
        ) : (
          <Icon name="briefcase" size={36} className="text-primary-accent opacity-40" />
        )}
      </div>

      {/* NOT relative — Card is the positioned ancestor, so the title's
          stretched ::after covers the whole tile including the image band. */}
      <div className="flex flex-1 flex-col p-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <h3 className="line-clamp-2 min-w-0 text-[15px] leading-[18px] font-bold text-heading">
            {title}
          </h3>
          {/* Status takes the reserved top-right slot that JobCard gives to
              save, so the two card types scan identically in a grid. */}
          <div className="h-fit">
            <StatusBadge status={application.status} />
          </div>
        </div>

        <div className="mt-auto pt-3">
          {application.location ? (
            <p className="flex min-w-0 items-center gap-1 text-sm text-body">
              <Icon name="map-marker-alt" size={11} className="shrink-0" />
              <span className="truncate">{application.location}</span>
            </p>
          ) : null}

          {application.dateText ? (
            <p className="mt-1 text-sm text-hint">{application.dateText}</p>
          ) : null}

          {/* "View job" is gone: the whole card now navigates there, and a
              second link to the same place is one more thing for a screen
              reader to announce and one more tab stop for no gain. */}
          {onWithdraw ? (
            <button
              type="button"
              onClick={() => onWithdraw(application)}
              className="press relative z-10 mt-3 w-full rounded-xl border-[1.5px] border-line-input px-4 py-2 text-xs font-bold text-body"
            >
              Withdraw
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export default ApplicationCard;
