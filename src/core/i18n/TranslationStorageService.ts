import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSLATION_KEY_PREFIX = '@MyApp:translations:';


const supportedLngs = ["en", "vi", "lo", "zh"];

const getAsyncStorageKey = (langCode: string) => {
    return `${TRANSLATION_KEY_PREFIX}${langCode}`;
};

export const saveTranslationToAsyncStorage = async (langCode: string, content: any) => {
    try {
        await AsyncStorage.setItem(getAsyncStorageKey(langCode), JSON.stringify(content));
        console.log(`Translation for ${langCode} saved to AsyncStorage successfully.`);
    } catch (error) {
        console.error(`Error saving translation for ${langCode} to AsyncStorage:`, error);
    }
};

export const loadTranslationFromAsyncStorage = async (langCode: string) => {
    try {
        const jsonValue = await AsyncStorage.getItem(getAsyncStorageKey(langCode));
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }
        console.log(`No translation found for ${langCode} in AsyncStorage.`);
        return null;
    } catch (error) {
        console.error(`Error loading translation for ${langCode} from AsyncStorage:`, error);
        return null;
    }
};

export const loadAllTranslationsFromAsyncStorage = async () => {
    const translations: Record<string, any> = {};
    try {
        for (const langCode of supportedLngs) {
            const translation = await loadTranslationFromAsyncStorage(langCode);
            if (translation) {
                translations[langCode] = translation;
            }
        }
        console.log("All available translations loaded from AsyncStorage.");
        return translations || {};
    } catch (error) {
        console.error("Error loading all translations from AsyncStorage:", error);
        return {}; 
    }
};

export const clearAllTranslationsFromAsyncStorage = async () => {
    try {
        for (const langCode of supportedLngs) {
            await AsyncStorage.removeItem(getAsyncStorageKey(langCode));
        }
        console.log("All translation data cleared from AsyncStorage.");
    } catch (error) {
        console.error("Error clearing translations from AsyncStorage:", error);
    }
};

const getVersionStorageKey = (langCode: string) => {
    return `${TRANSLATION_KEY_PREFIX}${langCode}:version`;
};

export const saveTranslationVersionToAsyncStorage = async (langCode: string, version: string) => {
    try {
        await AsyncStorage.setItem(getVersionStorageKey(langCode), version);
        console.log(`Version for ${langCode} saved to AsyncStorage successfully.`);
    } catch (error) {
        console.error(`Error saving version for ${langCode} to AsyncStorage:`, error);
    }
};

export const loadTranslationVersionFromAsyncStorage = async (langCode: string) => {
    try {
        const version = await AsyncStorage.getItem(getVersionStorageKey(langCode));
        if (version != null) {
            return version;
        }
        console.log(`No version found for ${langCode} in AsyncStorage.`);
        return null;
    } catch (error) {
        console.error(`Error loading version for ${langCode} from AsyncStorage:`, error);
        return null;
    }
};

export const loadAllTranslationVersionsFromAsyncStorage = async () => {
    const versions: Record<string, string | null> = {};
    try {
        for (const langCode of supportedLngs) {
            const version = await loadTranslationVersionFromAsyncStorage(langCode);
            versions[langCode] = version;
        }
        console.log("All translation versions loaded from AsyncStorage.");
        return versions;
    } catch (error) {
        console.error("Error loading all translation versions from AsyncStorage:", error);
        return {};
    }
};

export const clearAllTranslationVersionsFromAsyncStorage = async () => {
    try {
        for (const langCode of supportedLngs) {
            await AsyncStorage.removeItem(getVersionStorageKey(langCode));
        }
        console.log("All translation versions cleared from AsyncStorage.");
    } catch (error) {
        console.error("Error clearing translation versions from AsyncStorage:", error);
    }
};

export const isTranslationVersionEqual = async (langCode: string, version: string): Promise<boolean> => {
    const storedVersion = await loadTranslationVersionFromAsyncStorage(langCode);
    return storedVersion === version;
};

export const updateTranslationVersionInAsyncStorage = async (langCode: string, version: string): Promise<void> => {
    await saveTranslationVersionToAsyncStorage(langCode, version);
};
