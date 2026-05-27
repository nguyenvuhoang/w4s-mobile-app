// src/hooks/useCurrencyConverter.ts

import { useCurrency } from "@/hooks/useCurrency";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import {
  Currency,
  currencyRepository,
} from "@/services/repositories/currency.repository";
import {
  detectLocale,
  detectSymbolPosition,
  getDecimalPlaces,
} from "@/utils/currencyLocaleDetector";
import { useCallback, useEffect, useMemo, useState } from "react";

const normalizeCurrencyCode = (code: string): string => {
  if (!code) return '';
  let clean = code.trim().toUpperCase();
  if (clean === 'VNĐ') {
    clean = 'VND';
  }
  return clean;
};

/**
 * Hook để chuyển đổi tiền tệ từ VND (server response) sang đơn vị mặc định của user
 * Tự động update khi user thay đổi default currency
 */
export const useCurrencyConverter = () => {
  const { defaultCurrency, loading: currencyLoading } = useDefaultCurrency();
  const { currencies, loading: currenciesLoading } = useCurrency({
    autoFetch: false,
  });
  const { convert, loading: ratesLoading, rates } = useExchangeRate();

  const [additionalCurrency, setAdditionalCurrency] = useState<Currency | null>(
    null,
  );
  const [loadingAdditional, setLoadingAdditional] = useState(false);

  // Reset additional currency khi default currency thay đổi
  useEffect(() => {
    setAdditionalCurrency(null);
  }, [defaultCurrency.currencyId]);

  // Combine currencies từ useCurrency + additional currency nếu cần
  const allCurrencies = useMemo(() => {
    if (
      additionalCurrency &&
      !currencies.find((c) => c.currency_id === additionalCurrency.currency_id)
    ) {
      return [...currencies, additionalCurrency];
    }
    return currencies;
  }, [currencies, additionalCurrency]);

  // Tạo map để tra cứu currency nhanh
  const currencyMap = useMemo(() => {
    const map = new Map();
    allCurrencies.forEach((currency) => {
      map.set(currency.currency_id, currency);
    });

    return map;
  }, [allCurrencies, defaultCurrency.currencyId]);

  // Fetch default currency nếu không có trong list
  useEffect(() => {
    const fetchDefaultCurrency = async () => {
      // Skip nếu đang loading
      if (currenciesLoading || loadingAdditional) {
        return;
      }

      // QUAN TRỌNG: VND là base currency, không cần fetch
      if (
        defaultCurrency.currencyId === "VND" ||
        defaultCurrency.currencyId === "VNĐ"
      ) {
        const hasVND = allCurrencies.some(
          (c) => c.currency_id === "VND" || c.currency_id === "VNĐ",
        );
        if (!hasVND) {
          const mockVND: Currency = {
            currency_id: "VND",
            short_currency_id: "VND",
            currency_name: "Vietnamese Dong",
            currency_number: 704,
            status_of_currency: "active",
            display_order: 0,
            symbol: "₫",
            country_code: "VN",
            country_name: "Vietnam",
          };

          setAdditionalCurrency(mockVND);
        }
        return;
      }

      // Check xem default currency có trong list không
      const hasDefaultCurrency = allCurrencies.some(
        (c) => c.currency_id === defaultCurrency.currencyId,
      );

      if (!hasDefaultCurrency) {
        try {
          setLoadingAdditional(true);

          const response = await currencyRepository.getCurrencies({
            search_text: defaultCurrency.currencyId,
            page_index: 0,
            page_size: 1,
          });

          if (response.isSuccess() && response.data?.items?.length > 0) {
            const currency = response.data.items[0];
            setAdditionalCurrency(currency);
          } else {
            console.warn(
              "[useCurrencyConverter] ❌ Could not fetch:",
              defaultCurrency.currencyId,
            );
          }
        } catch (error) {
          console.error("[useCurrencyConverter] Error fetching:", error);
        } finally {
          setLoadingAdditional(false);
        }
      }
    };

    fetchDefaultCurrency();
  }, [
    defaultCurrency.currencyId,
    allCurrencies.length,
    currenciesLoading,
    loadingAdditional,
  ]);

  // Lấy Currency object đầy đủ của default currency
  const targetCurrencyObject = useMemo(() => {
    let found = currencyMap.get(defaultCurrency.currencyId);

    if (!found && defaultCurrency.currencyId === "VND") {
      found = currencyMap.get("VNĐ");
    }

    if (!found && defaultCurrency.currencyId === "VNĐ") {
      found = currencyMap.get("VND");
    }

    return found;
  }, [currencyMap, defaultCurrency.currencyId]);

  // Lấy chi tiết format cho từng đồng tiền
  const getCurrencyDetails = useCallback(
    (currencyId: string) => {
      const cleanId = normalizeCurrencyCode(currencyId);
      let found = currencyMap.get(cleanId);
      if (!found && cleanId === "VND") {
        found = currencyMap.get("VNĐ");
      }
      if (!found && cleanId === "VNĐ") {
        found = currencyMap.get("VND");
      }

      if (found) {
        return {
          symbol: found.symbol,
          symbolPosition: detectSymbolPosition(found.currency_id),
          decimalPlaces: getDecimalPlaces(found.currency_id),
          locale: detectLocale(found),
        };
      }

      // Fallback cho VND và USD
      if (cleanId === "VND") {
        return {
          symbol: "₫",
          symbolPosition: "after" as const,
          decimalPlaces: 0,
          locale: "vi-VN",
        };
      }
      if (cleanId === "USD") {
        return {
          symbol: "$",
          symbolPosition: "before" as const,
          decimalPlaces: 2,
          locale: "en-US",
        };
      }

      return {
        symbol: currencyId,
        symbolPosition: "before" as const,
        decimalPlaces: 2,
        locale: "en-US",
      };
    },
    [currencyMap],
  );

  // Tạo formatter info cho default currency
  const currencyFormatter = useMemo(() => {
    const details = getCurrencyDetails(defaultCurrency.currencyId);
    return {
      ...details,
      currencyId: defaultCurrency.currencyId || "VND",
    };
  }, [getCurrencyDetails, defaultCurrency.currencyId]);

  // Check if ready
  const isReady = useMemo(() => {
    const isVND =
      defaultCurrency.currencyId === "VND" ||
      defaultCurrency.currencyId === "VNĐ";

    if (isVND) {
      const ready = !currencyLoading && !currenciesLoading && !ratesLoading;

      return ready;
    }

    const ready =
      !currencyLoading &&
      !currenciesLoading &&
      !loadingAdditional &&
      !ratesLoading &&
      allCurrencies.length > 0 &&
      rates.length > 0 &&
      !!targetCurrencyObject;

    return ready;
  }, [
    currencyLoading,
    currenciesLoading,
    loadingAdditional,
    ratesLoading,
    rates.length,
    allCurrencies.length,
    targetCurrencyObject,
    defaultCurrency.currencyId,
  ]);
  /**
   * Chuyển đổi từ VND sang default currency
   */
  const convertFromVND = useCallback(
    (amountInVND: number): number => {
      if (
        defaultCurrency.currencyId === "VND" ||
        defaultCurrency.currencyId === "VNĐ"
      ) {
        return amountInVND;
      }

      if (!isReady) {
        console.warn(
          "[useCurrencyConverter] convertFromVND: Not ready, returning original",
          amountInVND,
        );
        return amountInVND;
      }

      const result = convert(amountInVND, "VND", defaultCurrency.currencyId);

      if (result === null) {
        console.warn(
          `[useCurrencyConverter] Conversion failed VND -> ${defaultCurrency.currencyId}`,
        );
        return amountInVND;
      }

      return Math.round(result * 100) / 100;
    },
    [defaultCurrency, convert, isReady],
  );

  /**
   * Format số tiền (hỗ trợ custom currencyId khi fallback hoặc hiển thị ngoại tệ gốc)
   */
  const formatAmount = useCallback(
    (amount: number, customCurrencyId?: string): string => {
      const activeCurrencyId = customCurrencyId || defaultCurrency.currencyId;
      const { locale, symbolPosition, decimalPlaces, symbol } = getCurrencyDetails(activeCurrencyId);
      const cleanCurrencyId = normalizeCurrencyCode(activeCurrencyId);

      try {
        const formatter = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: cleanCurrencyId,
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: Math.max(decimalPlaces, amount > 0 && amount < 1 ? 4 : decimalPlaces),
        });

        const result = formatter.format(amount);
        return result;
      } catch (error) {
        console.warn("[useCurrencyConverter] Intl failed, using fallback");

        const formattedNumber = amount.toLocaleString(locale, {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: Math.max(decimalPlaces, amount > 0 && amount < 1 ? 4 : decimalPlaces),
        });

        const result =
          symbolPosition === "after"
            ? `${formattedNumber} ${symbol}`
            : `${symbol}${formattedNumber}`;

        return result;
      }
    },
    [defaultCurrency, getCurrencyDetails],
  );

  /**
   * Convert và format
   */
  const convertAndFormat = useCallback(
    (amountInVND: number): string => {
      const convertedAmount = convertFromVND(amountInVND);
      const formatted = formatAmount(convertedAmount);

      return formatted;
    },
    [convertFromVND, formatAmount, defaultCurrency.currencyId, isReady],
  );

  /**
   * Format percent
   */
  const formatPercent = useCallback((percent: number): string => {
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  }, []);

  /**
   * Get exchange rate
   */
  const getExchangeRate = useCallback((): number | null => {
    if (
      defaultCurrency.currencyId === "VND" ||
      defaultCurrency.currencyId === "VNĐ"
    ) {
      return 1;
    }

    if (!isReady) {
      return null;
    }

    return convert(1, "VND", defaultCurrency.currencyId);
  }, [defaultCurrency, convert, isReady]);

  /**
   * Convert between currencies
   */
  const convertBetween = useCallback(
    (
      amount: number,
      fromCurrencyId: string,
      toCurrencyId?: string,
    ): number | null => {
      const targetCurrency = toCurrencyId || defaultCurrency.currencyId;
      const normFrom = normalizeCurrencyCode(fromCurrencyId);
      const normTo = normalizeCurrencyCode(targetCurrency);

      if (normFrom === normTo) {
        return amount;
      }

      if (!isReady) {
        return null;
      }

      return convert(amount, normFrom, normTo);
    },
    [defaultCurrency, convert, isReady],
  );

  return {
    defaultCurrency,
    targetCurrencyObject,
    currencyFormatter,
    currencies: allCurrencies,
    loading: currencyLoading || currenciesLoading || loadingAdditional || ratesLoading,
    isReady,
    convertFromVND,
    formatAmount,
    convertAndFormat,
    formatPercent,
    getExchangeRate,
    convertBetween,
    getCurrencyDetails,
  };
};
