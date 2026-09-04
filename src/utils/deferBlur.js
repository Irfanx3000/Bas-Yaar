// Delays a TextInput's onBlur-driven "hide" state update long enough for a
// tap on a sibling suggestion/dropdown row to register first. Without this,
// blur fires (hiding/unmounting the dropdown, since its `visible` prop is
// tied to focus state) before the tapped row's own onPress runs — so most of
// the row silently swallows the tap instead of navigating. This is a
// well-known RN timing race for any dropdown anchored under a focused input
// (see SearchSuggestionsDropdown's callers). 150ms is comfortably longer
// than a single tap's touch-start-to-touch-end window, and any selection
// itself already clears focus immediately/explicitly in its own handler, so
// this delay is never actually felt as a lagging UI.
const BLUR_HIDE_DELAY_MS = 150;

export function deferBlur(setFocused) {
  return () => setTimeout(() => setFocused(false), BLUR_HIDE_DELAY_MS);
}
