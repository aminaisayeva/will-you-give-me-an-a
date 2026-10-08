import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False during server rendering and hydration, true afterwards. For UI that
// depends on the browser window (positions, viewport size).
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
