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

// Session cache - chỉ tồn tại trong runtime, mất khi tắt app
let sessionCache: {
  currencies: Currency[];
  totalCount: number;
  timestamp: number;
  searchText: string;
} | null = null;

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

  const parseCurrencyName = (currency: Currency): string => {
    try {
      // Nếu currency_name là string, trả về luôn
      if (typeof currency.currency_name === 'string') {
        return currency.currency_name || currency.currency_id;
      }

      // Nếu là object, parse JSON
      const nameObj = typeof currency.currency_name === 'object' 
        ? currency.currency_name 
        : JSON.parse(currency.currency_name);
      
      return (
        nameObj.CurrencyName1 ||
        nameObj.CurrencyName2 ||
        nameObj.CurrencyName3 ||
        currency.currency_id
      );
    } catch (error) {
      console.warn('[useCurrency] Failed to parse currency name:', error);
      return currency.currency_id;
    }
  };

  const processCurrencies = (rawCurrencies: Currency[]): Currency[] => {

    
    const mapped = rawCurrencies.map((c) => ({
      ...c,
      displayName: parseCurrencyName(c),
    }));

    
    const sorted = mapped.sort((a, b) => a.display_order - b.display_order);

    
    return sorted;
  };

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
   * Fetch currencies from API
   */
  const fetchCurrencies = async (skipCache = false, page = 0) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {

      return;
    }

    // Check cache for first page and matching search
    if (
      !skipCache &&
      page === 0 &&
      sessionCache &&
      sessionCache.searchText === searchText
    ) {
      const isExpired =
        Date.now() - sessionCache.timestamp > AppConfig.CACHE.CATEGORY_TIMEOUT;

      if (!isExpired) {
        // console.log('[useCurrency] Using cached data:', sessionCache.currencies.length, 'items');
        setCurrencies(sessionCache.currencies);
        setTotalCount(sessionCache.totalCount);
        setCurrentPage(0);
        setHasMore(sessionCache.currencies.length < sessionCache.totalCount);
        return;
      } else {
        // console.log('[useCurrency] Cache expired, fetching new data');
      }
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {

      
      const response = await currencyRepository.getCurrencies({
        search_text: searchText,
        page_index: page,
        page_size: pageSize,
      });

      if (response.isSuccess() && response.data) {
        const rawCurrencies = response.data.items || [];
        const total = response.data.total_count || 0;
        const processedCurrencies = processCurrencies(rawCurrencies);



        if (page === 0) {
          // First page - reset
          // console.log('[useCurrency] Setting first page with', processedCurrencies.length, 'items');
          setCurrencies(processedCurrencies);
          setCurrentPage(0);

          // Cache first page
          sessionCache = {
            currencies: processedCurrencies,
            totalCount: total,
            timestamp: Date.now(),
            searchText: searchText,
          };
        } else {
          // Load more - append và remove duplicates
          setCurrencies((prev) => {
            const combined = [...prev, ...processedCurrencies];
            const deduplicated = removeDuplicates(combined);

            return deduplicated;
          });
          setCurrentPage(page);
        }

        setTotalCount(total);
        setHasMore((page + 1) * pageSize < total);
      } else {
        throw new Error(response.message || 'Failed to fetch currencies');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch currencies';
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

    sessionCache = null;
    setCurrentPage(0);
    setCurrencies([]);
    fetchCurrencies(true, 0);
  };


  const refetch = () => {

    sessionCache = null;
    setCurrentPage(0);
    setCurrencies([]);
    fetchCurrencies(true, 0);
  };

  const clearCache = () => {

    sessionCache = null;
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