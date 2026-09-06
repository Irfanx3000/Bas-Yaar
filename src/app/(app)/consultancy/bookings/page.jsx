"use client";

/* My Bookings — the app's ConsultancyBookingsScreen.
 *
 * Contract: useConsultancyBookings → { bookings, isLoading, isRefreshing,
 * handleRefresh }. No pagination on purpose — its own comment says a user's
 * consultancy history is a handful of sessions, so it fetches 50 in one go.
 *
 * booking → { id, topic, requirement, status, adminNote, slot: { id, date,
 *             startTime, endTime }, createdAt, statusUpdatedAt }
 *
 * A BOOKING ONLY EXISTS ONCE PAYMENT IS CONFIRMED (backend `activateBooking`),
 * which is why useConsultancy checks this very list to decide whether a failed
 * Razorpay callback actually failed. So everything here is paid for; `status` is
 * about the admin confirming the slot, not about the money.
 *
 * `adminNote` is where the meeting link lands once confirmed — the app labels it
 * "Meeting Details", and it is the reason to come back to this page at all.
 */

import Link from "next/link";
import { useConsultancyBookings } from "@/hooks/useConsultancyBookings";
import { formatDate } from "@/utils/format";
import { formatTime12h } from "@/lib/time";
import { t } from "@/i18n";
import { Button, Card, EmptyState, Icon, LoadingState, StatusBadge } from "@/components/ui";

const TOPIC_LABEL_KEYS = {
  career_guidance: "consultancy.topics.career_guidance",
  resume_review: "consultancy.topics.resume_review",
  interview_prep: "consultancy.topics.interview_prep",
  visa_support: "consultancy.topics.visa_support",
  sea_time: "consultancy.topics.sea_time",
};

/* The model's own enum. StatusBadge already knows these three keys and maps
   awaiting_confirmation → the amber "Under Review" treatment, confirmed → green,
   rejected → red, so only the LABEL is supplied here. */
const STATUS_LABEL_KEYS = {
  awaiting_confirmation: "consultancy.myBookings.status.awaitingConfirmation",
  confirmed: "consultancy.myBookings.status.confirmed",
  rejected: "consultancy.myBookings.status.rejected",
};

function BookingCard({ booking }) {
  const slot = booking.slot;

  return (
    <Card radius="md" className="mb-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-md font-bold text-heading">
          {t(TOPIC_LABEL_KEYS[booking.topic], { defaultValue: booking.topic })}
        </p>
        <StatusBadge
          status={booking.status}
          label={t(STATUS_LABEL_KEYS[booking.status], { defaultValue: booking.status })}
        />
      </div>

      <p className="mt-2 flex items-center gap-2 text-sm text-body">
        <Icon name="calendar-alt" size={12} className="shrink-0" />
        {formatDate(slot?.date)} · {formatTime12h(slot?.startTime)}–{formatTime12h(slot?.endTime)}
      </p>

      {booking.requirement ? (
        <p className="mt-1.5 text-sm whitespace-pre-line text-body">{booking.requirement}</p>
      ) : null}

      {booking.adminNote ? (
        <div className="mt-3 rounded-md bg-primary-light p-3">
          <p className="text-xs font-semibold text-primary">{t("consultancy.myBookings.meetingDetails")}</p>
          {/* The meeting link arrives as plain text in the note, so it is shown
              as written rather than parsed into an anchor — a wrong guess about
              what is a link in an admin's free text is worse than none. */}
          <p className="mt-1 text-sm whitespace-pre-line text-heading">{booking.adminNote}</p>
        </div>
      ) : null}

      {booking.status === "rejected" ? (
        <p className="mt-2 text-sm text-danger">{t("consultancy.myBookings.rejectedNotice")}</p>
      ) : null}
    </Card>
  );
}

export default function ConsultancyBookingsPage() {
  const { bookings, isLoading } = useConsultancyBookings();

  return (
    <div className="mx-auto max-w-3xl px-[15px] pb-8 lg:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3 pt-2 pb-4">
        <h1 className="text-h2 font-extrabold text-heading">{t("consultancy.myBookings.screenTitle")}</h1>
        <Link href="/consultancy" className="shrink-0">
          <Button variant="outline" size="sm" icon="calendar-alt">
            Book a session
          </Button>
        </Link>
      </header>

      {isLoading ? (
        <LoadingState rows={3} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="calendar-alt"
          title={t("consultancy.myBookings.emptyTitle")}
          message={t("consultancy.myBookings.emptySubtitle")}
          action={
            <Link href="/consultancy">
              <Button>Book a session</Button>
            </Link>
          }
        />
      ) : (
        bookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
      )}
    </div>
  );
}
