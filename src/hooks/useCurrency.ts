// src/features/currency/hooks/useCurrency.ts

import { AppConfig } from '@/config/AppConfig';
import { Currency, currencyRepository } from '@/services/repositories/currency.repository';
import { useEffect, useRef, useState } from 'react';

interface UseCurrencyOptions {
  autoFetch?: boolean;
  forceRefresh?: boolean;
  searchText?: string;
  pageSize?: number;
}

// Global cache object shared between hook and services
export const currencyCache = {
  data: null as {
    currencies: Currency[];
    totalCount: number;
    timestamp: number;
    searchText: string;
  } | null,
  
  clear() {
    this.data = null;
  }
};

/**
 * Parse currency name from various formats (String, JSON String, or Object)
 */
export const parseCurrencyName = (currency: Currency | any): string => {
  if (!currency) return '';
  
  try {
    const rawName = currency.currency_name || currency.name || currency.country_name;
    if (!rawName) return currency.currency_id || '';

    // If it's already an object
    if (typeof rawName === 'object') {
      return rawName.CurrencyName1 || rawName.CurrencyName2 || rawName.vi || rawName.en || currency.currency_id;
    }

    // If it's a string that might be JSON
    if (typeof rawName === 'string' && rawName.startsWith('{')) {
      const parsed = JSON.parse(rawName);
      return parsed.CurrencyName1 || parsed.CurrencyName2 || parsed.vi || parsed.en || rawName;
    }

    return rawName;
  } catch (error) {
    return currency.currency_id || '';
  }
};

/**
 * Process raw currencies from API: parse names and sort by display order
 */
const processCurrencies = (rawCurrencies: Currency[]): Currency[] => {
  return [...rawCurrencies].sort(
    (a, b) => (a.display_order || 0) - (b.display_order || 0),
  );
};

interface FetchCurrenciesResult {
  currencies: Currency[];
  totalCount: number;
  fromCache: boolean;
}

// Shared registry for in-flight requests to prevent duplicate calls
const inFlightRequests = new Map<string, Promise<FetchCurrenciesResult>>();

/**
 * Core fetch logic shared between Hook and other services.
 */
export const fetchCurrenciesFromApi = async (
  searchText: string = '', 
  pageIndex: number = 0, 
  pageSize: number = 40,
  skipCache: boolean = false
): Promise<FetchCurrenciesResult> => {
  const requestKey = `${searchText}-${pageIndex}-${pageSize}`;

  // 1. Deduplication: Join existing in-flight request if parameters match
  if (!skipCache && inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  // 2. Cache Check: Return cached data if first page and matches search
  if (
    !skipCache &&
    pageIndex === 0 &&
    currencyCache.data &&
    currencyCache.data.searchText === searchText
  ) {
    const isExpired = Date.now() - currencyCache.data.timestamp > AppConfig.CACHE.CATEGORY_TIMEOUT;
    if (!isExpired) {
      return {
        currencies: currencyCache.data.currencies,
        totalCount: currencyCache.data.totalCount,
        fromCache: true
      };
    }
  }

  // 3. Execution: Create new fetch promise
  const fetchPromise = (async () => {
    try {
      const response = await currencyRepository.getCurrencies({
        search_text: searchText,
        page_index: pageIndex,
        page_size: pageSize,
      });

      if (!response.isSuccess() || !response.data) {
        throw new Error(response.message || 'Failed to fetch currencies');
      }

      const rawCurrencies = response.data.items || [];
      const total = response.data.total_count || 0;
      const processedCurrencies = processCurrencies(rawCurrencies);

      // Persist to global cache if it's the first page
      if (pageIndex === 0) {
        currencyCache.data = {
          currencies: processedCurrencies,
          totalCount: total,
          timestamp: Date.now(),
          searchText: searchText,
        };
      }

      return {
        currencies: processedCurrencies,
        totalCount: total,
        fromCache: false
      };
    } finally {
      inFlightRequests.delete(requestKey);
    }
  })();

  // 4. Registry: Save in-flight request to allow deduplication
  if (!skipCache) {
    inFlightRequests.set(requestKey, fetchPromise);
  }
  
  return fetchPromise;
};

/**
 * Hook for managing and searching currencies with built-in pagination and caching.
 */
export const useCurrency = (options: UseCurrencyOptions = {}) => {
  const { 
    autoFetch = true, 
    forceRefresh = false,
    searchText = '',
    pageSize = 40 
  } = options;

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const isFetchingRef = useRef(false);
  const initializedRef = useRef(false);

  const removeDuplicates = (list: Currency[]): Currency[] => {
    const seen = new Set<string>();
    return list.filter(item => {
      if (seen.has(item.currency_id)) return false;
      seen.add(item.currency_id);
      return true;
    });
  };

  const fetchCurrencies = async (skipCache = false, page = 0) => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchCurrenciesFromApi(searchText, page, pageSize, skipCache);

      if (page === 0) {
        setCurrencies(result.currencies);
        setCurrentPage(0);
      } else {
        setCurrencies(prev => removeDuplicates([...prev, ...result.currencies]));
        setCurrentPage(page);
      }

      setTotalCount(result.totalCount);
      setHasMore((page + 1) * pageSize < result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch currencies');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) fetchCurrencies(false, currentPage + 1);
  };

  const search = () => {
    currencyCache.clear();
    fetchCurrencies(true, 0);
  };

  const refetch = () => {
    currencyCache.clear();
    fetchCurrencies(true, 0);
  };

  // Main lifecycle for fetching and search text changes
  useEffect(() => {
    if (!autoFetch) return;
    
    // On mount or when searchText changes, reset and fetch
    fetchCurrencies(forceRefresh, 0);
  }, [searchText, autoFetch]); 

  return {
    currencies,
    totalCount,
    loading,
    error,
    hasMore,
    currentPage,
    loadMore,
    search,
    refetch,
    clearCache: () => currencyCache.clear(),
    parseCurrencyName,
  };
};