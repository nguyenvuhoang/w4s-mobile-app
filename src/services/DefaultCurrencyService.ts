// src/services/DefaultCurrencyService.ts

import STORAGE_KEY from '@/constants/StorageKey';
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

class DefaultCurrencyService {
  async getDefaultCurrency(): Promise<DefaultCurrency> {
    try {
      const storedCurrencyStr = await StorageService.getItem(STORAGE_KEY.defaultCurrency);
      
      if (storedCurrencyStr) {
        const storedCurrency = JSON.parse(storedCurrencyStr);
        console.log('[DefaultCurrency] Loaded from storage:', storedCurrency);
        return storedCurrency;
      }
      
      console.log('[DefaultCurrency] No stored currency, using default VND');
      return DEFAULT_VND;
    } catch (error) {
      console.error('[DefaultCurrency] Failed to get default currency:', error);
      return DEFAULT_VND;
    }
  }

  /**
   * Set default currency for app
   * @param currency - Currency object to set as default
   */
  async setDefaultCurrency(currency: DefaultCurrency): Promise<void> {
    try {
      const currencyStr = JSON.stringify(currency);
      await StorageService.setItem(STORAGE_KEY.defaultCurrency, currencyStr);
      console.log('[DefaultCurrency] Saved to storage:', currency);
    } catch (error) {
      console.error('[DefaultCurrency] Failed to set default currency:', error);
      throw error;
    }
  }

  /**
   * Reset default currency to VND
   */
  async resetToDefault(): Promise<void> {
    try {
      const currencyStr = JSON.stringify(DEFAULT_VND);
      await StorageService.setItem(STORAGE_KEY.defaultCurrency, currencyStr);
      console.log('[DefaultCurrency] Reset to VND');
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
      console.log('[DefaultCurrency] Cleared from storage');
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