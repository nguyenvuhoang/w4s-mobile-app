/**
 * Translation utility using Google Translate API (free tier)
 * Dùng để dịch tên category giữa tiếng Việt và tiếng Anh
 */

const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';

interface TranslationResult {
  translatedText: string;
  success: boolean;
}

/**
 * Dịch text từ ngôn ngữ nguồn sang ngôn ngữ đích
 * @param text - Text cần dịch
 * @param sourceLang - Ngôn ngữ nguồn ('vi' hoặc 'en')
 * @param targetLang - Ngôn ngữ đích ('vi' hoặc 'en')
 * @returns TranslationResult
 */
export const translateText = async (
  text: string,
  sourceLang: 'vi' | 'en',
  targetLang: 'vi' | 'en'
): Promise<TranslationResult> => {
  if (!text.trim()) {
    return { translatedText: '', success: false };
  }

  // Nếu nguồn và đích giống nhau, trả về text gốc
  if (sourceLang === targetLang) {
    return { translatedText: text, success: true };
  }

  try {
    const url = `${GOOGLE_TRANSLATE_API}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Google Translate API trả về mảng lồng nhau
    // [[["translated text", "original text", null, null, 10]], null, "vi"]
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return {
        translatedText: data[0][0][0],
        success: true,
      };
    }

    return { translatedText: text, success: false };
  } catch (error) {
    console.error('[translateText] Translation failed:', error);
    return { translatedText: text, success: false };
  }
};

/**
 * Tạo JSON multilingual name cho category
 * @param viName - Tên tiếng Việt
 * @param enName - Tên tiếng Anh
 * @returns JSON string {"vi": "...", "en": "..."}
 */
export const createMultilingualCategoryName = (
  viName: string,
  enName: string
): string => {
  return JSON.stringify({
    vi: viName.trim(),
    en: enName.trim(),
  });
};

/**
 * Parse JSON multilingual name
 * @param jsonName - JSON string {"vi": "...", "en": "..."}
 * @returns Object { vi: string, en: string }
 */
export const parseMultilingualCategoryName = (
  jsonName: string
): { vi: string; en: string } => {
  try {
    const parsed = JSON.parse(jsonName);
    return {
      vi: parsed.vi || '',
      en: parsed.en || '',
    };
  } catch {
    // Nếu không parse được, giả sử đây là text thuần
    return {
      vi: jsonName,
      en: jsonName,
    };
  }
};

/**
 * Loại bỏ dấu tiếng Việt khỏi chuỗi
 * @param str - Chuỗi cần loại bỏ dấu
 * @returns Chuỗi không dấu
 */
export const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export default {
  translateText,
  createMultilingualCategoryName,
  parseMultilingualCategoryName,
  removeAccents,
};
