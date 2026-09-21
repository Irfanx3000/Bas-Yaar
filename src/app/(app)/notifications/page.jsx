"use client";

/* Notifications — the app's NotificationScreen.
 *
 * The header bell has always linked here; the route never existed, so it 404'd.
 * Everything underneath was already ported verbatim and needed no changes:
 * notificationService (list / markAsRead / markAllAsRead), NotificationContext
 * (the bell's unread count, polled), and notificationGrouping (today /
 * yesterday / earlier + the "Mon, 12 Sep · 10:30" stamp).
 *
 * Mirrored exactly from the app:
 *  · 20 per page. "Earlier" shows 10, then "View All" expands it and loads the
 *    next page on each tap while pages remain — not infinite scroll.
 *  · Mark as read / Mark all as read are optimistic: the row and the bell's
 *    count update at once, the API call is fire-and-forget.
 *  · Type → icon, and application outcome → colour (rejected red, selected
 *    green, everything in progress blue).
 *  · Tapping a notification about an application opens My Applications.
 *  · The profile-completion prompt pinned under the list until 100%.
 *
 * Web differences: no back chevron (the shell's nav is always there) and no
 * pull-to-refresh (no touch gesture to hang it on — the list loads fresh on
 * every visit, and the bell's count is polled regardless).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notificationService } from "@/services/notification.service";
import { useNotifications } from "@/context/NotificationContext";
import { useProfile } from "@/context/ProfileContext";
import { groupNotifications, formatNotificationTimestamp } from "@/utils/notificationGrouping";
import { t } from "@/i18n";
import { Card, EmptyState, Icon, LoadingState, ProgressBar } from "@/components/ui";

const PAGE_LIMIT = 20;
const EARLIER_PAGE_SIZE = 10;

const TYPE_ICON = {
  APPLICATION_STATUS_CHANGED: "briefcase",
  SUPPORT_INQUIRY_UPDATED: "comment-dots",
  SUBSCRIPTION_EXPIRING: "gem",
};

/* The app's exact pairs. Classes are spelled out in full so Tailwind can see
   them — a class assembled from a hex at runtime would never be generated. */
const STATUS_ACCENT = {
  rejected: "bg-[#FDEAEA] text-[#EC0509]",
  selected: "bg-[#E2F5EB] text-[#12AF68]",
};
const DEFAULT_ACCENT = "bg-[#EFF5FF] text-[#056DED]";

