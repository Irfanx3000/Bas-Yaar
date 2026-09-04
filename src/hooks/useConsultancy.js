import { useState, useCallback, useEffect, useMemo } from 'react';
import RazorpayCheckout from 'react-native-razorpay';
import { useTranslation } from 'react-i18next';
import { consultancyService } from '../services/consultancy.service';
import { resumeService } from '../services/resume.service';
import { useProfile } from '../context/ProfileContext';
import { getErrorMessage } from '../i18n/getErrorMessage';
import { ROUTES } from '../constants/routes.constants';
import { showAlert } from '../utils/alertRef';

const pad2 = (n) => String(n).padStart(2, '0');
const toMonthParam = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const isSameOrLaterMonth = (a, b) => a.getFullYear() > b.getFullYear() || (a.getFullYear() === b.getFullYear() && a.getMonth() >= b.getMonth());

// Builds a flat, Sunday-first grid of calendar cells for one month — leading/
// trailing cells from the adjacent months fill out the first/last week, same
// idea as any calendar picker. Availability comes from the real backend
// (which dates in view have at least one open slot), not a hardcoded mock.
const buildCalendarCells = (viewDate, availableDates) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ key: `prev-${i}`, day: daysInPrevMonth - firstWeekday + 1 + i, isCurrentMonth: false, isAvailable: false, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    cells.push({ key: dateStr, day: d, isCurrentMonth: true, isAvailable: availableDates.has(dateStr), dateStr });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ key: `next-${nextDay}`, day: nextDay, isCurrentMonth: false, isAvailable: false, dateStr: null });
    nextDay += 1;
  }
  return cells;
};

// Was the Razorpay checkout sheet dismissed by the user (vs a real failure)?
const isCancel = (err) => {
  const desc = String(err?.description || err?.reason || err?.error?.description || '').toLowerCase();
  return err?.code === 0 || err?.code === 'PAYMENT_CANCELLED' || desc.includes('cancel');
};

