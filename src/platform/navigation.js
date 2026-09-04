/* Web stand-in for @react-navigation/native.

   The data layer imports exactly one thing from it: useFocusEffect, used by
   seven hooks/contexts to refetch when a screen comes back into view. */

import { useEffect } from "react";

/* React Navigation keeps screens mounted when you navigate away, so
   useFocusEffect is how a screen knows it is being looked at again. The web
   has no such thing — leaving a route unmounts it, and coming back remounts
   it, which runs the effect anyway. So this is a plain mount effect.

   Deliberately NOT also wired to visibilitychange. Returning to a backgrounded
   tab is already handled once, centrally, by store/dataSync.js, which sweeps
   every registered cache on foreground. Adding it here too would mean seven
   hooks each firing their own duplicate refetch on every tab switch.

   Callers already wrap the callback in useCallback (React Navigation requires
   it), so the dependency is stable and this does not loop. */
export function useFocusEffect(effect) {
  useEffect(() => effect(), [effect]);
}
