"use client";

/* Renders transient toasts raised through utils/toastRef.
 *
 * Bottom-centre on a phone, bottom-right from `sm` up — out of the thumb's way
 * on mobile and out of the content's way on a desktop. `pointer-events-none` on
 * the stack so a toast never eats a click meant for the page underneath; the
 * dismiss button re-enables them for itself only.
 *
 * Toasts stack rather than replace. Bookmarking three jobs quickly should show
 * three confirmations, not one that keeps resetting its own timer — but the
 * stack is capped so a stuck loop cannot fill the screen.
 *
 * aria-live="polite" rather than "assertive": this is a confirmation, and it
 * should wait for a screen reader to finish its sentence rather than cut in.
 */

import { useEffect, useRef, useState } from "react";
import { setToastHost } from "@/utils/toastRef";
import { Icon } from "@/components/ui";

const DURATION = 2600;
const MAX_VISIBLE = 3;

const TONE = {
  success: ["bg-success", "text-white", "check-circle"],
  error: ["bg-danger", "text-white", "exclamation-circle"],
  info: ["bg-heading", "text-white", "info-circle"],
};

export function ToastHost() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Set());

  useEffect(() => {
    let nextId = 0;

    const remove = (id) => setToasts((prev) => prev.filter((toast) => toast.id !== id));

    setToastHost({
      show: (config) => {
        const id = ++nextId;
        setToasts((prev) => [...prev, { id, ...config }].slice(-MAX_VISIBLE));
        const timer = setTimeout(() => {
          timers.current.delete(timer);
          remove(id);
        }, DURATION);
        timers.current.add(timer);
      },
      hide: () => setToasts([]),
    });

    /* Every pending timer is cleared on unmount — a fired timeout calling
       setState on an unmounted host is a leak, and in a hot-reloading dev
       session it fires constantly. */
    const pending = timers.current;
    return () => {
      setToastHost(null);
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      /* Below `lg` the bottom nav is itself `fixed bottom-4`, so a toast at
         bottom-4 lands directly on top of it and covers the tab a user is
         reaching for. It clears the nav on small screens and drops back down
         once the nav is gone. z-50 keeps it above the nav's z-40 either way. */
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end lg:bottom-6"
    >
      {toasts.map((toast) => {
        const [bg, fg, icon] = TONE[toast.tone] ?? TONE.success;

        return (
          <div
            key={toast.id}
            /* max-w-sm alone overflows a 320px screen — 24rem is wider than the
               viewport minus the stack's own padding — so it is capped at the
               available width first. rounded-xl rather than pill because a long
               message wraps to two lines, and a pill around two lines looks
               like a mistake. */
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl px-4 py-2.5 shadow-lg sm:w-auto ${bg} ${fg} motion-safe:animate-[toast-in_180ms_var(--ease-decelerate)]`}
          >
            <Icon name={toast.icon || icon} size={15} className="shrink-0" />
            <span className="min-w-0 text-md font-semibold break-words">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export default ToastHost;
