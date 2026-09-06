"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";

/* Behaviour lifted from the admin panel's Modal (focus trap, escape, scroll
 * lock, backdrop click), restyled entirely to the app.
 *
 * Responsive shape, per the plan: a centred dialog from `sm` up, a bottom sheet
 * below it — which is what the app's AppBottomSheet does on a phone. Same
 * component, so screens do not branch.
 *
 * Built on <dialog> rather than a div-plus-portal: the browser gives focus
 * trapping, escape handling, inertness of the page behind, and top-layer
 * stacking for free, which is most of what a modal library sells.
 */
export function Modal({ open, onClose, title, children, footer, size = "md" }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  /* Scroll lock. The dialog itself is inert-safe, but the page behind still
     scrolls under it on touch without this. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const width = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-2xl" }[size] ?? "sm:max-w-md";

  return (
    <dialog
      ref={ref}
      /* `cancel` fires on Escape; both paths route through onClose so the
         parent's state can never drift out of sync with the DOM. */
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
      onClose={() => onClose?.()}
      onClick={(e) => {
        // Backdrop click: the dialog element itself is the backdrop, so a click
        // whose target IS the dialog (not its content) means outside.
        if (e.target === ref.current) onClose?.();
      }}
      /* Height is CAPPED and the BODY scrolls, not the dialog.
         A dialog with no cap grows past the viewport and the browser's own
         max-height then clips it — the Personal Info form and a long Terms
         section both lose their footer that way, and the Save button with it.
         So: a flex column with a bounded height, a header and footer that stay
         put, and one scroll container between them.

         `dvh`, not `vh` — on mobile Safari and Chrome `vh` is the tallest the
         viewport ever gets, so a modal sized in vh sits partly under the URL
         bar until you scroll. 90dvh follows the visible area instead.

         `overscroll-contain` stops a scroll that reaches the body's end from
         chaining to the page behind the backdrop. */
      className={`m-0 mt-auto flex max-h-[90dvh] w-full max-w-none flex-col overflow-hidden rounded-t-xl
                  bg-surface p-0 shadow-lg backdrop:bg-black/40 sm:m-auto sm:max-h-[85dvh] sm:rounded-xl ${width}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-4">
        {title ? <h2 className="min-w-0 text-xl font-bold break-words text-heading">{title}</h2> : <span />}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mt-1 -mr-1 shrink-0 cursor-pointer rounded-round p-2 text-hint hover:bg-canvas hover:text-heading"
        >
          <Icon name="times" size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 text-md text-body">
        {children}
      </div>

      {/* Buttons stack below 380px or so — two side by side with real labels
          ("Cancel" / "Save Changes") overflow a 320px sheet otherwise. Reversed
          when stacked so the primary action stays closest to the thumb. */}
      {footer ? (
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line-soft px-4 py-3 min-[380px]:flex-row min-[380px]:justify-end min-[380px]:border-t-0 min-[380px]:pt-0">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}

/* The "are you sure" case, which is most modal usage. Destructive actions get
 * the danger tone; everything else stays primary. */
export function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button tone={destructive ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message}
    </Modal>
  );
}
