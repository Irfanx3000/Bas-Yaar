"use client";

/* Settings — the app's SettingsScreen.
 *
 * It is a menu, nothing more: four rows that navigate elsewhere. No state, no
 * fetch, no save. The app's own comment says "add more rows here as the app
 * grows other real settings", and the honest thing is to keep it that thin
 * rather than inventing web-only switches that write nowhere.
 *
 * The rows and their order are the app's: Wallet, Notification Settings,
 * Privacy Policy, Terms & Conditions. The two legal pages are public routes —
 * see the note in (public)/legal/[doc]/page.jsx.
 */

import Link from "next/link";
import { Card, Icon } from "@/components/ui";
import { t } from "@/i18n";

const ITEMS = [
  { href: "/wallet", labelKey: "wallet.title", icon: "wallet" },
  { href: "/notifications/settings", labelKey: "notifications.settingsScreen.title", icon: "bell" },
  { href: "/legal/privacy", labelKey: "common.privacyPolicy", icon: "shield-alt" },
  { href: "/legal/terms", labelKey: "common.termsConditions", icon: "file-contract" },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-[15px] pb-8 lg:px-6">
      <header className="pt-2 pb-4">
        <h1 className="text-h2 font-extrabold text-heading">{t("sidebar.items.settings")}</h1>
      </header>

      <Card padding="sm" radius="lg">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 border-b border-line-soft px-1 py-3.5 last:border-b-0 hover:bg-canvas-top"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-round bg-primary-light text-primary">
              <Icon name={item.icon} size={15} />
            </span>
            <span className="min-w-0 flex-1 text-md font-medium text-heading">{t(item.labelKey)}</span>
            <Icon name="chevron-right" size={12} className="shrink-0 text-hint" />
          </Link>
        ))}
      </Card>
    </div>
  );
}
