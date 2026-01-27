import StorageService from "@/services/StorageService";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import "./polyfills";

// Import local translation files
import en from "./locales/en.json";
import vi from "./locales/vi.json";

const resources = {
  en: { translation: en },
  vi: { translation: vi }
};

export const supportedLngs = ["en", "vi"];

const getBestAvailableLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await StorageService.getItem("language");
    if (savedLanguage && supportedLngs.includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    console.log("Error reading language from storage:", error);
  }

  const deviceLanguage = Localization.getLocales()[0]?.languageCode;
  if (deviceLanguage && supportedLngs.includes(deviceLanguage)) {
    return deviceLanguage;
  }
  return "vi";
};

export const initializeTranslations = async () => {
  if (i18n.isInitialized) {
    return;
  }

  const language = await getBestAvailableLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: "vi",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    }
  });
};

export const changeLanguage = async (lang: string): Promise<string> => {
  const languageToSet = supportedLngs.includes(lang) ? lang : "vi";
  await i18n.changeLanguage(languageToSet);
  await StorageService.setItem("language", languageToSet);
  return languageToSet;
};

export default i18n;

export const languageMap: Record<string, string> = {
  en: "English",
  vi: "Tiếng Việt",
};

export const supportedLanguages = supportedLngs
      .map((lng) => languageMap[lng] || lng)
      .join(", ");

