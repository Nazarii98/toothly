import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "./store/themeStore";

export interface ColorTokens {
  bg: string;
  card: string;
  cardSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentBg: string;
  border: string;
  shadow: string;
  overlay: string;
  chevron: string;
  destructive: string;
  inputBg: string;
  badgeBg: string;
  white: string;
  statusOptionBg: string;
  glassCard: string;
  isDark: boolean;
}

const lightColors: ColorTokens = {
  bg: "#f2f6f4",
  card: "#fff",
  cardSecondary: "#f6faf8",
  text: "#1a3d32",
  textSecondary: "#5a7a6a",
  textTertiary: "#8a9a90",
  accent: "#2d5a4a",
  accentBg: "#eef5f1",
  border: "#e8ece8",
  shadow: "#1a3d32",
  overlay: "rgba(0,0,0,0.3)",
  chevron: "#8a9a90",
  destructive: "#c06060",
  inputBg: "#f5f8f6",
  badgeBg: "#e8f5ee",
  white: "#fff",
  statusOptionBg: "#f0f5f2",
  glassCard: "rgba(255,255,255,0.65)",
  isDark: false,
};

const darkColors: ColorTokens = {
  bg: "#0a0a0a",
  card: "#161616",
  cardSecondary: "#1e1e1e",
  text: "#e6e6e8",
  textSecondary: "#929296",
  textTertiary: "#5c5c60",
  accent: "#78b8a0",
  accentBg: "#142220",
  border: "#262628",
  shadow: "#000",
  overlay: "rgba(0,0,0,0.62)",
  chevron: "#5c5c60",
  destructive: "#e06060",
  inputBg: "#161616",
  badgeBg: "#142220",
  white: "#fff",
  statusOptionBg: "#1e1e1e",
  glassCard: "rgba(22,22,22,0.85)",
  isDark: true,
};

const emeraldColors: ColorTokens = {
  bg: "#0f1a15",
  card: "#1a2b23",
  cardSecondary: "#1f3029",
  text: "#e8f0ec",
  textSecondary: "#9ab0a4",
  textTertiary: "#6a8078",
  accent: "#5cb896",
  accentBg: "#1a3d32",
  border: "#2a3d34",
  shadow: "#000",
  overlay: "rgba(0,0,0,0.55)",
  chevron: "#6a8078",
  destructive: "#e07070",
  inputBg: "#1f3029",
  badgeBg: "#1a3d32",
  white: "#fff",
  statusOptionBg: "#1f3029",
  glassCard: "rgba(30,50,40,0.75)",
  isDark: true,
};

const oceanColors: ColorTokens = {
  bg: "#0c1929",
  card: "#142236",
  cardSecondary: "#1a2d44",
  text: "#dce8f5",
  textSecondary: "#8aa4c0",
  textTertiary: "#5c7a9a",
  accent: "#4da6e0",
  accentBg: "#15314a",
  border: "#1e3650",
  shadow: "#000",
  overlay: "rgba(0,0,0,0.55)",
  chevron: "#5c7a9a",
  destructive: "#e07070",
  inputBg: "#1a2d44",
  badgeBg: "#15314a",
  white: "#fff",
  statusOptionBg: "#1a2d44",
  glassCard: "rgba(20,34,54,0.8)",
  isDark: true,
};

const lavenderColors: ColorTokens = {
  bg: "#f4f0fa",
  card: "#fff",
  cardSecondary: "#f8f5fc",
  text: "#2d1f4e",
  textSecondary: "#6b5a8a",
  textTertiary: "#9488a8",
  accent: "#7c5cbf",
  accentBg: "#efe8f8",
  border: "#e4dbed",
  shadow: "#2d1f4e",
  overlay: "rgba(0,0,0,0.3)",
  chevron: "#9488a8",
  destructive: "#c06060",
  inputBg: "#f6f2fb",
  badgeBg: "#efe8f8",
  white: "#fff",
  statusOptionBg: "#f2edf9",
  glassCard: "rgba(255,255,255,0.65)",
  isDark: false,
};

const sunsetColors: ColorTokens = {
  bg: "#fdf6f0",
  card: "#fff",
  cardSecondary: "#fdf8f4",
  text: "#3d2415",
  textSecondary: "#8a6a55",
  textTertiary: "#a89080",
  accent: "#d47830",
  accentBg: "#fef0e4",
  border: "#f0e0d0",
  shadow: "#3d2415",
  overlay: "rgba(0,0,0,0.3)",
  chevron: "#a89080",
  destructive: "#c06060",
  inputBg: "#faf4ee",
  badgeBg: "#fef0e4",
  white: "#fff",
  statusOptionBg: "#faf2ea",
  glassCard: "rgba(255,255,255,0.65)",
  isDark: false,
};

const midnightColors: ColorTokens = {
  bg: "#13111c",
  card: "#1e1a2e",
  cardSecondary: "#252038",
  text: "#e4e0f0",
  textSecondary: "#a098b8",
  textTertiary: "#6e6588",
  accent: "#a87cee",
  accentBg: "#2a2040",
  border: "#302848",
  shadow: "#000",
  overlay: "rgba(0,0,0,0.55)",
  chevron: "#6e6588",
  destructive: "#e07070",
  inputBg: "#252038",
  badgeBg: "#2a2040",
  white: "#fff",
  statusOptionBg: "#252038",
  glassCard: "rgba(30,26,46,0.8)",
  isDark: true,
};

const THEME_MAP: Record<string, ColorTokens> = {
  light: lightColors,
  dark: darkColors,
  emerald: emeraldColors,
  ocean: oceanColors,
  lavender: lavenderColors,
  sunset: sunsetColors,
  midnight: midnightColors,
};

export const THEME_COLORS: Record<
  Exclude<ThemePreference, "system">,
  ColorTokens
> = THEME_MAP as any;

interface ThemeContextValue {
  colors: ColorTokens;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  preference: "system",
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getThemePreference().then((p) => {
      setPreferenceState(p);
      setLoaded(true);
    });
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    setThemePreference(p);
  }, []);

  const resolvedTheme =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const colors = THEME_MAP[resolvedTheme] ?? lightColors;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ colors, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: "Системна",
  light: "Світла",
  dark: "Темна",
  emerald: "Смарагд",
  ocean: "Океан",
  lavender: "Лаванда",
  sunset: "Захід сонця",
  midnight: "Опівніч",
};
