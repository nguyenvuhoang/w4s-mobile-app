import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import "./polyfills";

import { loadAllTranslationsFromAsyncStorage } from "@/core/i18n/TranslationStorageService";
import StorageService from "@/services/StorageService";
// import i18next from "i18next";

const supportedLngs = ["en", "vi", "lo", "zh"];

let i18nInitialized = false;

const getBestAvailableLanguage = (): string => {
	const deviceLanguage = Localization.getLocales()[0]?.languageCode;
	if (deviceLanguage && supportedLngs.includes(deviceLanguage)) {
		return deviceLanguage;
	}
	return "en"; 
};

export const initializeTranslations = async () => {
  if (i18nInitialized) {
    console.log("i18n đã được khởi tạo. Bỏ qua khởi tạo lại.");
    return;
  }

  try {
    const asyncStorageTranslations =
      await loadAllTranslationsFromAsyncStorage();
    const initialResources: Record<string, any> = {};
    if (Object.keys(asyncStorageTranslations).length > 0) {
      console.log(
        "Tìm thấy bản dịch trong AsyncStorage. Đang tải từ AsyncStorage."
      );
      for (const lang of supportedLngs) {
        if (asyncStorageTranslations[lang]) {
          initialResources[lang] = {
            translation: asyncStorageTranslations[lang],
          };
        } else {
          console.warn(`AsyncStorage thiếu bản dịch cho ngôn ngữ "${lang}".`);
        }
      }
      await i18n.use(initReactI18next).init({
        resources: initialResources,
        lng: getBestAvailableLanguage(),
        fallbackLng: "en",
        interpolation: {
          escapeValue: false,
        },
        supportedLngs: supportedLngs,
      });
      console.log(
        "Tìm thấy bản dịch trong AsyncStorage. Khởi tạo có tài nguyên."
      );
    } else {
      console.log(
        "Không tìm thấy bản dịch trong AsyncStorage. Khởi tạo với tài nguyên trống."
      );
      i18n.use(initReactI18next).init({
        resources: {},
        lng: getBestAvailableLanguage(),
        fallbackLng: "en",
        interpolation: {
          escapeValue: false,
        },
        supportedLngs: supportedLngs,
        debug: __DEV__,
      });
      // i18n.init();
    }

    i18nInitialized = true;
    console.log("Khởi tạo i18n hoàn tất.");
  } catch (error) {
    console.error(
      "Đã xảy ra lỗi trong quá trình khởi tạo i18n. Đang khởi tạo với tài nguyên trống:",
      error
    );
    i18n.use(initReactI18next).init({
      resources: {},
      lng: getBestAvailableLanguage(),
      fallbackLng: "en",
      interpolation: {
        escapeValue: false,
      },
      supportedLngs: supportedLngs,
      debug: __DEV__,
    });
    // i18n.init();
    i18nInitialized = true;
  }
};

export const changeLanguage = async (lang: string): Promise<string> => {
  const languageToSet = supportedLngs.includes(lang) ? lang : "en";
  await i18n.changeLanguage(languageToSet);
  await StorageService.setItem("language", languageToSet);
  return languageToSet;
};

export default i18n;

const languageMap: Record<string, string> = {
  en: "English",
  vi: "Vietnamese",
  lo: "Lao",
  zh: "Chinese",
};

export const supportedLanguages = Array.isArray(i18n.options.supportedLngs)
  ? i18n.options.supportedLngs
      .filter((lng) => lng !== "cimode")
      .map((lng) => languageMap[lng] || lng)
      .join(", ")
  : "N/A";
