// src/utils/currencyLocaleDetector.ts

import { Currency } from "@/services/repositories/currency.repository";

/**
 * Detect locale từ currency_id
 */
export const detectLocaleFromCurrencyId = (currencyId: string): string => {
  // Map currency_id -> locale dựa trên quy ước quốc tế
  const currencyToLocaleMap: Record<string, string> = {
    // Asia Pacific
    VND: "vi-VN",
    JPY: "ja-JP",
    CNY: "zh-CN",
    KRW: "ko-KR",
    THB: "th-TH",
    SGD: "en-SG",
    MYR: "ms-MY",
    IDR: "id-ID",
    PHP: "en-PH",
    INR: "en-IN",
    HKD: "zh-HK",
    TWD: "zh-TW",

    // Americas
    USD: "en-US",
    CAD: "en-CA",
    MXN: "es-MX",
    BRL: "pt-BR",
    ARS: "es-AR",
    CLP: "es-CL",

    // Europe
    EUR: "de-DE", // hoặc có thể dùng 'en-EU'
    GBP: "en-GB",
    CHF: "de-CH",
    SEK: "sv-SE",
    NOK: "nb-NO",
    DKK: "da-DK",
    PLN: "pl-PL",
    CZK: "cs-CZ",
    HUF: "hu-HU",
    RON: "ro-RO",

    // Middle East & Africa
    AED: "ar-AE",
    SAR: "ar-SA",
    ILS: "he-IL",
    TRY: "tr-TR",
    ZAR: "en-ZA",
    EGP: "ar-EG",

    // Oceania
    AUD: "en-AU",
    NZD: "en-NZ",
  };

  return currencyToLocaleMap[currencyId] || "en-US";
};

/**
 * Detect symbol position từ currency_id
 */
export const detectSymbolPosition = (
  currencyId: string,
): "before" | "after" => {
  // Danh sách các currency có symbol ở sau số
  const symbolAfterCurrencies = [
    "VND", // Vietnamese Dong
    "EUR", // Euro (một số quốc gia)
    "SEK", // Swedish Krona
    "NOK", // Norwegian Krone
    "DKK", // Danish Krone
    "CZK", // Czech Koruna
    "HUF", // Hungarian Forint
    "PLN", // Polish Zloty
    "RON", // Romanian Leu
    "CHF", // Swiss Franc (một số format)
  ];

  return symbolAfterCurrencies.includes(currencyId) ? "after" : "before";
};

/**
 * Detect locale từ currency_name (nếu có thông tin)
 */
export const detectLocaleFromCurrencyName = (
  currencyName: string,
): string | null => {
  const lowerName = currencyName.toLowerCase();

  // Map từ tên currency -> locale
  const nameToLocaleMap: Record<string, string> = {
    // Vietnam
    "vietnamese dong": "vi-VN",
    "vietnam dong": "vi-VN",
    dong: "vi-VN",

    // US
    "us dollar": "en-US",
    dollar: "en-US",

    // Europe
    euro: "de-DE",
    "british pound": "en-GB",
    "pound sterling": "en-GB",

    // Asia
    "japanese yen": "ja-JP",
    yen: "ja-JP",
    "chinese yuan": "zh-CN",
    yuan: "zh-CN",
    "korean won": "ko-KR",
    won: "ko-KR",
    "thai baht": "th-TH",
    baht: "th-TH",
  };

  for (const [key, locale] of Object.entries(nameToLocaleMap)) {
    if (lowerName.includes(key)) {
      return locale;
    }
  }

  return null;
};

/**
 * Detect locale từ Currency object (thử nhiều cách)
 */
export const detectLocale = (currency: Currency): string => {
  // 1. Thử detect từ currency_id (chính xác nhất)
  const localeFromId = detectLocaleFromCurrencyId(currency.currency_id);
  if (localeFromId !== "en-US") {
    return localeFromId;
  }

  // 2. Thử detect từ currency_name
  if (currency.currency_name) {
    let name = currency.currency_name;

    // Nếu currency_name là JSON object, parse nó
    if (typeof currency.currency_name === "object") {
      try {
        const nameObj = currency.currency_name as any;
        name =
          nameObj.CurrencyName1 ||
          nameObj.CurrencyName2 ||
          nameObj.CurrencyName3 ||
          "";
      } catch (e) {
        console.warn("[detectLocale] Failed to parse currency_name object:", e);
      }
    } else if (typeof currency.currency_name === "string") {
      // Thử parse string nếu nó là JSON
      try {
        const parsed = JSON.parse(currency.currency_name);
        name =
          parsed.CurrencyName1 ||
          parsed.CurrencyName2 ||
          parsed.CurrencyName3 ||
          currency.currency_name;
      } catch (e) {
        // Không phải JSON, dùng string gốc
        name = currency.currency_name;
      }
    }

    const localeFromName = detectLocaleFromCurrencyName(name);
    if (localeFromName) {
      return localeFromName;
    }
  }

  // 3. Fallback: dùng en-US
  return "en-US";
};

/**
 * Get số decimal places cho currency (một số currency không dùng decimal)
 */
export const getDecimalPlaces = (currencyId: string): number => {
  // Các currency không dùng decimal
  const noDecimalCurrencies = [
    "VND", // Vietnamese Dong
    "JPY", // Japanese Yen
    "KRW", // Korean Won
    "IDR", // Indonesian Rupiah
    "CLP", // Chilean Peso
    "ISK", // Icelandic Króna
  ];

  return noDecimalCurrencies.includes(currencyId) ? 0 : 2;
};

/**
 * Tạo formatter cho currency
 */
export const createCurrencyFormatter = (currency: Currency) => {
  const locale = detectLocale(currency);
  const symbolPosition = detectSymbolPosition(currency.currency_id);
  const decimalPlaces = getDecimalPlaces(currency.currency_id);

  return {
    locale,
    symbolPosition,
    decimalPlaces,
    symbol: currency.symbol,
    currencyId: currency.currency_id,
  };
};
