"use client";

/* Book a Live Meeting — the app's ConsultancyScreen.
 *
 * ── The flow is TWO steps, and the split is deliberate ──────────────────────
 * Step 1 collects topic + date + time + requirement, then calls `createOrder`,
 * which RESERVES the slot and creates the Razorpay order. Step 2 shows what was
 * reserved and is the only place checkout opens.
 *
 * That is not decoration. `createOrder` holds the slot for SLOT_HOLD_TTL_MS
 * (15 minutes, deliberately the same constant as an abandoned subscription
 * checkout), so a user who reviews and walks away just has the hold swept. And
 * a cancelled or failed payment stays on step 2 against the SAME reservation, so
 * retrying does not mean re-entering everything or grabbing a second slot.
 *
 * ── Things that look like edge cases and are not ────────────────────────────
 *  · PAYMENT_ALREADY_MADE from createOrder — a previous attempt went through.
 *    Success, not an error; the user is sent to My Bookings.
 *  · SLOT_NOT_AVAILABLE — someone booked it in between. Clears the time and
 *    RELOADS that date's slots, because the stale list is exactly what caused it.
 *  · A checkout error is not proof the payment failed. `wasSlotBooked` re-reads
 *    the user's latest booking; a booking only exists once payment is confirmed
 *    (backend `activateBooking`), so its presence settles the question.
 *  · A verify() failure is not proof either — the webhook is authoritative.
 *
 * All of that lives in `useConsultancy`, mirrored verbatim. This page supplies
 * the navigation adapter it expects and renders its state.
 *
 * ── Web differences ─────────────────────────────────────────────────────────
 *  · The topic picker is an inline listbox (the kit's Select) rather than the
 *    app's searchable bottom sheet. Five fixed options do not need a search box
 *    on a screen with a keyboard.
 *  · Replacing the resume is one file input; the app needs a document-picker
 *    module. `accept` is PDF, matching the resume document type's own rule.
 *  · Preview opens the tokened view URL in a new tab instead of a PDF modal.
 */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConsultancy } from "@/hooks/useConsultancy";
import { documentsService } from "@/services/documents.service";
import { formatCurrency, formatDate } from "@/utils/format";
import { formatTime12h } from "@/lib/time";
import { showAlert } from "@/utils/alertRef";
import { t } from "@/i18n";
import { Button, Card, Icon, LoadingState, Select } from "@/components/ui";

const TOPIC_VALUES = ["career_guidance", "resume_review", "interview_prep", "visa_support", "sea_time"];

/* Sunday-first, matching buildCalendarCells' `new Date(...).getDay()` where
   0 is Sunday. Keys are the backend's own WEEKDAY_KEYS spelling — note
   "thurs", not "thu". */
const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thurs", "fri", "sat"];

function Stepper({ step }) {
  const dot = (n, label) => (
    <span className="flex items-center gap-2">
      <span
        className={`flex size-7 items-center justify-center rounded-round text-sm font-bold ${
          step >= n ? "bg-primary text-on-primary" : "bg-line text-hint"
        }`}
      >
        {n}
      </span>
      <span className={`text-md font-semibold ${step >= n ? "text-heading" : "text-hint"}`}>{label}</span>
    </span>
  );

  return (
    <div className="mb-5 flex items-center gap-3">
      {dot(1, t("consultancy.steps.booking"))}
      <span className={`h-[2px] w-10 rounded-pill ${step >= 2 ? "bg-primary" : "bg-line"}`} />
      {dot(2, t("consultancy.steps.payment"))}
    </div>
  );
}

function ReviewRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft py-2 last:border-b-0">
      <span className="shrink-0 text-sm text-hint">{label}</span>
      <span className="min-w-0 text-right text-md font-medium break-words text-heading">{value}</span>
    </div>
  );
}