export function useConsultancy(navigation) {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const today = useMemo(() => startOfMonth(new Date()), []);
  const [viewDate, setViewDate] = useState(today);
  const [availableDates, setAvailableDates] = useState(new Set());
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [requirement, setRequirement] = useState('');

  const [resume, setResume] = useState(null);
  const [isLoadingResume, setIsLoadingResume] = useState(true);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const [isBooking, setIsBooking] = useState(false);
  const [stepperStep, setStepperStep] = useState(1);

  // Fetched once on mount so the price is visible before the user fills out
  // anything — previously the only way to learn the amount was tapping
  // "Confirm Booking", which already reserves a slot via createOrder.
  const [fee, setFee] = useState(null);
  const [isLoadingFee, setIsLoadingFee] = useState(true);

  useEffect(() => {
    let cancelled = false;
    consultancyService.getFee()
      .then((result) => { if (!cancelled) setFee(result); })
      .catch(() => { if (!cancelled) setFee(null); })
      .finally(() => { if (!cancelled) setIsLoadingFee(false); });
    return () => { cancelled = true; };
  }, []);

  const loadAvailability = useCallback(async (month) => {
    setIsLoadingAvailability(true);
    try {
      const dates = await consultancyService.getAvailability(toMonthParam(month));
      setAvailableDates(new Set(dates.filter((d) => d.hasOpenSlots).map((d) => d.date)));
    } catch {
      setAvailableDates(new Set());
    } finally {
      setIsLoadingAvailability(false);
    }
  }, []);

  useEffect(() => {
    loadAvailability(viewDate);
  }, [viewDate, loadAvailability]);

  const loadResume = useCallback(async () => {
    setIsLoadingResume(true);
    try {
      const doc = await resumeService.getResume();
      setResume(doc);
    } catch {
      setResume(null);
    } finally {
      setIsLoadingResume(false);
    }
  }, []);

  useEffect(() => {
    loadResume();
  }, [loadResume]);

  const canGoPrevMonth = !isSameOrLaterMonth(today, viewDate);

  const handleMonthChange = useCallback((direction) => {
    setViewDate((prev) => {
      const next = addMonths(prev, direction);
      return isSameOrLaterMonth(next, today) ? next : prev;
    });
    setSelectedDate(null);
    setSlots([]);
    setSelectedTime(null);
  }, [today]);

  const loadSlotsForDate = useCallback(async (dateStr) => {
    setIsLoadingSlots(true);
    try {
      const list = await consultancyService.getSlots(dateStr);
      setSlots(list);
    } catch {
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  const handleSelectDate = useCallback((dateStr) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    loadSlotsForDate(dateStr);
  }, [loadSlotsForDate]);

  const handleSelectSlot = useCallback((startTime) => setSelectedTime(startTime), []);

  const handleReplaceResume = useCallback(async (asset) => {
    setIsUploadingResume(true);
    try {
      const doc = await resumeService.uploadResume(asset);
      setResume(doc);
    } catch (err) {
      showAlert({ type: 'error', title: t('consultancy.alerts.resumeUploadFailedTitle'), message: getErrorMessage(err, t) });
    } finally {
      setIsUploadingResume(false);
    }
  }, [t]);

  // After a Razorpay error, the webhook may have already confirmed the
  // payment before the client heard back — the same class of edge case
  // useSubscription.js guards against. A booking only ever exists once
  // payment is confirmed (see backend's activateBooking), so if the user's
  // most recent booking is for THIS slot, the charge went through.
  const wasSlotBooked = async (slotId) => {
    try {
      const { bookings } = await consultancyService.getMyBookings({ page: 1, limit: 1 });
      return bookings[0]?.slot?.id === slotId;
    } catch {
      return false;
    }
  };

  const [reviewOrder, setReviewOrder] = useState(null);

  const resetSelection = useCallback(() => {
    setSelectedTopic(null);
    setSelectedDate(null);
    setSlots([]);
    setSelectedTime(null);
    setRequirement('');
    setReviewOrder(null);
    setStepperStep(1);
  }, []);

  // Step 1 -> Step 2: reserves the slot and creates (or reuses) the Razorpay
  // order, then hands control to the Review & Pay screen — the Razorpay
  // sheet itself doesn't open here anymore (see handlePayNow). The
  // reservation carries the same abandoned-hold TTL as before, so a user who
  // never proceeds to payment from the review screen just has it released
  // automatically, same as dismissing the old direct-to-Razorpay flow did.
  const handleReviewBooking = useCallback(async () => {
    if (isBooking) return; // guard double-tap

    if (!selectedTopic) {
      showAlert({ type: 'warning', title: t('consultancy.selectionRequired.title'), message: t('consultancy.selectionRequired.message') });
      return;
    }
    if (!selectedDate || !selectedTime) {
      showAlert({ type: 'warning', title: t('consultancy.selectionRequired.title'), message: t('consultancy.alerts.slotRequired') });
      return;
    }
    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
      showAlert({ type: 'warning', title: t('subscription.alerts.updateRequiredTitle'), message: t('subscription.alerts.updateRequiredBody') });
      return;
    }

    setIsBooking(true);
    try {
      const order = await consultancyService.createOrder({
        date: selectedDate,
        startTime: selectedTime,
        topic: selectedTopic,
        requirement: requirement.trim(),
        resumeDocumentId: resume?._id,
      });
      setReviewOrder(order);
      setStepperStep(2);
    } catch (err) {
      const code = err?.data?.code;
      if (code === 'PAYMENT_ALREADY_MADE') {
        showAlert({
          type: 'success',
          title: t('consultancy.alerts.bookedTitle'),
          message: t('consultancy.alerts.paymentAlreadyMade'),
          buttons: [{ text: t('common.ok'), onPress: () => navigation.navigate(ROUTES.CONSULTANCY_BOOKINGS) }],
        });
        resetSelection();
      } else if (code === 'SLOT_NOT_AVAILABLE') {
        showAlert({ type: 'warning', title: t('consultancy.alerts.slotTakenTitle'), message: t('consultancy.alerts.slotTakenBody') });
        setSelectedTime(null);
        if (selectedDate) loadSlotsForDate(selectedDate);
      } else if (code === 'PAYMENTS_NOT_CONFIGURED') {
        showAlert({ type: 'error', title: t('subscription.alerts.unavailableTitle'), message: t('subscription.alerts.unavailableBody') });
      } else {
        showAlert({ type: 'error', title: t('consultancy.alerts.bookingFailedTitle'), message: getErrorMessage(err, t) });
      }
    } finally {
      setIsBooking(false);
    }
  }, [isBooking, selectedTopic, selectedTime, requirement, resume, selectedDate, loadSlotsForDate, resetSelection, navigation, t]);

  // Step 2: the user has reviewed the topic/date/time/price and actually
  // wants to pay — this is where Razorpay Checkout opens. Staying on the
  // review screen (rather than bouncing back to the step-1 form) on a
  // cancelled or failed attempt lets them just retry payment against the
  // same reservation without re-entering everything.
  const handlePayNow = useCallback(async () => {
    if (isBooking || !reviewOrder) return;
    const order = reviewOrder;

    setIsBooking(true);
    try {
      let payment;
      try {
        payment = await RazorpayCheckout.open({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'CrewApply',
          description: t(`consultancy.topics.${selectedTopic}`),
          prefill: {
            email: profile?.email || '',
            contact: String(profile?.phone || '').replace(/^\+/, ''),
            name: profile?.name || '',
          },
          theme: { color: '#056DED' },
        });
      } catch (checkoutErr) {
        if (isCancel(checkoutErr)) return; // user dismissed — stay on the review screen
        if (await wasSlotBooked(order.slotId)) {
          showAlert({
            type: 'success',
            title: t('consultancy.alerts.bookedTitle'),
            message: t('consultancy.alerts.bookedBody'),
            buttons: [{ text: t('common.ok'), onPress: () => navigation.navigate(ROUTES.CONSULTANCY_BOOKINGS) }],
          });
          resetSelection();
          return;
        }
        showAlert({
          type: 'error',
          title: t('consultancy.alerts.paymentFailedTitle'),
          message: checkoutErr?.description || t('consultancy.alerts.paymentFailedBody'),
        });
        return;
      }

      // Verify (fast path). If it fails, the webhook is authoritative.
      try {
        await consultancyService.verify(payment);
      } catch {
        if (!(await wasSlotBooked(order.slotId))) {
          showAlert({ type: 'warning', title: t('consultancy.alerts.almostThereTitle'), message: t('consultancy.alerts.almostThereBody') });
          return;
        }
      }

      showAlert({
        type: 'success',
        title: t('consultancy.alerts.bookedTitle'),
        message: t('consultancy.alerts.bookedBody'),
        buttons: [{ text: t('common.ok'), onPress: () => navigation.navigate(ROUTES.CONSULTANCY_BOOKINGS) }],
      });
      resetSelection();
    } finally {
      setIsBooking(false);
    }
  }, [isBooking, reviewOrder, selectedTopic, profile, resetSelection, navigation, t]);

  // Step 2 -> Step 1: the user wants to change topic/date/time/requirement
  // instead of paying. No cancel-order call — the still-reserved slot just
  // expires via the existing abandoned-hold sweep if never paid for.
  const handleBackFromReview = useCallback(() => {
    setReviewOrder(null);
    setStepperStep(1);
  }, []);

  const calendarCells = useMemo(() => buildCalendarCells(viewDate, availableDates), [viewDate, availableDates]);
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    // fee
    fee,
    isLoadingFee,
    // calendar
    viewDate,
    monthLabel,
    calendarCells,
    canGoPrevMonth,
    handleMonthChange,
    isLoadingAvailability,
    selectedDate,
    handleSelectDate,
    // slots
    slots,
    isLoadingSlots,
    selectedTime,
    handleSelectSlot,
    // topic + requirement
    selectedTopic,
    setSelectedTopic,
    requirement,
    setRequirement,
    // resume
    resume,
    isLoadingResume,
    isUploadingResume,
    handleReplaceResume,
    // booking
    isBooking,
    stepperStep,
    reviewOrder,
    handleReviewBooking,
    handlePayNow,
    handleBackFromReview,
  };
}
