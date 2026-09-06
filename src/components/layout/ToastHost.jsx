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
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end"
    >
      {toasts.map((toast) => {
        const [bg, fg, icon] = TONE[toast.tone] ?? TONE.success;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-pill px-4 py-2.5 shadow-lg ${bg} ${fg} motion-safe:animate-[toast-in_180ms_var(--ease-decelerate)]`}
          >
            <Icon name={toast.icon || icon} size={15} className="shrink-0" />
            <span className="text-md font-semibold">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export default ToastHost;
