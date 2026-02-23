import { useRef } from "react";
import { Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NAV_BAR = Platform.OS === "ios" ? 44 : 56;

export function useStableHeaderHeight(): number {
  const raw = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const fallback = insets.top + NAV_BAR;
  const stable = useRef(raw > 0 ? raw : fallback);
  if (raw > 0) stable.current = raw;
  return stable.current;
}
