import StorageKey from "@/constants/StorageKey";
import { Session } from "@/core/api/models/SessionModel";
import { UserSession } from "@/types/User";
import { UserCommand, AppInfo } from "@/types/UserCommand";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from "react-native";

class StorageService {
  private static cachedUserSession: UserSession | null = null;
  private static isUserSessionLoaded = false;
  private static itemMemoryCache = new Map<string, string>();
  private static readonly HOT_ASYNC_KEYS = new Set<string>([
    StorageKey.userCode,
    StorageKey.appInfo,
    StorageKey.defaultWalletId,
    "language",
  ]);

  static clearMemoryCache(): void {
    StorageService.cachedUserSession = null;
    StorageService.isUserSessionLoaded = false;
    StorageService.itemMemoryCache.clear();
  }

  static getUserSessionSync(): UserSession | null {
    return StorageService.cachedUserSession;
  }

  static async getSession(): Promise<Session | null> {
    try {
      const session = await StorageService.getSecureItem("session");

      if (session) {
        const parsedSession = JSON.parse(session);
        return Session.fromJson(parsedSession);
      }

      return null;
    } catch (error) {
      console.error("Error retrieving session:", error);
      return null;
    }
  }

  static async setUserSession(session: any): Promise<void> {
    try {
      const sessionObj = { token: session } as UserSession;
      StorageService.cachedUserSession = sessionObj;
      StorageService.isUserSessionLoaded = true;
      await StorageService.setSecureItem(
        StorageKey.userSession,
        JSON.stringify(sessionObj)
      );
    } catch (error) {
      console.error("Error setting user session:", error);
    }
  }

  public static isWeb(): boolean {
    return Platform.OS === 'web';
  }

  // --- Secure Storage (SecureStore on Mobile, AsyncStorage on Web) ---

  static async setSecureItem(key: string, value: any): Promise<void> {
    if (key === StorageKey.userSession) {
      if (typeof value === "string") {
        try {
          StorageService.cachedUserSession = value ? JSON.parse(value) : null;
          StorageService.isUserSessionLoaded = true;
        } catch {
          StorageService.isUserSessionLoaded = false;
        }
      } else {
        StorageService.cachedUserSession = value ?? null;
        StorageService.isUserSessionLoaded = true;
      }
    }

    if (StorageService.isWeb()) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }

  static async getSecureItem(key: string): Promise<string> {
    if (StorageService.isWeb()) {
      const item = await AsyncStorage.getItem(key);
      return item ?? "";
    } else {
      const item = await SecureStore.getItemAsync(key);
      return item ?? "";
    }
  }

  static async removeSecureItem(key: string): Promise<void> {
    if (key === StorageKey.userSession) {
      StorageService.cachedUserSession = null;
      StorageService.isUserSessionLoaded = true;
    }

    if (StorageService.isWeb()) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }

  // --- Regular Storage (AsyncStorage) ---

  static async setItem(key: string, value: string): Promise<void> {
    if (StorageService.HOT_ASYNC_KEYS.has(key)) {
      StorageService.itemMemoryCache.set(key, value);
    }
    await AsyncStorage.setItem(key, value);
  }

  static async getItem(key: string): Promise<string> {
    if (
      StorageService.HOT_ASYNC_KEYS.has(key) &&
      StorageService.itemMemoryCache.has(key)
    ) {
      return StorageService.itemMemoryCache.get(key) ?? "";
    }
    const item = await AsyncStorage.getItem(key);
    const resolved = item ?? "";
    if (StorageService.HOT_ASYNC_KEYS.has(key)) {
      StorageService.itemMemoryCache.set(key, resolved);
    }
    return resolved;
  }

  static async removeItem(key: string): Promise<void> {
    if (StorageService.HOT_ASYNC_KEYS.has(key)) {
      StorageService.itemMemoryCache.delete(key);
    }
    await AsyncStorage.removeItem(key);
  }

  // Alias for backward compatibility
  static setAsyncItem = StorageService.setItem;
  static getAsyncItem = StorageService.getItem;
  static removeAsyncItem = StorageService.removeItem;

  // --- Specialized Methods ---

  static async getUserSession(): Promise<UserSession | null> {
    if (StorageService.isUserSessionLoaded) {
      return StorageService.cachedUserSession;
    }
    const userSession = await StorageService.getSecureItem(StorageKey.userSession);
    StorageService.cachedUserSession = userSession ? JSON.parse(userSession) : null;
    StorageService.isUserSessionLoaded = true;
    return StorageService.cachedUserSession;
  }

  static async clearSession(): Promise<void> {
    await this.removeSecureItem("session");
  }

  static async getUsername(): Promise<string> {
    let username = await this.getSecureItem("username");
    return username ? username : "";
  }

  static async getPin(): Promise<string> {
    let pin = await this.getSecureItem("pin");
    return pin ? pin : "";
  }

  static async getPrivateKey(): Promise<string> {
    let privateKey = await this.getSecureItem("privateKey");
    return privateKey ? privateKey : "";
  }

  static async checkFastLogin(): Promise<boolean> {
    let pin = await this.getPin();
    let userName = await this.getUsername();
    return !!(pin && userName);
  }

  static async getFcmToken(): Promise<string> {
    return await this.getSecureItem("fcmToken");
  }

  static async getLanguage(): Promise<string> {
    let language = await this.getItem("language");
    return language ? language : "en";
  }

  static async getTempActivationCode(): Promise<string> {
    return await this.getSecureItem("tempActivationCode");
  }

  static async getPassword(): Promise<string> {
    return await this.getSecureItem("password");
  }

  static async getCachedRoleCommand(): Promise<string[]> {
    const commandIds = await this.getItem(StorageKey.roleCommand);
    if (commandIds) {
      try {
        const parsedCommandIds = JSON.parse(commandIds);
        if (Array.isArray(parsedCommandIds)) {
          return parsedCommandIds;
        }
      } catch (error) {
        console.warn('Failed to parse cached role command:', error);
      }
    }
    return [];
  }

  static async getCommandMenu(): Promise<UserCommand[]> {
    let value = await this.getItem(StorageKey.commandMenu);
    return value ? JSON.parse(value) as UserCommand[] : [];
  }

  static async getBaseURL(): Promise<string> {
    return await this.getItem(StorageKey.baseURL);
  }

  static async setBaseURL(baseURL: string): Promise<void> {
    await this.setItem(StorageKey.baseURL, baseURL);
  }

  static async getAppInfo(): Promise<AppInfo | null> {
    const appInfo = await this.getItem(StorageKey.appInfo);
    return appInfo ? JSON.parse(appInfo) : null;
  }
}

export default StorageService;
