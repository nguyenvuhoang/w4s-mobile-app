import StorageKey from "@/constants/StorageKey";
import { Session } from "@/core/api/models/SessionModel";
import { UserSession } from "@/types/User";
import { UserCommand, AppInfo } from "@/types/UserCommand";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from "react-native";

class StorageService {
  static async getSession(): Promise<Session | null> {
    try {
      const session = await this.getSecureItem("session");

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
      await this.setSecureItem(StorageKey.userSession, JSON.stringify({ token: session }));
    } catch (error) {
      console.error("Error setting user session:", error);
    }
  }

  public static isWeb(): boolean {
    return Platform.OS === 'web';
  }

  // --- Secure Storage (SecureStore on Mobile, AsyncStorage on Web) ---

  static async setSecureItem(key: string, value: any): Promise<void> {
    if (this.isWeb()) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }

  static async getSecureItem(key: string): Promise<string> {
    if (this.isWeb()) {
      const item = await AsyncStorage.getItem(key);
      return item ?? "";
    } else {
      const item = await SecureStore.getItemAsync(key);
      return item ?? "";
    }
  }

  static async removeSecureItem(key: string): Promise<void> {
    if (this.isWeb()) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }

  // --- Regular Storage (AsyncStorage) ---

  static async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  static async getItem(key: string): Promise<string> {
    const item = await AsyncStorage.getItem(key);
    return item ?? "";
  }

  static async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  // Alias for backward compatibility
  static setAsyncItem = this.setItem;
  static getAsyncItem = this.getItem;
  static removeAsyncItem = this.removeItem;

  // --- Specialized Methods ---

  static async getUserSession(): Promise<UserSession | null> {
    const userSession = await this.getSecureItem(StorageKey.userSession);
    return userSession ? JSON.parse(userSession) : null;
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
