// src/features/exchange-rate/hooks/useExchangeRate.ts

import { ExchangeRate, exchangeRateRepository } from '@/services/repositories/exchangeRate.repository';
import { useEffect, useRef, useState } from 'react';

interface UseExchangeRateOptions {
  autoFetch?: boolean;
  forceRefresh?: boolean;
}

let sessionCache: {
  rates: ExchangeRate[];
  rateMap: Map<string, ExchangeRate>;
  timestamp: number;
  rateDate: string;
} | null = null;

let inFlightExchangeRatePromise: Promise<{
  rates: ExchangeRate[];
  rateMap: Map<string, ExchangeRate>;
  rateDate: string;
} | null> | null = null;

const normalizeCurrencyCode = (code: string): string => {
  if (!code) return '';
  let clean = code.trim().toUpperCase();
  if (clean === 'VNĐ') {
    clean = 'VND';
  }
  return clean;
};

export const useExchangeRate = (options: UseExchangeRateOptions = {}) => {
  const { 
    autoFetch = true, 
    forceRefresh = false,
  } = options;

  const [rates, setRates] = useState<ExchangeRate[]>(() => sessionCache?.rates ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateDate, setRateDate] = useState<string>(() => sessionCache?.rateDate ?? '');
  
  const isFetchingRef = useRef(false);
  const updateIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Khởi tạo rateMapRef từ sessionCache ngay lập tức (nếu có), tránh việc convert()
  // trả null trong lần render đầu tiên khi đang chờ useEffect async chạy.
  const rateMapRef = useRef<Map<string, ExchangeRate>>(
    sessionCache?.rateMap ?? new Map()
  );

  const shouldUpdateRate = (): boolean => {
    if (!sessionCache) return true;

    const now = new Date();
    const cacheTime = new Date(sessionCache.timestamp);
    
    const today905 = new Date();
    today905.setHours(9, 5, 0, 0);
    
    if (now >= today905 && cacheTime < today905) {
      console.log('[useExchangeRate] Cache outdated, need update after 9:05');
      return true;
    }

    const isExpired = Date.now() - sessionCache.timestamp > 24 * 60 * 60 * 1000;
    if (isExpired) {
      console.log('[useExchangeRate] Cache expired (>24h)');
      return true;
    }

    return false;
  };

  /**
   * Tính thời gian còn lại đến 9h05 ngày mai
   */
  const getTimeUntilNextUpdate = (): number => {
    const now = new Date();
    const next905 = new Date();
    next905.setHours(9, 5, 0, 0);
    
    // Nếu đã qua 9h05 hôm nay, lấy 9h05 ngày mai
    if (now >= next905) {
      next905.setDate(next905.getDate() + 1);
    }
    
    return next905.getTime() - now.getTime();
  };

  /**
   * Build map để lookup nhanh theo currency_code
   */
  const buildRateMap = (rateList: ExchangeRate[]): Map<string, ExchangeRate> => {
    const map = new Map<string, ExchangeRate>();
    rateList.forEach(rate => {
      if (rate.currency_code) {
        map.set(normalizeCurrencyCode(rate.currency_code), rate);
      }
    });
    return map;
  };

  /**
   * Tìm tỉ giá theo currency code
   */
  const getRate = (currencyCode: string): ExchangeRate | null => {
    return rateMapRef.current.get(normalizeCurrencyCode(currencyCode)) || null;
  };

  /**
   * Chuyển đổi từ VNĐ sang tiền tệ khác
   * @param amountVND - Số tiền VNĐ
   * @param targetCurrency - Mã tiền tệ đích (USD, EUR, etc.)
   * @returns Số tiền sau khi chuyển đổi hoặc null nếu không tìm thấy tỉ giá
   */
  const convertFromVND = (
    amountVND: number,
    targetCurrency: string
  ): number | null => {
    const normTarget = normalizeCurrencyCode(targetCurrency);
    if (normTarget === 'VND') return amountVND;

    const rate = getRate(normTarget);
    if (!rate || !rate.transfer) {
      console.warn(`[useExchangeRate] Rate not found for VND -> ${targetCurrency}`);
      return null;
    }

    // transfer là tỉ giá so với VNĐ, vd: 1 USD = 25,000 VND (transfer = 25000)
    // Để chuyển VNĐ -> USD: amountVND / transfer
    return amountVND / rate.transfer;
  };

  /**
   * Chuyển đổi từ tiền tệ khác sang VNĐ
   * @param amount - Số tiền cần chuyển
   * @param fromCurrency - Mã tiền tệ gốc (USD, EUR, etc.)
   * @returns Số tiền VNĐ hoặc null nếu không tìm thấy tỉ giá
   */
  const convertToVND = (
    amount: number,
    fromCurrency: string
  ): number | null => {
    const normFrom = normalizeCurrencyCode(fromCurrency);
    if (normFrom === 'VND') return amount;

    const rate = getRate(normFrom);
    if (!rate || !rate.transfer) {
      console.warn(`[useExchangeRate] Rate not found for ${fromCurrency} -> VND`);
      return null;
    }

    // transfer là tỉ giá so với VNĐ, vd: 1 USD = 25,000 VND (transfer = 25000)
    // Để chuyển USD -> VNĐ: amount * transfer
    return amount * rate.transfer;
  };

  /**
   * Chuyển đổi giữa 2 loại tiền tệ bất kỳ (qua VNĐ)
   * @param amount - Số tiền cần chuyển
   * @param fromCurrency - Mã tiền tệ gốc
   * @param toCurrency - Mã tiền tệ đích
   * @returns Số tiền sau khi chuyển đổi hoặc null nếu không tìm thấy tỉ giá
   */
  const convert = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number | null => {
    const normFrom = normalizeCurrencyCode(fromCurrency);
    const normTo = normalizeCurrencyCode(toCurrency);
    if (normFrom === normTo) return amount;

    // Chuyển sang VNĐ trước
    const amountVND = convertToVND(amount, normFrom);
    if (amountVND === null) return null;

    // Sau đó chuyển từ VNĐ sang tiền tệ đích
    return convertFromVND(amountVND, normTo);
  };

  /**
   * Fetch tỉ giá từ API
   */
  const fetchExchangeRates = async (skipCache = false) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      return;
    }

    // Check cache
    if (!skipCache && sessionCache && !shouldUpdateRate()) {
      if (__DEV__) {
        console.log('[useExchangeRate] Using cached data:', sessionCache.rates.length, 'rates');
      }
      setRates(sessionCache.rates);
      setRateDate(sessionCache.rateDate);
      rateMapRef.current = sessionCache.rateMap;
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      let sharedPromise = !skipCache ? inFlightExchangeRatePromise : null;
      if (!sharedPromise) {
        if (__DEV__) {
          console.log('[useExchangeRate] Fetching exchange rates...');
        }
        sharedPromise = (async () => {
          try {
            const response = await exchangeRateRepository.getExchangeRates({
              search_text: '',
              page_index: 0,
              page_size: 50,
            });

            if (response.isSuccess() && response.data) {
              const fetchedRates: ExchangeRate[] = response.data.items || [];
              const firstRateDate = fetchedRates.length > 0
                ? fetchedRates[0].rate_date_utc
                : new Date().toISOString();
              const rateMap = buildRateMap(fetchedRates);

              sessionCache = {
                rates: fetchedRates,
                rateMap,
                timestamp: Date.now(),
                rateDate: firstRateDate,
              };

              if (__DEV__) {
                console.log('[useExchangeRate] Received:', fetchedRates.length, 'rates');
              }

              return { rates: fetchedRates, rateMap, rateDate: firstRateDate };
            } else {
              throw new Error(response.message || 'Failed to fetch exchange rates');
            }
          } finally {
            inFlightExchangeRatePromise = null;
          }
        })();
        if (!skipCache) {
          inFlightExchangeRatePromise = sharedPromise;
        }
      }

      const result = await sharedPromise;
      if (result) {
        setRates(result.rates);
        setRateDate(result.rateDate);
        rateMapRef.current = result.rateMap;
        scheduleNextUpdate();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch exchange rates';
      setError(errorMessage);
      console.error('[useExchangeRate] Error:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  /**
   * Lên lịch cập nhật tự động vào 9h05 ngày mai
   */
  const scheduleNextUpdate = () => {
    // Clear existing timeout
    if (updateIntervalRef.current) {
      clearTimeout(updateIntervalRef.current);
    }

    const timeUntilUpdate = getTimeUntilNextUpdate();
    console.log(
      '[useExchangeRate] Next auto-update in:',
      Math.floor(timeUntilUpdate / 1000 / 60),
      'minutes'
    );

    updateIntervalRef.current = setTimeout(() => {
      console.log('[useExchangeRate] Auto-update triggered at 9:05');
      fetchExchangeRates(true);
    }, timeUntilUpdate);
  };

  /**
   * Force refresh tỉ giá
   */
  const refetch = () => {
    console.log('[useExchangeRate] Force refresh');
    sessionCache = null;
    fetchExchangeRates(true);
  };

  /**
   * Clear cache
   */
  const clearCache = () => {
    console.log('[useExchangeRate] Cache cleared');
    sessionCache = null;
    rateMapRef.current = new Map();
    if (updateIntervalRef.current) {
      clearTimeout(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  };

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      console.log('[useExchangeRate] Initial mount, fetch rates');
      fetchExchangeRates(forceRefresh);
    }

    // Cleanup on unmount
    return () => {
      if (updateIntervalRef.current) {
        clearTimeout(updateIntervalRef.current);
      }
    };
  }, []);

  return {
    rates,
    loading,
    error,
    rateDate,
    getRate,
    convertFromVND,
    convertToVND,
    convert,
    refetch,
    clearCache,
  };
};