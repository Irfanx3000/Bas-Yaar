// Global ref so any code — components, hooks, or plain modules outside the
// React tree (e.g. api/client.js's axios interceptor) — can trigger the
// themed alert dialog without needing a Context/Provider. Mirrors the same
// pattern as navigation/navigationRef.js.
const hostRef = { current: null };

export function setAlertHost(handlers) {
  hostRef.current = handlers;
}

// config: { type: 'success'|'error'|'warning'|'info', title, message,
//           icon?: MaterialCommunityIcons name — overrides the type's default icon
//           (e.g. distinguishing several 'info' alerts from each other),
//           buttons?: [{ text, onPress?, style: 'default'|'cancel'|'destructive' }],
//           dismissible? }
export function showAlert(config) {
  hostRef.current?.show(config);
}

export function hideAlert() {
  hostRef.current?.hide();
}
