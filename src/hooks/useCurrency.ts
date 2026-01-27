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
 * Parse currency name from various formats
 */
export const parseCurrencyName = (currency: Currency | any): string => {
  try {
    // Nếu currency_name là string, trả về luôn
    const name = currency.currency_name || currency.name;
    
    if (typeof name === 'string') {
      try {
        // Try parsing if string looks like JSON
        if (name.startsWith('{')) {
          const parsed = JSON.parse(name);
          return parsed.CurrencyName1 || parsed.CurrencyName2 || parsed.vi || parsed.en || name;
        }
        return name || currency.currency_id;
      } catch {
        return name || currency.currency_id;
      }
    }

    // Nếu là object, lấy field phù hợp
    if (typeof name === 'object') {
       return name.CurrencyName1 || name.CurrencyName2 || name.vi || name.en || currency.currency_id;
    }
    
    return currency.currency_id || '';
  } catch (error) {
    console.warn('[useCurrency] Failed to parse currency name:', error);
    return currency.currency_id || '';
  }
};

/**
 * Process raw currencies from API
 */
const processCurrencies = (rawCurrencies: Currency[]): Currency[] => {
  const mapped = rawCurrencies.map((c) => ({
    ...c,
    displayName: parseCurrencyName(c),
  }));

  const sorted = mapped.sort((a, b) => a.display_order - b.display_order);
  return sorted;
};

/**
 * Fetch currencies logic - can be used by Hook or Service
 */
export const fetchCurrenciesFromApi = async (
  searchText: string = '', 
  pageIndex: number = 0, 
  pageSize: number = 40,
  skipCache: boolean = false
) => {
  // Check cache for first page and matching search
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

  // Call API
  const response = await currencyRepository.getCurrencies({
    search_text: searchText,
    page_index: pageIndex,
    page_size: pageSize,
  });

  if (response.isSuccess() && response.data) {
    const rawCurrencies = response.data.items || [];
    const total = response.data.total_count || 0;
    const processedCurrencies = processCurrencies(rawCurrencies);

    // Update Cache if first page
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
  } else {
    throw new Error(response.message || 'Failed to fetch currencies');
  }
};

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
  const lastSearchRef = useRef(searchText);

  const removeDuplicates = (currencyList: Currency[]): Currency[] => {
    const seen = new Set<string>();
    return currencyList.filter((currency) => {
      if (seen.has(currency.currency_id)) {
        return false;
      }
      seen.add(currency.currency_id);
      return true;
    });
  };

  /**
   * Fetch currencies using shared logic
   */
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
        setCurrencies((prev) => {
          const combined = [...prev, ...result.currencies];
          return removeDuplicates(combined);
        });
        setCurrentPage(page);
      }

      setTotalCount(result.totalCount);
      setHasMore((page + 1) * pageSize < result.totalCount);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch currencies';
      setError(errorMessage);
      console.error('[useCurrency] Error:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const loadMore = () => {
    if (hasMore && !loading && !isFetchingRef.current) {
      fetchCurrencies(false, currentPage + 1);
    }
  };

  const search = (text: string) => {
    currencyCache.clear();
    setCurrentPage(0);
    setCurrencies([]);
    fetchCurrencies(true, 0);
  };

  const refetch = () => {
    currencyCache.clear();
    setCurrentPage(0);
    setCurrencies([]);
    fetchCurrencies(true, 0);
  };

  const clearCache = () => {
    currencyCache.clear();
  };

  useEffect(() => {
    if (autoFetch && searchText !== lastSearchRef.current) {
      lastSearchRef.current = searchText;
      setCurrencies([]);
      setCurrentPage(0);
      setHasMore(true);
      fetchCurrencies(forceRefresh, 0);
    }
  }, [searchText]);

  useEffect(() => {
    if (autoFetch) {
      fetchCurrencies(forceRefresh, 0);
    }
  }, []); 

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
    clearCache,
    parseCurrencyName,
  };
};