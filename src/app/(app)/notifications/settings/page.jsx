"use client";

/* Notification Settings — the app's NotificationSettingsScreen.
 *
 * Two values, one save: how long a notification stays before it auto-hides
 * (5/10/15 days) and whether push is on. Both come from and go back to
 * `notificationService.get/updateNotificationSettings`, which is already
 * mirrored — nothing here is invented.
 *
 * THE PUSH TOGGLE IS REAL ON THE WEB even though this build sends no push. The
 * field is `pushNotificationsEnabled` on the User document, and
 * `notifyEligibleUsersForJob` selects it explicitly when it fans out a new job
 * to devices. So turning it off here silences the phone. Its hint already says
 * the right thing — notifications still appear in the list either way — so it
 * needs no web-specific caveat.
 *
 * The app navigates back on a successful save. There is no back stack to pop on
 * the web, so it confirms with a toast and stays put; nothing is lost by
 * remaining on a form whose values are now the saved ones.
 *
 * No effect syncing the fetch into state: the load is kicked off once in a mount
 * effect and the setState happens in the promise callback, which is the
 * cascading-render rule's own carve-out. `saved` tracks whether the form still
 * matches what the server holds, so Save can be disabled when there is nothing
 * to save.
 */

import { useEffect, useState } from "react";
import { notificationService } from "@/services/notification.service";
import { showToast } from "@/utils/toastRef";
import { t } from "@/i18n";
import { Button, Card, Icon, InlineAlert, LoadingState } from "@/components/ui";

const EXPIRY_OPTIONS = [5, 10, 15];

export default function NotificationSettingsPage() {
  const [form, setForm] = useState(null); // null until loaded — never a guessed default
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    notificationService
      .getNotificationSettings()
      .then((settings) => {
        if (cancelled) return;
        setForm(settings);
        setSaved(settings);
      })
      .catch(() => {
        if (cancelled) return;
        /* Falls back to the server's own defaults rather than leaving a dead
           screen — the user can still set and save a value from here. */
        const fallback = { notificationExpiryDays: 10, pushNotificationsEnabled: true };
        setForm(fallback);
        setSaved(null);
        setError(t("notifications.settingsScreen.loadError"));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const dirty =
    !!form &&
    (!saved ||
      form.notificationExpiryDays !== saved.notificationExpiryDays ||
      form.pushNotificationsEnabled !== saved.pushNotificationsEnabled);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      const result = await notificationService.updateNotificationSettings(form);
      setForm(result);
      setSaved(result);
      showToast({ message: "Notification settings saved", tone: "success", icon: "bell" });
    } catch {
      setError(t("notifications.settingsScreen.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-[15px] pb-8 lg:px-6">
      <header className="pt-2 pb-4">
        <h1 className="text-h2 font-extrabold text-heading">{t("notifications.settingsScreen.title")}</h1>
        <p className="mt-[2px] text-md text-body">{t("notifications.settingsScreen.subtitle")}</p>
      </header>

      {!form ? (
        <LoadingState rows={2} />
      ) : (
        <>
          {error ? (
            <InlineAlert tone="error" className="mb-3">
              {error}
            </InlineAlert>
          ) : null}

          <Card radius="lg">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="min-w-0">
                <span className="block text-md font-medium text-heading">
                  {t("notifications.settingsScreen.pushToggleLabel")}
                </span>
                <span className="mt-[2px] block text-sm text-body">
                  {t("notifications.settingsScreen.pushToggleHint")}
                </span>
              </span>

              {/* A real checkbox styled as a switch, not a div with a click
                  handler — it is focusable, toggles with Space, and announces
                  its state without any aria plumbing. */}
              <input
                type="checkbox"
                role="switch"
                checked={form.pushNotificationsEnabled}
                onChange={(e) => setForm((prev) => ({ ...prev, pushNotificationsEnabled: e.target.checked }))}
                className="peer sr-only"
              />
              <span className="relative h-6 w-11 shrink-0 rounded-pill bg-line transition-colors duration-[180ms] ease-standard peer-checked:bg-primary-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary after:absolute after:top-[3px] after:left-[3px] after:size-[18px] after:rounded-round after:bg-white after:shadow-sm after:transition-transform after:duration-[180ms] after:ease-standard peer-checked:after:translate-x-5" />
            </label>
          </Card>

          <p className="mt-5 mb-2 text-md font-medium text-heading">
            {t("notifications.settingsScreen.expiryLabel")}
          </p>

          <div className="flex flex-wrap gap-2">
            {EXPIRY_OPTIONS.map((days) => {
              const selected = form.notificationExpiryDays === days;

              return (
                <button
                  key={days}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setForm((prev) => ({ ...prev, notificationExpiryDays: days }))}
                  className={`flex cursor-pointer items-center gap-2 rounded-pill border px-5 py-2.5 text-md font-medium transition-colors duration-[180ms] ease-standard ${
                    selected
                      ? "border-primary bg-primary-light text-heading"
                      : "border-line-input bg-surface text-body hover:text-heading"
                  }`}
                >
                  {selected ? <Icon name="check" size={12} /> : null}
                  {t("notifications.settingsScreen.daysOption", { count: days })}
                </button>
              );
            })}
          </div>

          <Button className="mt-6" onClick={handleSave} loading={isSaving} disabled={!dirty} icon="check">
            {t("notifications.settingsScreen.save")}
          </Button>
        </>
      )}
    </div>
  );
}
