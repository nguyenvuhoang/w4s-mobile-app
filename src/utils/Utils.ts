import CryptoJS from "crypto-js";
import * as Clipboard from "expo-clipboard";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

const CONSTKEY = "abhf@311";

export function encrypt(textToEncrypt: string): string {
  const pwdUtf8 = CryptoJS.enc.Utf8.parse(CONSTKEY);
  const pwdBytes = CryptoJS.lib.WordArray.create(
    pwdUtf8.words.slice(0),
    pwdUtf8.sigBytes
  );
  let keyBytes = CryptoJS.lib.WordArray.create(
    pwdBytes.words.slice(0),
    Math.min(16, pwdBytes.sigBytes)
  );
  if (keyBytes.sigBytes < 16) {
    const padding = CryptoJS.lib.WordArray.create(
      new Array(16 - keyBytes.sigBytes).fill(0)
    );
    keyBytes.concat(padding);
    keyBytes.sigBytes = 16;
  }
  const key = keyBytes;
  const iv = keyBytes;

  const encrypted = CryptoJS.AES.encrypt(textToEncrypt, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString(); 
}

export function decrypt(encryptedBase64: string): string {
  const pwdUtf8 = CryptoJS.enc.Utf8.parse(CONSTKEY);
  const pwdWords = pwdUtf8.words;
  const pwdBytes = CryptoJS.lib.WordArray.create(pwdWords, pwdUtf8.sigBytes);

  const keyBytes = CryptoJS.lib.WordArray.create(
    pwdBytes.words.slice(0),
    Math.min(16, pwdBytes.sigBytes)
  );

  if (keyBytes.sigBytes < 16) {
    const padding = CryptoJS.lib.WordArray.create(
      new Array(16 - keyBytes.sigBytes).fill(0)
    );
    keyBytes.concat(padding);
    keyBytes.sigBytes = 16;
  }

  const key = keyBytes;
  const iv = keyBytes;

  const decrypted = CryptoJS.AES.decrypt(encryptedBase64, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return CryptoJS.enc.Utf8.stringify(decrypted);
}

export const getSecondsRemainingInMinute = () => {
  const currentTimeInSeconds = Math.round(Date.now() / 1000);
  const secondsElapsed = currentTimeInSeconds % 60;
  const secondsRemaining = 60 - secondsElapsed;
  return secondsRemaining;
};


export const addUniqueMessage = (
  messages: string[] | undefined,
  newMessage: string
): string[] => {
  return messages?.includes(newMessage)
    ? messages
    : [...(messages || []), newMessage];
};

export const getErrorMessage = (errorCode: string): string => {
  const { t } = useTranslation();
  return t(`errors.${errorCode}`);
};

export const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Toast.show({
        type: "success",
        text1: t("common.copySuccess"),
        position: "bottom",
        visibilityTime: 1000,
      });
    } catch (error) {
      Toast.show({
        type: "success",
        text1: t("common.copyFail"),
        position: "bottom",
        visibilityTime: 1000,
      });
      console.error("Failed to copy text: ", error);
    }
  };

  export function trimLog(data: any, max: number = 500): string {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    return str.length > max ? str.slice(0, max) + "..." : str;
  }

function mergeRecords(
  record1: Record<string, Set<string>>,
  record2: Record<string, Set<string>>
): Record<string, Set<string>> {
  // Nếu record2 là object rỗng, trả về record1
  if (Object.keys(record2).length === 0) {
    return record1;
  }

  const result: Record<string, Set<string>> = {};

  // Lặp qua tất cả key trong record1 và record2
  const keys = new Set([...Object.keys(record1), ...Object.keys(record2)]);

  keys.forEach((key) => {
    // Kết hợp các Set của mỗi key
    result[key] = new Set([
      ...(record1[key] ? Array.from(record1[key]) : []), // Mảng từ record1 nếu có
      ...(record2[key] ? Array.from(record2[key]) : []), // Mảng từ record2 nếu có
    ]);
  });

  return result;
}

export const maskUsername = (value: string) => {
  if (value.length < 4) return value;
  return `${value.substring(0, 3)}*****${value.slice(-2)}`;
};

export const maskIdNumber = (value: string) => {
  if (value.length < 3) return value;
  return `********${value.slice(-3)}`;
};

export const maskPhoneNumber = (value: string) => {
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}*****${value.slice(-3)}`;
};

export const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};
