"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/ui";
import { TopSearch } from "./TopSearch";
import { useScrollIdle } from "./useScrollIdle";
import { useSubscriptionStatus } from "@/context/SubscriptionContext";
import { Avatar } from "@/components/ui/Display";

/* The signed-in chrome, and the plan's headline responsive translation:
 *
 *   mobile   the app's floating glass tab bar, pinned to the bottom
 *   desktop  a persistent left sidebar — screen real estate a phone never had
 *
 * The app has four tabs (Home, Profile, My Applications, Jobs) plus a hamburger
 * drawer for everything else. On desktop the drawer disappears: there is room to
 * show its contents permanently, so the sidebar lists both. Below `lg` the
 * secondary links move into the bottom bar's overflow — nothing is lost, it just
 * stops being always-visible.
 */

/* Four primary destinations, matching the app's TAB_META exactly and in order. */
const PRIMARY = [
  { href: "/dashboard", label: "Home", icon: "route" },
  { href: "/profile", label: "Profile", icon: "user" },
  { href: "/applications", label: "My Applications", icon: "file-alt" },
  { href: "/jobs", label: "Jobs", icon: "briefcase" },
];

/* The app's sidebar drawer, promoted to always-visible on desktop. */
const SECONDARY = [
  { href: "/cv", label: "My CV", icon: "file-alt" },
  { href: "/documents", label: "Documents", icon: "folder-open" },
  { href: "/saved", label: "Saved jobs", icon: "bookmark" },
  { href: "/alerts", label: "Job alerts", icon: "bell" },
  { href: "/subscription", label: "Subscription", icon: "tag" },
  { href: "/wallet", label: "Wallet", icon: "wallet" },
  { href: "/refer", label: "Refer & earn", icon: "share-alt" },
  { href: "/consultancy", label: "Consultancy", icon: "user-circle" },
  { href: "/settings", label: "Settings", icon: "cog" },
];

const isActive = (pathname, href) =>
  href === "/dashboard" ? pathname === href : pathname.startsWith(href);

/* ── Sidebar preference, as an external store ───────────────────────────────
   localStorage is external mutable state, so useSyncExternalStore is the right
   reader for it rather than mirroring it into useState via an effect.
   Every access is guarded: storage throws outright in Safari private mode, and
   a layout preference is never worth breaking the shell over. */
const SIDEBAR_KEY = "crewapply:sidebar";
const sidebarListeners = new Set();

/* Fallback when storage is unavailable, so the toggle still works for the
   session even if the preference cannot be persisted — same approach as the
   AsyncStorage shim in src/platform. */
let sidebarMemory = false;

const readSidebar = () => {
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === "collapsed";
  } catch {
    return sidebarMemory;
  }
};

/* The server has no storage, and returning false here is what keeps SSR and the
   first client render identical. */
const readSidebarOnServer = () => false;

const subscribeSidebar = (onChange) => {
  sidebarListeners.add(onChange);
  // `storage` only fires in OTHER tabs, so same-tab writes notify via the set.
  window.addEventListener("storage", onChange);
  return () => {
    sidebarListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};

const writeSidebar = (collapsed) => {
  sidebarMemory = collapsed;
  try {
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
  } catch {
    /* preference simply will not persist */
  }
  sidebarListeners.forEach((notify) => notify());
};

function NavLink({ item, active, collapsed }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      /* When collapsed the label is gone, so the accessible name has to come
         from somewhere — aria-label carries it, and title gives sighted users
         the same thing on hover. */
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={`flex items-center rounded-md py-2 text-md font-semibold transition-colors duration-[180ms] ease-standard ${
        collapsed ? "justify-center px-0" : "gap-3 px-3"
      } ${active ? "bg-primary-light text-primary" : "text-body hover:bg-primary-light/60 hover:text-heading"}`}
    >
      <Icon name={item.icon} size={16} className="shrink-0" />
      {collapsed ? null : item.label}
    </Link>
  );
}