export default function NotificationsPage() {
  const router = useRouter();
  const { refreshUnreadCount, setUnreadCount } = useNotifications();
  const { completion } = useProfile() ?? {};

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [earlierExpanded, setEarlierExpanded] = useState(false);

  /* Loaded once on mount; setState happens in the promise callbacks, never
     synchronously in the effect body. A failed load keeps the empty state
     rather than an error screen — the app swallows it the same way. */
  useEffect(() => {
    let cancelled = false;
    notificationService
      .getNotifications({ page: 1, limit: PAGE_LIMIT })
      .then(({ notifications: items, pagination }) => {
        if (cancelled) return;
        setNotifications(items);
        setTotalPages(pagination?.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    refreshUnreadCount?.();
    return () => {
      cancelled = true;
    };
  }, [refreshUnreadCount]);

  const handleViewAll = async () => {
    setEarlierExpanded(true);
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { notifications: items, pagination } = await notificationService.getNotifications({
        page: nextPage,
        limit: PAGE_LIMIT,
      });
      setNotifications((prev) => [...prev, ...items]);
      setPage(nextPage);
      setTotalPages(pagination?.totalPages || 1);
    } catch {
      // The button stays, so another click retries.
    } finally {
      setLoadingMore(false);
    }
  };

  const markOneAsRead = (notification) => {
    if (notification.read) return;
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
    setUnreadCount?.((prev) => Math.max(0, prev - 1));
    notificationService.markAsRead(notification.id).catch(() => {});
  };

  const handleOpen = (notification) => {
    markOneAsRead(notification);
    if (notification.data?.applicationId) router.push("/applications");
  };

  const handleMarkAllAsRead = () => {
    if (!notifications.some((n) => !n.read)) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount?.(0);
    notificationService.markAllAsRead().catch(() => {});
  };

  const { today, yesterday, earlier } = groupNotifications(notifications);
  const displayedEarlier = earlierExpanded ? earlier : earlier.slice(0, EARLIER_PAGE_SIZE);
  const showViewAll =
    (!earlierExpanded && earlier.length > EARLIER_PAGE_SIZE) || (earlierExpanded && page < totalPages);
  const hasUnread = notifications.some((n) => !n.read);
  const showProfileCard = completion && completion.percentage < 100;

  return (
    <div className="mx-auto max-w-2xl px-[15px] pb-8 lg:px-6">
      <header className="flex items-center justify-between gap-3 pt-2 pb-4">
        <h1 className="text-h2 font-extrabold text-heading">{t("notifications.title")}</h1>
        <Link
          href="/notifications/settings"
          aria-label={t("notifications.settingsScreen.title")}
          title={t("notifications.settingsScreen.title")}
          className="flex size-10 items-center justify-center rounded-round text-heading transition-colors duration-[180ms] ease-standard hover:bg-primary-light hover:text-primary"
        >
          <Icon name="cog" size={16} />
        </Link>
      </header>

      {loading ? (
        <LoadingState rows={4} />
      ) : notifications.length === 0 ? (
        <EmptyState icon="bell-slash" title={t("notifications.empty")} />
      ) : (
        <>
          {hasUnread ? (
            <div className="-mt-2 mb-2 flex justify-end">
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="cursor-pointer text-sm font-bold text-[#056DED] hover:underline"
              >
                {t("notifications.markAllAsRead")}
              </button>
            </div>
          ) : null}

          <Section label={t("notifications.groups.today")} items={today} onOpen={handleOpen} onMarkRead={markOneAsRead} />
          <Section
            label={t("notifications.groups.yesterday")}
            items={yesterday}
            onOpen={handleOpen}
            onMarkRead={markOneAsRead}
          />
          <Section
            label={t("notifications.groups.earlier")}
            items={displayedEarlier}
            onOpen={handleOpen}
            onMarkRead={markOneAsRead}
            footer={
              showViewAll ? (
                <button
                  type="button"
                  onClick={handleViewAll}
                  disabled={loadingMore}
                  className="mx-auto mt-1 flex min-h-9 cursor-pointer items-center justify-center rounded-pill px-5 text-sm font-semibold text-[#056DED] hover:bg-primary-light disabled:cursor-wait"
                >
                  {loadingMore ? (
                    <span
                      aria-label="Loading"
                      className="size-4 animate-spin rounded-round border-2 border-current border-t-transparent"
                    />
                  ) : (
                    t("notifications.viewAll")
                  )}
                </button>
              ) : null
            }
          />
        </>
      )}

      {/* Not a notification — a prompt that stays until the profile is complete. */}
      {showProfileCard ? (
        <Link href="/profile" className="mt-6 block">
          <Card interactive radius="lg">
            <p className="text-md font-bold text-heading">Complete your profile</p>
            {completion.message ? <p className="mt-[2px] text-sm text-body">{completion.message}</p> : null}
            <ProgressBar className="mt-3" value={completion.percentage} label="Profile strength" />
          </Card>
        </Link>
      ) : null}
    </div>
  );
}

function Section({ label, items, onOpen, onMarkRead, footer }) {
  if (!items.length) return null;
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-md font-bold text-heading">{label}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((n) => (
          <NotificationCard key={n.id} notification={n} onOpen={onOpen} onMarkRead={onMarkRead} />
        ))}
      </ul>
      {footer}
    </section>
  );
}

function NotificationCard({ notification, onOpen, onMarkRead }) {
  const { date, time, dayOfWeek } = formatNotificationTimestamp(notification.createdAt);
  const accent = STATUS_ACCENT[notification.data?.status] || DEFAULT_ACCENT;
  const unread = !notification.read;

  /* A row, not a <button>: it contains its own "Mark as read" button, and a
     button inside a button is invalid HTML. The row is keyboard-reachable
     through its title button instead, which carries the open action. */
  return (
    <li
      className={`relative flex gap-3 rounded-[14px] border p-3 transition-colors duration-[180ms] ease-standard ${
        unread ? "border-[#056DED] bg-[#F7FAFF]" : "border-line-soft bg-surface"
      }`}
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-[12px] ${accent}`}>
        <Icon name={TYPE_ICON[notification.type] || "bell"} size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen(notification)}
          /* after:inset-0 stretches this button's hit area over the whole card,
             so clicking anywhere opens it, as a tap does in the app. */
          className="block w-full cursor-pointer text-left after:absolute after:inset-0 after:content-['']"
        >
          <span className={`block text-[15px] font-semibold text-heading ${unread ? "pr-4" : ""}`}>
            {notification.title}
          </span>
          <span className="mt-[2px] block text-sm text-body">{notification.body}</span>
        </button>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="rounded-pill bg-[#EFF5FF] px-2.5 py-1 text-xs font-medium text-[#056DED]">
            {dayOfWeek}, {date} · {time}
          </span>
          {unread ? (
            <button
              type="button"
              onClick={() => onMarkRead(notification)}
              /* relative z-10 lifts it above the card-wide open target. */
              className="relative z-10 cursor-pointer text-xs font-bold text-[#056DED] underline"
            >
              {t("notifications.markAsRead")}
            </button>
          ) : null}
        </div>
      </div>

      {unread ? (
        <span aria-label="Unread" className="absolute top-4 right-3 size-2 rounded-round bg-[#056DED]" />
      ) : null}
    </li>
  );
}
