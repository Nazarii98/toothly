import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";

import uk from "./locales/uk.json";
import en from "./locales/en.json";
import la from "./locales/la.json";

export const LANGUAGES = [
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "la", label: "Latina", flag: "🏛️" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "@toothly_language";

export async function getSavedLanguage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function saveLanguage(code: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, code);
}

export async function initI18n(): Promise<void> {
  const saved = await getSavedLanguage();
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? "uk";
  const fallback = deviceLocale === "uk" ? "uk" : deviceLocale === "la" ? "la" : "en";
  const lng = saved ?? fallback;

  await i18n.use(initReactI18next).init({
    resources: { uk: { translation: uk }, en: { translation: en }, la: { translation: la } },
    lng,
    fallbackLng: "uk",
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
  });
}

export async function changeLanguage(code: string): Promise<void> {
  await i18n.changeLanguage(code);
  await saveLanguage(code);
}

export default i18n;
