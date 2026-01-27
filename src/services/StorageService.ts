import StorageKey from "@/constants/StorageKey";
import { Session } from "@/core/api/models/SessionModel";
import { UserSession } from "@/types/User";
import { UserCommand } from "@/types/UserCommand";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from "react-native";

class StorageService {
  static async getSession(): Promise<Session | null> {
    try {
      const session = await this.getItem("session");

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
      await this.setItem(StorageKey.userSession, JSON.stringify({ token: session }));

      // const channelId = await this.getItem(StorageKey.channelId);
      // const key = channelId ? `${StorageKey.userSession}_${channelId}` : StorageKey.userSession;
      // await this.setItem(key, JSON.stringify({ token: session }));
    } catch (error) {
      console.error("Error setting user session:", error);
    }
  }

  public static isWeb(): boolean {
    // Cách 1: Kiểm tra Platform từ react-native
    if (Platform.OS === 'web') return true;
    return false;

    // Cách 2: Kiểm tra window và navigator
    // return typeof window !== 'undefined' && typeof window.navigator !== 'undefined';

    // Cách 3: Kiểm tra document
    // return typeof document !== 'undefined';
  }
  static async getSecureItem(key: string): Promise<string> {
    return await SecureStore.getItemAsync(key) ?? "";
  }

  static async setSecureItem(key: string, value: any): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  static async removeSecureItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }

  static async setItem(key: string, value: any): Promise<void> {
    if (this.isWeb()) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }

  static async getItem(key: string): Promise<string> {
    // console.log("this.isWeb()", this.isWeb());
    if (this.isWeb()) {
      const item = await AsyncStorage.getItem(key);
      return item ?? "";
    } else {
      const item = await SecureStore.getItemAsync(key);
      return item ?? "";
    }
  }
  static async getUserSession(): Promise<UserSession | null> {
    const userSession = await this.getItem(StorageKey.userSession);
    return userSession ? JSON.parse(userSession) : null;
  }

  static async removeItem(key: string): Promise<void> {
    if (this.isWeb()) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }

  static async clearSession(): Promise<void> {
    await this.removeItem("session");
  }

  static async getUsername(): Promise<string> {
    let username = await this.getItem("username");
    return username ? username : "";
  }

  static async getPin(): Promise<string> {
    let pin = await this.getItem("pin");
    return pin ? pin : "";
  }

  static async getPrivateKey(): Promise<string> {
    let privateKey = await this.getItem("privateKey");
    return privateKey ? privateKey : "";
  }

  static async checkFastLogin(): Promise<boolean> {
    let pin = await this.getPin();
    let userName = await this.getUsername();

    if (pin && userName) {
      return true;
    }
    return false;
  }

  static async getFcmToken(): Promise<string> {
    let fcmToken = await this.getItem("fcmToken");
    return fcmToken ? fcmToken : "";
  }

  static async getLanguage(): Promise<string> {
    let language = await this.getItem("language");
    return language ? language : "en";
  }

  static async getTempActivationCode(): Promise<string> {
    let value = await this.getItem("tempActivationCode");
    return value ? value : "";
  }

  static async getPassword(): Promise<string> {
    let password = await this.getItem("password");
    return password ? password : "";
  }

  //#region AsyncStorage
  static async getAsyncItem(key: string): Promise<string> {
    return await AsyncStorage.getItem(key) ?? "";
  }

  static async setAsyncItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  static async removeAsyncItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  static async getCachedRoleCommand(): Promise<string[]> {
    const commandIds = await this.getAsyncItem(StorageKey.roleCommand);
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
    let value = await this.getAsyncItem(StorageKey.commandMenu);
    return JSON.parse(value) as UserCommand[]
  }
  static async getBaseURL(): Promise<string> {
    return await this.getAsyncItem(StorageKey.baseURL);
  }
  static async setBaseURL(baseURL: string): Promise<void> {
    await this.setAsyncItem(StorageKey.baseURL, baseURL);
  }
  //#end region
}

export default StorageService;
