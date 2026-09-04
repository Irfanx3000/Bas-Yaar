// Global ref so any screen (Profile's edit pencil/menu item, Career
// Profile's Personal/Contact "Edit" buttons) can open the Personal
// Information edit sheet without navigating anywhere — mirrors
// supportModalRef.js's hostRef pattern exactly. A single
// <PersonalInfoEditModal /> is mounted once (see AppNavigator.jsx) and
// registers itself here.
//
// This replaced navigating to `MainTabs > Profile` with an `openEdit` param:
// that navigate() call, from a stack screen like Career Profile, actually
// popped the calling screen off the stack (MainTabs is the root route, so
// jumping to it collapses everything above it back down to it) — so closing
// the sheet left the user stranded on the Profile tab with no "back" left to
// return them to Career Profile. Opening this as a global overlay instead
// never touches the navigation stack, so whatever screen opened it is still
// there, untouched, the moment it closes.
const hostRef = { current: null };

export function setPersonalInfoModalHost(handlers) {
  hostRef.current = handlers;
}

export function openPersonalInfoEdit() {
  hostRef.current?.show();
}

export function closePersonalInfoEdit() {
  hostRef.current?.hide();
}
