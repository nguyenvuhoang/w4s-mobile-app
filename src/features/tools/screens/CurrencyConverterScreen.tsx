import AppHeader from "@/components/base/AppHeader";
import MoneyInput from "@/components/base/MoneyInput";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: Currency[] = [
  { code: "VND", symbol: "đ", name: "Việt Nam Đồng" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

// Mock exchange rates (VND as base)
const EXCHANGE_RATES: Record<string, number> = {
  VND: 1,
  USD: 25317,
  EUR: 27500,
  JPY: 170,
  GBP: 31800,
};

const CurrencyConverterScreen = () => {
  const { colors } = useAppTheme();
  
  const [fromCurrency, setFromCurrency] = useState<Currency>(CURRENCIES[0]); // VND
  const [toCurrency, setToCurrency] = useState<Currency>(CURRENCIES[1]); // USD
  const [fromAmount, setFromAmount] = useState<number>(1000000);
  const [toAmount, setToAmount] = useState<number>(0);

  const handleSwapCurrencies = () => {
    const tempCurrency = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    setFromAmount(toAmount);
  };

  const calculateConversion = (amount: number, from: string, to: string) => {
    if (!amount || amount === 0) {
      setToAmount(0);
      return;
    }

    // Convert to VND first, then to target currency
    const amountInVND = amount * EXCHANGE_RATES[from];
    const result = amountInVND / EXCHANGE_RATES[to];
    
    // Round based on currency
    if (to === "VND") {
      setToAmount(Math.round(result));
    } else {
      setToAmount(Math.round(result * 100) / 100);
    }
  };

  const handleFromAmountChange = (value: number) => {
    setFromAmount(value);
    calculateConversion(value, fromCurrency.code, toCurrency.code);
  };

  const getExchangeRate = () => {
    const rate = EXCHANGE_RATES[toCurrency.code] / EXCHANGE_RATES[fromCurrency.code];
    return rate.toLocaleString("en-US", { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 4 
    });
  };

  useEffect(() => {
    calculateConversion(fromAmount, fromCurrency.code, toCurrency.code);
  }, [fromCurrency, toCurrency]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Quy đổi tiền tệ" showBackButton />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Subtitle */}
        <ThemedText style={[styles.subtitle, { color: colors.text }]}>
          Chuyển đổi tiền tệ theo tỷ giá hiện tại
        </ThemedText>

        {/* Main Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* From Currency */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Từ
              </ThemedText>
              <TouchableOpacity
                style={[styles.currencyBadge, { backgroundColor: colors.background }]}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.currencyBadgeText, { color: colors.text }]}>
                  {fromCurrency.code}
                </ThemedText>
                <Ionicons name="chevron-down" size={normalize(16)} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <MoneyInput
              value={fromAmount}
              onChange={handleFromAmountChange}
              currency={fromCurrency.symbol}
              placeholder="0"
              containerStyle={styles.largeInputContainer}
              currencyStyle={styles.largeCurrency}
              inputStyle={styles.largeInput}
            />

            <ThemedText style={[styles.currencyName, { color: colors.icon }]}>
              {fromCurrency.name}
            </ThemedText>
          </View>

          {/* Swap Button */}
          <View style={styles.swapContainer}>
            <TouchableOpacity
              style={[styles.swapButton, { backgroundColor: colors.tint }]}
              onPress={handleSwapCurrencies}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-vertical" size={normalize(24)} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* To Currency */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Đến
              </ThemedText>
              <TouchableOpacity
                style={[styles.currencyBadge, { backgroundColor: colors.background }]}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.currencyBadgeText, { color: colors.text }]}>
                  {toCurrency.code}
                </ThemedText>
                <Ionicons name="chevron-down" size={normalize(16)} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <MoneyInput
              value={toAmount}
              onChange={() => {}}
              currency={toCurrency.symbol}
              placeholder="0"
              editable={false}
              highlightMode={true}
              containerStyle={styles.largeInputContainer}
              currencyStyle={styles.largeCurrency}
              inputStyle={styles.largeInput}
            />

            <ThemedText style={[styles.currencyName, { color: colors.icon }]}>
              {toCurrency.name}
            </ThemedText>
          </View>
        </View>

        {/* Exchange Rate Card */}
        <View style={[styles.rateCard, { backgroundColor: colors.card }]}>
          <View style={[styles.rateIconWrapper, { backgroundColor: colors.tint + "20" }]}>
            <Ionicons name="analytics-outline" size={normalize(24)} color={colors.tint} />
          </View>
          
          <View style={styles.rateInfo}>
            <ThemedText style={[styles.rateLabel, { color: colors.icon }]}>
              Tỷ giá chuyển đổi
            </ThemedText>
            <ThemedText style={[styles.rateValue, { color: colors.text }]}>
              1 {fromCurrency.code} = {getExchangeRate()} {toCurrency.code}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.disclaimer, { color: colors.icon }]}>
          * Tỷ giá mang tính tham khảo, có thể khác so với thực tế
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(16),
  },

  // Subtitle
  subtitle: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    opacity: 0.7,
    lineHeight: normalize(20),
  },

  // Card
  card: {
    borderRadius: normalize(16),
    padding: normalize(20),
    gap: normalize(24),
  },

  // Section
  section: {
    gap: normalize(12),
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    lineHeight: normalize(20),
  },

  // Currency Badge
  currencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(100),
  },
  currencyBadgeText: {
    fontSize: normalize(14),
    fontFamily: Fonts.bold,
  },

  // Currency Name
  currencyName: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
  },

  // Large Input Styles (for Currency Converter)
  largeInputContainer: {
    height: normalize(60),
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderRadius: 0,
  },
  largeCurrency: {
    fontSize: normalize(24),
    marginRight: normalize(8),
  },
  largeInput: {
    fontSize: normalize(32),
  },

  // Swap
  swapContainer: {
    alignItems: "center",
    marginVertical: normalize(-8),
  },
  swapButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Rate Card
  rateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: normalize(16),
    borderRadius: normalize(16),
    gap: normalize(12),
  },
  rateIconWrapper: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  rateInfo: {
    flex: 1,
    gap: normalize(4),
  },
  rateLabel: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
  },
  rateValue: {
    fontSize: normalize(15),
    fontFamily: Fonts.bold,
  },

  // Disclaimer
  disclaimer: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    textAlign: "center",
    opacity: 0.6,
  },
});

export default CurrencyConverterScreen;