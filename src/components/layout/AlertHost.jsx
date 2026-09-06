"use client";

import { useEffect, useState } from "react";
import { setAlertHost } from "@/utils/alertRef";
import { Button, Icon, Modal } from "@/components/ui";

/* Renders the app's global alerts.
 *
 * `utils/alertRef.js` is a host-ref pattern — showAlert() writes to a module
 * ref so code OUTSIDE React can raise a dialog: the axios interceptor in
 * api/client.js does it on a blocked account, and useSubscription does it for
 * PAYMENT_ALREADY_MADE, ALREADY_SUBSCRIBED and PAYMENTS_NOT_CONFIGURED.
 *
 * Until now nothing registered as the host on the web, and `hostRef.current?.show`
 * simply no-oped — so every one of those messages was silently swallowed. The
 * copied hooks looked like they handled their errors and, on the web, did not.
 *
 * Config shape is alertRef's own:
 *   { type: 'success'|'error'|'warning'|'info', title, message,
 *     buttons?: [{ text, onPress?, style: 'default'|'cancel'|'destructive' }],
 *     dismissible? }
 */

const TONE = {
  success: ["bg-success-light", "text-success", "check-circle"],
  error: ["bg-danger-light", "text-danger", "exclamation-circle"],
  warning: ["bg-warning-light", "text-warning-text", "exclamation-triangle"],
  info: ["bg-info-light", "text-info-text", "info-circle"],
};

export function AlertHost() {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    setAlertHost({
      show: (config) => setAlert(config),
      hide: () => setAlert(null),
    });
    return () => setAlertHost(null);
  }, []);

  if (!alert) return null;

  const [bg, fg, icon] = TONE[alert.type] ?? TONE.info;
  const dismissible = alert.dismissible !== false;
  const close = () => setAlert(null);

  const buttons = alert.buttons?.length
    ? alert.buttons
    : [{ text: "OK", style: "default" }];

  return (
    <Modal
      open
      size="sm"
      /* A non-dismissible alert still needs SOME way out or it is a trap, so
         its buttons are the only exit — onClose is wired to nothing. */
      onClose={dismissible ? close : () => {}}
      title={alert.title}
      footer={buttons.map((button, i) => (
        <Button
          key={button.text ?? i}
          variant={button.style === "cancel" ? "text" : "solid"}
          tone={button.style === "destructive" ? "danger" : "primary"}
          onClick={() => {
            close();
            button.onPress?.();
          }}
        >
          {button.text}
        </Button>
      ))}
    >
      <div className="flex gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-round ${bg} ${fg}`}>
          <Icon name={alert.icon || icon} size={18} />
        </span>
        <p className="min-w-0 flex-1 text-md whitespace-pre-line text-body">{alert.message}</p>
      </div>
    </Modal>
  );
}

export default AlertHost;
