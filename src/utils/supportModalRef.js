// Global ref so any code — MoreOptionsModal's Help & Support entry, the
// blocked-account alert in api/client.js, or any future call site — can open
// the Contact Support form without needing local state or prop-drilling.
// Mirrors alertRef.js's hostRef pattern exactly. A single <ContactSupportModal />
// is mounted once (see AppNavigator.jsx) and registers itself here.
const hostRef = { current: null };

export function setSupportModalHost(handlers) {
  hostRef.current = handlers;
}

export function openContactSupport() {
  hostRef.current?.show();
}

export function closeContactSupport() {
  hostRef.current?.hide();
}