export function AppShell({ children, user }) {
  const pathname = usePathname() ?? "";
  const scrolling = useScrollIdle();

  /* Collapsed sidebar preference, read through useSyncExternalStore.
     Previously this was useState + a setState inside useEffect, which is what
     React Compiler flags as a cascading render — and it also rendered once with
     the wrong value before correcting. useSyncExternalStore is the API built for
     exactly this: `getServerSnapshot` returns false so SSR and the first client
     render agree (no hydration mismatch), then the real value is read
     synchronously on the client. Cross-tab sync comes free with the `storage`
     event. */
  const collapsed = useSyncExternalStore(subscribeSidebar, readSidebar, readSidebarOnServer);
  const toggleSidebar = () => writeSidebar(!collapsed);

  /* Focus is tracked in STATE, set from focus/blur handlers on the header —
     not by reading headerRef.current during render, which is the other thing
     the compiler flags. Same guarantee, and it is actually more reliable:
     document.activeElement during render is whatever it was on the previous
     paint, not now. */
  const [headerHasFocus, setHeaderHasFocus] = useState(false);

  /* Never hide a bar the user is inside: a keyboard user tabbing through the
     header scrolls the page, and having it vanish under them is disorienting.
     Also keeps the search dropdown from being yanked away mid-use. */
  const hidden = scrolling && !headerHasFocus;

  /* Named hasPlan, NOT isActive: the module-level isActive(pathname, href) nav
     helper is in scope here, and destructuring a boolean called `isActive`
     shadowed it — every NavLink then called a boolean and the page crashed. */
  const { isActive: hasPlan } = useSubscriptionStatus() ?? {};

  /* Shown unless we positively know there IS a plan — deliberately NOT gated on
     the context's `loading`.
     I gated on it first to stop a subscriber seeing "Subscribe" flash. That
     traded a one-frame cosmetic issue for a real one: the CTA then depended on a
     network round trip, so it was invisible on first paint for everyone and
     invisible forever if that request was slow, failed, or the session had no
     token. "No plan" is also the overwhelmingly common state in a job-seeking
     app, so defaulting to hidden was optimising for the minority.
     It fades rather than pops, so the subscriber case is a soft correction. */
  const showSubscribeCta = !hasPlan;

  return (
    <div
      className={`min-h-dvh lg:grid ${
        collapsed ? "lg:grid-cols-[4rem_1fr]" : "lg:grid-cols-[16rem_1fr]"
      }`}
    >
      {/* Desktop sidebar. Hidden on mobile, where the bottom bar takes over. */}
      <aside className={`scrollbar-thin sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r border-line-soft bg-surface py-4 lg:flex ${collapsed ? "px-2" : "px-4"}`}>
        <div className={`mb-6 flex items-center ${collapsed ? "flex-col gap-2" : "justify-between gap-2 px-3"}`}>
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2" aria-label="CrewApply home">
            <Image src="/logo.png" alt="" width={32} height={32} className="size-8 shrink-0 object-contain" priority />
            {collapsed ? null : <span className="text-lg font-extrabold text-heading">CrewApply</span>}
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="shrink-0 cursor-pointer rounded-md p-2 text-hint transition-colors duration-[180ms] ease-standard hover:bg-primary-light hover:text-primary"
          >
            <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={14} />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {PRIMARY.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
          ))}
        </nav>

        <hr className="my-4 border-line-soft" />

        <nav className="flex flex-col gap-1">
          {SECONDARY.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Top bar. On mobile it carries the notification bell and avatar the app
            shows over its hero; on desktop it is the same, minus the hamburger. */}
        <header
          onFocusCapture={() => setHeaderHasFocus(true)}
          onBlurCapture={() => setHeaderHasFocus(false)}
          /* Asymmetric motion, straight from the app's own tokens:
               out  180ms (motion.duration.fast) on ease-accelerate — an exit
                    should get out of the way, so it leaves quickly
               in   280ms (motion.duration.base) on ease-decelerate, which
                    motion.js annotates "entrances: enter fast, settle soft"

             A single symmetric 180ms was what made the bar snap back: too short
             to read as movement, and an ease that starts and ends at the same
             rate has no sense of arrival. Travel is 12px rather than 8 for the
             same reason — below about 10px a slide is invisible and only the
             opacity registers, which is what reads as "instant". */
          className={`sticky top-0 z-30 flex items-center justify-between gap-3 px-[15px] py-3 transition-[opacity,transform] will-change-[opacity,transform] lg:px-6 ${
            hidden
              ? "pointer-events-none -translate-y-3 opacity-0 duration-[180ms] ease-accelerate"
              : "translate-y-0 opacity-100 duration-[280ms] ease-decelerate"
          }`}
        >
          <Link href="/dashboard" className="shrink-0 lg:hidden" aria-label="CrewApply home">
            <Image src="/logo.png" alt="" width={32} height={32} className="size-8 object-contain" priority />
          </Link>

          {/* Global search lives here, not in the page hero — it belongs to the
              app, not to one screen, and every route can reach it from the bar. */}
          <TopSearch />

          <div className="flex shrink-0 items-center gap-2">
            {/* Subscription lives here rather than as a card in the page. It is a
                property of the account, not of the Home screen, so it belongs in
                the chrome where it is reachable from every route — and it stops
                a full-width banner pushing the actual content down. */}
            {showSubscribeCta ? (
              <Link
                href="/subscription"
                className="bg-gradient-secondary press hidden items-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-on-secondary shadow-sm transition-opacity duration-[280ms] ease-decelerate sm:flex"
              >
                <Icon name="lock" size={12} />
                Subscribe
              </Link>
            ) : null}

            <Link
              href="/notifications"
              aria-label="Notifications"
              className="glass flex size-10 items-center justify-center rounded-round text-primary shadow-float"
            >
              <Icon name="bell" size={16} />
            </Link>
            <Link href="/profile" aria-label="Your profile">
              <Avatar name={user?.name} src={user?.avatarUrl} size="md" />
            </Link>
          </div>
        </header>

        {/* pb-24 on mobile reserves room for the floating bar so the last card is
            never trapped underneath it. */}
        <main className="min-w-0 flex-1 pb-24 lg:pb-8">{children}</main>
      </div>

      {/* The app's floating glass tab bar — 16px inset, pill radius, shadow-float,
          exactly as AppNavigator draws it. Mobile only. */}
      <nav
        aria-label="Primary"
        className="glass fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-xxl px-2 py-2 shadow-float lg:hidden"
      >
        {PRIMARY.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-[2px] rounded-md py-1 text-nav font-medium ${
                active ? "text-primary" : "text-nav-inactive"
              }`}
            >
              <Icon name={item.icon} size={18} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default AppShell;
