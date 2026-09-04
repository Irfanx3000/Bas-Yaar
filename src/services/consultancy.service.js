import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Booking DTO (as returned by the API):
// { id, topic, requirement, status, adminNote, resumeDocumentId,
//   slot: { id, date, startTime, endTime }, createdAt, statusUpdatedAt }
export const consultancyService = {
  // month: "YYYY-MM" -> [{ date: "YYYY-MM-DD", hasOpenSlots: true }]
  async getAvailability(month) {
    const { data } = await apiClient.get(ENDPOINTS.CONSULTANCY.AVAILABILITY, { params: { month } });
    return data.data.dates;
  },

  // date: "YYYY-MM-DD" -> [{ startTime, endTime }] — times still unbooked on
  // that date per the admin's recurring weekly schedule. No `id` — a slot is
  // only a real, referenceable row once actually booked (see createOrder).
  async getSlots(date) {
    const { data } = await apiClient.get(ENDPOINTS.CONSULTANCY.SLOTS, { params: { date } });
    return data.data.slots;
  },

  // Read-only price preview -> { amount, currency } — shown up front, before
  // the user fills out the booking form, so it's clear this is paid before
  // they invest any time (previously only surfaced via createOrder's
  // response, i.e. after "Confirm Booking" already reserved a slot).
  async getFee() {
    const { data } = await apiClient.get(ENDPOINTS.CONSULTANCY.FEE);
    return { amount: data.data.amount, currency: data.data.currency };
  },

  // Create (or reuse) a Razorpay order for a chosen date+time. Server
  // computes the amount and re-validates the time against the current
  // schedule — never trust the client's selection blindly.
  async createOrder({ date, startTime, topic, requirement, resumeDocumentId }) {
    const { data } = await apiClient.post(ENDPOINTS.CONSULTANCY.ORDER, {
      date,
      startTime,
      topic,
      requirement: requirement || undefined,
      resumeDocumentId: resumeDocumentId || undefined,
    });
    return data.data; // { orderId, amount, currency, keyId, slotId, date, startTime, endTime }
  },

  // Verify a completed payment (signature-checked server-side) → the created booking.
  async verify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const { data } = await apiClient.post(ENDPOINTS.CONSULTANCY.VERIFY, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    return data.data.booking;
  },

  async getMyBookings(params = {}) {
    const { data } = await apiClient.get(ENDPOINTS.CONSULTANCY.BOOKINGS, { params });
    return { bookings: data.data.bookings, pagination: data.meta?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 } };
  },

  async getMyBookingById(id) {
    const { data } = await apiClient.get(ENDPOINTS.CONSULTANCY.BOOKING_DETAIL(id));
    return data.data.booking;
  },
};
