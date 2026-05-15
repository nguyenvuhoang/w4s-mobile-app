import { useMemo } from 'react';
import { useExchangeRate } from './useExchangeRate';

interface UseCurrencyConversionParams {
  amount: number | string;
  fromCurrencyId?: string;
  toCurrencyId?: string;
}

export const useCurrencyConversion = ({
  amount,
  fromCurrencyId,
  toCurrencyId,
}: UseCurrencyConversionParams) => {
  const { convert } = useExchangeRate();

  const needsConversion = !!(fromCurrencyId && toCurrencyId && fromCurrencyId !== toCurrencyId);

  const exchangeRate = useMemo(() => {
    if (!needsConversion || !fromCurrencyId || !toCurrencyId) return null;
    const rate = convert(1, fromCurrencyId, toCurrencyId);
    if (rate === null) return null;
    
    const isVND = toCurrencyId === 'VND' || toCurrencyId === 'VNĐ';
    return isVND ? Math.round(rate) : Math.round(rate * 10000) / 10000;
  }, [needsConversion, fromCurrencyId, toCurrencyId, convert]);

  const convertedAmount = useMemo(() => {
    if (!needsConversion || !fromCurrencyId || !toCurrencyId || !amount) return null;
    
    let numAmount = 0;
    if (typeof amount === 'string') {
      numAmount = parseFloat(amount.replace(/,/g, ''));
    } else {
      numAmount = amount;
    }
    
    if (isNaN(numAmount) || numAmount <= 0) return null;

    const result = convert(numAmount, fromCurrencyId, toCurrencyId);
    if (result === null) return null;
    
    const isVND = toCurrencyId === 'VND' || toCurrencyId === 'VNĐ';
    return isVND ? Math.round(result) : Math.round(result * 100) / 100;
  }, [needsConversion, amount, fromCurrencyId, toCurrencyId, convert]);

  return {
    needsConversion,
    exchangeRate,
    convertedAmount,
  };
};
