import Link from "next/link";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { StatusBadge } from "./Badge";
import { CardMediaHeader } from "./CardMediaHeader";
import { jobHref } from "@/lib/jobUrl";

export function ApplicationCard({ application, onWithdraw }) {
  const href = application.jobId
    ? jobHref({ id: application.jobId, title: application.title })
    : null;

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
      <CardMediaHeader logoSrc={application.logo} title={application.title} companyName={application.companyName} />

      <div className="flex flex-1 flex-col p-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <h3 className="line-clamp-2 min-w-0 text-[15px] leading-[18px] font-bold text-heading">
            {title}
          </h3>
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

          <div className="mt-3">
            {onWithdraw ? (
              <button
                type="button"
                onClick={() => onWithdraw(application)}
                className="press relative z-10 w-full cursor-pointer rounded-xl border-[1.5px] border-line-input px-4 py-2 text-xs font-bold text-body transition-colors hover:border-danger hover:bg-danger-light/30 hover:text-danger"
              >
                Withdraw Application
              </button>
            ) : (
              href ? (
                <Link
                  href={href}
                  className="relative z-10 flex w-full items-center justify-center gap-1 rounded-xl border border-primary/20 bg-primary-light px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  View Details
                  <Icon name="arrow-right" size={10} />
                </Link>
              ) : (
                <span className="flex w-full items-center justify-center rounded-xl bg-canvas px-4 py-2 text-xs font-medium text-hint">
                  Details unavailable
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}


export default ApplicationCard;