export default function ConsultancyPage() {
  const router = useRouter();
  const resumeInputRef = useRef(null);

  /* The hook calls navigation.navigate(ROUTES.CONSULTANCY_BOOKINGS) from inside
     an alert button, on every success path. Only that one destination is ever
     used, so the adapter is this small. */
  const navigationAdapter = useMemo(
    () => ({
      navigate: () => router.push("/consultancy/bookings"),
      replace: () => router.replace("/consultancy/bookings"),
      goBack: () => router.back(),
    }),
    [router],
  );

  const hook = useConsultancy(navigationAdapter);
  const [openingResume, setOpeningResume] = useState(false);

  const topicOptions = TOPIC_VALUES.map((value) => ({ value, label: t(`consultancy.topics.${value}`) }));
  const selectedTopicLabel = hook.selectedTopic ? t(`consultancy.topics.${hook.selectedTopic}`) : null;
  const feeLabel = hook.fee ? formatCurrency(hook.fee.amount, hook.fee.currency) : null;

  const handleViewResume = async () => {
    if (!hook.resume?._id) {
      showAlert({ type: "info", title: t("consultancy.noResumeTitle"), message: t("consultancy.noResumeBody") });
      return;
    }
    setOpeningResume(true);
    try {
      /* The same short-lived, single-document view token the Documents screen
         uses — the server stopped serving these as static files. */
      const url = await documentsService.getViewUrl(hook.resume._id);
      window.open(url, "_blank", "noopener");
    } catch {
      showAlert({ type: "error", title: t("documents.alerts.couldNotOpenTitle"), message: "" });
    } finally {
      setOpeningResume(false);
    }
  };

  const handleResumeFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // so the same file can be re-picked after a failure
    if (file) hook.handleReplaceResume(file);
  };

  // ── Step 2 ─────────────────────────────────────────────────────────────────
  if (hook.stepperStep === 2 && hook.reviewOrder) {
    const order = hook.reviewOrder;
    const amount = formatCurrency(order.amount, order.currency);

    return (
      <div className="mx-auto max-w-2xl px-[15px] pb-8 lg:px-6">
        <header className="pt-2 pb-4">
          <h1 className="text-h2 font-extrabold text-heading">{t("consultancy.review.title")}</h1>
        </header>

        <Stepper step={2} />

        <Card radius="lg">
          <ReviewRow label={t("consultancy.review.topic")} value={selectedTopicLabel} />
          <ReviewRow label={t("consultancy.review.date")} value={formatDate(order.date)} />
          <ReviewRow
            label={t("consultancy.review.time")}
            value={`${formatTime12h(order.startTime)} - ${formatTime12h(order.endTime)}`}
          />
          <ReviewRow
            label={t("consultancy.review.resume")}
            value={hook.resume ? hook.resume.originalName : t("consultancy.review.resumeNotAttached")}
          />
          <ReviewRow label={t("consultancy.review.requirement")} value={hook.requirement} />

          <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line-soft pt-3">
            <span className="text-md font-semibold text-heading">{t("consultancy.review.sessionFee")}</span>
            {/* The order's OWN amount, not the fee preview — the server priced
                this reservation and that is what will be charged. */}
            <span className="text-h3 font-extrabold text-primary">{amount}</span>
          </div>
        </Card>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
          <Button fullWidth loading={hook.isBooking} onClick={hook.handlePayNow} icon="check-circle">
            {t("consultancy.review.payButton", { amount })}
          </Button>
          <Button fullWidth variant="outline" disabled={hook.isBooking} onClick={hook.handleBackFromReview}>
            {t("consultancy.review.editDetails")}
          </Button>
        </div>

        <p className="mt-3 text-center text-sm text-hint">{t("consultancy.calendarInviteNotice")}</p>
      </div>
    );
  }

  // ── Step 1 ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-[15px] pb-8 lg:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3 pt-2 pb-4">
        <div className="min-w-0">
          <h1 className="text-h2 font-extrabold text-heading">{t("consultancy.headerTitle")}</h1>
          <p className="mt-[2px] text-md whitespace-pre-line text-body">{t("consultancy.headerSubtitle")}</p>
        </div>
        <Link href="/consultancy/bookings" className="shrink-0">
          <Button variant="outline" size="sm" icon="calendar-check">
            {t("consultancy.myBookingsLink")}
          </Button>
        </Link>
      </header>

      <Stepper step={1} />

      {/* Shown before anything is filled in — the app's own fix for a flow where
          the only way to learn the price was pressing a button that had already
          reserved a slot. */}
      {feeLabel ? (
        <p className="mb-4 flex items-center gap-2 rounded-md bg-primary-light px-4 py-3 text-md font-semibold text-primary">
          <Icon name="info-circle" size={15} className="shrink-0" />
          {t("consultancy.priceNotice", { amount: feeLabel })}
        </p>
      ) : null}

      <Card radius="lg" className="mb-4">
        <Select
          label={t("consultancy.selectTopic")}
          placeholder={t("consultancy.selectTopicPlaceholder")}
          options={topicOptions}
          value={hook.selectedTopic ?? ""}
          onChange={hook.setSelectedTopic}
          required
        />
      </Card>

      <Card radius="lg" className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => hook.handleMonthChange(-1)}
            disabled={!hook.canGoPrevMonth}
            aria-label="Previous month"
            className="flex size-9 cursor-pointer items-center justify-center rounded-round text-heading hover:bg-canvas-top disabled:cursor-not-allowed disabled:text-line"
          >
            <Icon name="chevron-left" size={13} />
          </button>
          <p className="text-md font-bold text-heading">{hook.monthLabel}</p>
          <button
            type="button"
            onClick={() => hook.handleMonthChange(1)}
            aria-label="Next month"
            className="flex size-9 cursor-pointer items-center justify-center rounded-round text-heading hover:bg-canvas-top"
          >
            <Icon name="chevron-right" size={13} />
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_KEYS.map((key) => (
            <span key={key} className="py-1 text-xs font-semibold text-hint">
              {t(`consultancy.weekdays.${key}`)}
            </span>
          ))}

          {/* Availability is the backend's answer for the month in view — which
              dates have at least one unbooked slot. A date with none is not
              merely unselected, it is not a button at all. */}
          {hook.calendarCells.map((cell) => {
            if (!cell.isCurrentMonth) return <span key={cell.key} aria-hidden="true" />;

            const selected = hook.selectedDate === cell.dateStr;

            return (
              <button
                key={cell.key}
                type="button"
                disabled={!cell.isAvailable}
                aria-pressed={selected}
                onClick={() => hook.handleSelectDate(cell.dateStr)}
                className={`aspect-square cursor-pointer rounded-md text-md font-semibold transition-colors duration-[180ms] ease-standard ${
                  selected
                    ? "bg-primary text-on-primary"
                    : cell.isAvailable
                      ? "bg-primary-light text-primary hover:bg-primary-tint"
                      : "cursor-not-allowed text-line"
                }`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        {hook.isLoadingAvailability ? (
          <p className="mt-2 text-center text-sm text-hint">Loading availability…</p>
        ) : null}
      </Card>

      <Card radius="lg" className="mb-4">
        <p className="text-md font-bold text-heading">{t("consultancy.selectTimeSlot")}</p>

        {!hook.selectedDate ? (
          <p className="mt-2 text-sm text-body">{t("consultancy.selectDateFirst")}</p>
        ) : hook.isLoadingSlots ? (
          <LoadingState rows={1} />
        ) : hook.slots.length === 0 ? (
          <p className="mt-2 text-sm text-body">{t("consultancy.noSlotsForDate")}</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Slots carry no id — one only becomes a real row once booked, which
                is why the start time is the key and the value the hook wants. */}
            {hook.slots.map((slot) => {
              const selected = hook.selectedTime === slot.startTime;

              return (
                <button
                  key={slot.startTime}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => hook.handleSelectSlot(slot.startTime)}
                  className={`cursor-pointer rounded-pill border px-4 py-2 text-md font-semibold transition-colors duration-[180ms] ease-standard ${
                    selected
                      ? "border-primary bg-primary text-on-primary"
                      : "border-line-input bg-surface text-body hover:text-heading"
                  }`}
                >
                  {formatTime12h(slot.startTime)}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card radius="lg" className="mb-4">
        <label htmlFor="requirement" className="text-md font-bold text-heading">
          {t("consultancy.describeRequirement")}
        </label>
        <textarea
          id="requirement"
          rows={4}
          value={hook.requirement}
          onChange={(e) => hook.setRequirement(e.target.value)}
          placeholder={t("consultancy.requirementPlaceholder")}
          className="mt-2 w-full resize-y rounded-md border border-line-input bg-surface px-4 py-3 text-md text-heading outline-none placeholder:text-hint focus:border-primary"
        />
      </Card>

      <Card radius="lg" className="mb-4">
        <p className="text-md font-bold text-heading">{t("consultancy.attachedResume")}</p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
            <Icon name="file-alt" size={16} />
          </span>

          <span className="min-w-0 flex-1">
            {hook.isLoadingResume ? (
              <span className="text-sm text-hint">Loading…</span>
            ) : hook.resume ? (
              <>
                <span className="block truncate text-md font-semibold text-heading">
                  {hook.resume.originalName}
                </span>
                <span className="block text-sm text-hint">
                  {t("consultancy.uploadedOn", {
                    date: new Date(hook.resume.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }),
                  })}
                </span>
              </>
            ) : (
              <span className="text-md text-hint">{t("consultancy.noResumeUploaded")}</span>
            )}
          </span>

          {hook.resume ? (
            <Button variant="text" size="sm" loading={openingResume} onClick={handleViewResume} icon="eye">
              View
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            loading={hook.isUploadingResume}
            onClick={() => resumeInputRef.current?.click()}
            icon="upload"
          >
            {hook.resume ? t("consultancy.replace") : t("consultancy.upload")}
          </Button>

          {/* PDF only — the `resume` document type's acceptedFileTypes is 'pdf'
              and the server rejects anything else with "Invalid file type." */}
          <input ref={resumeInputRef} type="file" hidden accept="application/pdf" onChange={handleResumeFile} />
        </div>
      </Card>

      <p className="mb-4 text-sm text-hint">{t("consultancy.calendarInviteNotice")}</p>

      <Button fullWidth loading={hook.isBooking} onClick={hook.handleReviewBooking} icon="calendar-check">
        {feeLabel
          ? t("consultancy.reviewBookingWithPrice", { amount: feeLabel })
          : t("consultancy.reviewBooking")}
      </Button>

      <p className="mt-4 text-center text-sm text-body">
        {t("consultancy.needHelp")} <span className="font-bold text-heading">support@jobportal.com</span>
      </p>
    </div>
  );
}
