// src/services/DefaultCurrencyService.ts

import { default as STORAGE_KEY, default as StorageKey } from '@/constants/StorageKey';
import { fetchCurrenciesFromApi, parseCurrencyName } from '@/hooks/useCurrency';
import { systemRepository } from '@/services/repositories/system.repository';
import StorageService from './StorageService';

export interface DefaultCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

const DEFAULT_VND: DefaultCurrency = {
  currencyId: 'VND',
  symbol: '₫',
  name: 'Vietnamese Dong',
};

class DefaultCurrencyService {
  /**
   * Get default currency - Priority: Cache -> API (WF_MB_SIMPLE_SEARCH_CURRENCY)
   * 1. Check local storage cache first
   * 2. If no cache, get currency_code from AppInfo then call API to get full info
   */
  async getDefaultCurrency(): Promise<DefaultCurrency> {
    // 1. First, check local storage cache (highest priority)
    try {
      const storedCurrencyStr = await StorageService.getItem(STORAGE_KEY.defaultCurrency);
      
      if (storedCurrencyStr) {
        const storedCurrency = JSON.parse(storedCurrencyStr);
        console.log('[DefaultCurrency] Using cached currency:', storedCurrency.currencyId);
        return storedCurrency;
      }
    } catch (error) {
      console.warn('[DefaultCurrency] Storage read failed:', error);
    }

    // 2. No cache - get currency_code from AppInfo and fetch from API
    try {
      const appInfoStr = await StorageService.getAsyncItem(StorageKey.appInfo);
      
      if (appInfoStr) {
        const appInfo = JSON.parse(appInfoStr);
        const currencyCode = appInfo.currency_code;
        
        if (currencyCode) {
          console.log('[DefaultCurrency] No cache, fetching from API for:', currencyCode);
          
          // Call API to get currency info using shared logic from useCurrency
          // search_text = currencyCode to find exact match
          const result = await fetchCurrenciesFromApi(currencyCode, 0, 10, false);
          
          const currencies = result.currencies || [];
          
          // Find exact match for currency_id
          const matchedCurrency = currencies.find(
            (c: any) => c.currency_id === currencyCode || c.short_currency_id === currencyCode
          );

          if (matchedCurrency) {
             const currency: DefaultCurrency = {
              currencyId: matchedCurrency.currency_id,
              symbol: matchedCurrency.symbol || currencyCode,
              name: parseCurrencyName(matchedCurrency) || currencyCode,
            };
            
            // Cache to local storage for future use
            await this.cacheToStorage(currency);
            console.log('[DefaultCurrency] Fetched and cached from API:', currency);
            return currency;
          }
        }
      }
    } catch (error) {
      console.warn('[DefaultCurrency] Failed to get currency from AppInfo/API:', error);
    }

    // 3. Fallback to VND
    console.log('[DefaultCurrency] Using fallback VND');
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
