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
      className={`w-full max-w-none rounded-t-xl bg-surface p-0 shadow-lg backdrop:bg-black/40 sm:rounded-xl ${width}
                  m-0 mt-auto sm:m-auto`}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        {title ? <h2 className="text-xl font-bold text-heading">{title}</h2> : <span />}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mt-1 -mr-1 cursor-pointer rounded-round p-2 text-hint hover:bg-canvas hover:text-heading"
        >
          <Icon name="times" size={16} />
        </button>
      </div>

      <div className="px-4 py-3 text-md text-body">{children}</div>

      {footer ? <div className="flex justify-end gap-2 px-4 pb-4">{footer}</div> : null}
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
