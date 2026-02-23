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
  const [preference, setPreferenceState] =
    useState<ThemePreference>("system");
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

  const isDark =
    preference === "dark" ||
    (preference === "system" && systemScheme === "dark");

  const colors = isDark ? darkColors : lightColors;

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
};
