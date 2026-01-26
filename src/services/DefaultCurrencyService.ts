// src/services/DefaultCurrencyService.ts

import { default as STORAGE_KEY, default as StorageKey } from '@/constants/StorageKey';
import { systemRepository } from '@/services/repositories/system.repository';
import StorageService from './StorageService';

export interface DefaultCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

const DEFAULT_VND: DefaultCurrency = {
  currencyId: 'VND',
  symbol: 'đ',
  name: 'Vietnamese Dong',
};

// Currency symbol mapping for common currencies
const CURRENCY_SYMBOLS: Record<string, { symbol: string; name: string }> = {
  VND: { symbol: '₫', name: 'Vietnamese Dong' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
  KRW: { symbol: '₩', name: 'Korean Won' },
  THB: { symbol: '฿', name: 'Thai Baht' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
};

class DefaultCurrencyService {
  /**
   * Get default currency - reads from AppInfo (loaded during login) or local storage
   */
  async getDefaultCurrency(): Promise<DefaultCurrency> {
    // First, check local storage cache (set by user or synced from AppInfo)
    try {
      const storedCurrencyStr = await StorageService.getItem(STORAGE_KEY.defaultCurrency);
      
      if (storedCurrencyStr) {
        const storedCurrency = JSON.parse(storedCurrencyStr);
        return storedCurrency;
      }
    } catch (error) {
      console.warn('[DefaultCurrency] Storage read failed:', error);
    }

    // Try to get from AppInfo (cached during login)
    try {
      const appInfoStr = await StorageService.getAsyncItem(StorageKey.appInfo);
      
      if (appInfoStr) {
        const appInfo = JSON.parse(appInfoStr);
        const currencyCode = appInfo.currency_code;
        
        if (currencyCode) {
          const currencyInfo = CURRENCY_SYMBOLS[currencyCode] || { 
            symbol: currencyCode, 
            name: currencyCode 
          };
          
          const currency: DefaultCurrency = {
            currencyId: currencyCode,
            symbol: currencyInfo.symbol,
            name: currencyInfo.name,
          };
          
          // Cache to local storage for future use
          await this.cacheToStorage(currency);
          return currency;
        }
      }
    } catch (error) {
      console.warn('[DefaultCurrency] AppInfo read failed:', error);
    }

    return DEFAULT_VND;
  }

  /**
   * Set default currency for app - saves to API and local storage
   * @param currency - Currency object to set as default
   */
  async setDefaultCurrency(currency: DefaultCurrency): Promise<void> {
    // Save to local storage first (cache for offline)
    await this.cacheToStorage(currency);
    
    // Sync with API
    try {
      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
      if (!userCode) {
        throw new Error("Missing user code");
      }
      const response = await systemRepository.updateAppSettings(
        userCode,
        currency.currencyId
      );
      
      if (!response.isSuccess()) {
        console.warn('[DefaultCurrency] API sync failed:', response.message);
      }
    } catch (error) {
      console.error('[DefaultCurrency] Failed to sync with API:', error);
    }
  }

  /**
   * Cache currency to local storage
   */
  private async cacheToStorage(currency: DefaultCurrency): Promise<void> {
    const currencyStr = JSON.stringify(currency);
    await StorageService.setItem(STORAGE_KEY.defaultCurrency, currencyStr);
  }

  /**
   * Reset default currency to VND
   */
  async resetToDefault(): Promise<void> {
    try {
      const currencyStr = JSON.stringify(DEFAULT_VND);
      await StorageService.setItem(STORAGE_KEY.defaultCurrency, currencyStr);
    } catch (error) {
      console.error('[DefaultCurrency] Failed to reset default currency:', error);
      throw error;
    }
  }

  /**
   * Clear default currency (for logout/cleanup)
   */
  async clearDefaultCurrency(): Promise<void> {
    try {
      await StorageService.removeItem(STORAGE_KEY.defaultCurrency);
    } catch (error) {
      console.error('[DefaultCurrency] Failed to clear default currency:', error);
    }
  }

  /**
   * Get default currency ID only
   */
  async getDefaultCurrencyId(): Promise<string> {
    const currency = await this.getDefaultCurrency();
    return currency.currencyId;
  }

  /**
   * Get default currency symbol only
   */
  async getDefaultCurrencySymbol(): Promise<string> {
    const currency = await this.getDefaultCurrency();
    return currency.symbol;
  }
}

export default new DefaultCurrencyService();
