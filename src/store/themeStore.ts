import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "light" | "dark" | "system";

const THEME_KEY = "@teeth_manager_theme";

let cached: ThemePreference | null = null;

export async function getThemePreference(): Promise<ThemePreference> {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(THEME_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") {
      cached = raw;
      return raw;
    }
  } catch {}
  cached = "system";
  return "system";
}

export async function setThemePreference(
  theme: ThemePreference,
): Promise<void> {
  cached = theme;
  await AsyncStorage.setItem(THEME_KEY, theme);
}
