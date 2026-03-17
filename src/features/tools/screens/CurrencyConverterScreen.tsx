import AppHeader from "@/components/base/AppHeader";
import MoneyInput from "@/components/base/MoneyInput";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface SelectedCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

const CurrencyConverterScreen = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const {
    rates,
    loading: ratesLoading,
    rateDate,
    convert,
    getRate,
    refetch: refetchRates,
  } = useExchangeRate();

  const [fromCurrency, setFromCurrency] = useState<SelectedCurrency>({
    currencyId: "USD",
    symbol: "$",
    name: "US Dollar",
  });

  const [toCurrency, setToCurrency] = useState<SelectedCurrency>({
    currencyId: "VND",
    symbol: "đ",
    name: "Việt Nam Đồng",
  });

  const [fromAmount, setFromAmount] = useState<number>(100);
  const [toAmount, setToAmount] = useState<number>(0);

  const selectingTypeRef = useRef<"from" | "to" | null>(null);

  // =========================
  // Load selected currency
  // =========================
  useFocusEffect(
    useCallback(() => {
      const loadSelectedCurrency = async () => {
        try {
          const data = await StorageService.getItem("temp_selected_currency");
          if (!data || !selectingTypeRef.current) return;

          const currency: SelectedCurrency = JSON.parse(data);

          if (selectingTypeRef.current === "from") {
            setFromCurrency(currency);
          } else {
            setToCurrency(currency);
          }

          await StorageService.removeItem("temp_selected_currency");
          selectingTypeRef.current = null;
        } catch (err) {
          console.error("[CurrencyConverter] load currency error", err);
          selectingTypeRef.current = null;
        }
      };

      loadSelectedCurrency();
    }, [])
  );

  // =========================
  // Calculate conversion
  // =========================
  useEffect(() => {
    if (rates.length === 0) return;
    if (fromAmount < 0) return;

    const result = convert(
      fromAmount,
      fromCurrency.currencyId,
      toCurrency.currencyId
    );

    if (result === null) {
      setToAmount(0);
      return;
    }

    if (toCurrency.currencyId === "VND" || toCurrency.currencyId === "VNĐ") {
      setToAmount(Math.round(result));
    } else {
      setToAmount(Math.round(result * 100) / 100);
    }
  }, [fromAmount, fromCurrency, toCurrency, rates]);

  // =========================
  // Smart exchange rate display
  // =========================
  const getSmartExchangeRate = () => {
    if (!fromCurrency || !toCurrency) return "N/A";

    const isFromVND =
      fromCurrency.currencyId === "VND" ||
      fromCurrency.currencyId === "VNĐ";

    const isToVND =
      toCurrency.currencyId === "VND" || toCurrency.currencyId === "VNĐ";

    // 👉 Ưu tiên hiển thị VND ở bên phải
    if (isToVND) {
      const rate = convert(1, fromCurrency.currencyId, toCurrency.currencyId);
      if (rate === null) return "N/A";

      return `1 ${fromCurrency.currencyId} = ${Math.round(rate).toLocaleString(
        "vi-VN"
      )} ${toCurrency.currencyId}`;
    }

    // 👉 Nếu FROM là VND → đảo chiều
    if (isFromVND) {
      const rate = convert(1, toCurrency.currencyId, fromCurrency.currencyId);
      if (rate === null || rate === 0) return "N/A";

      return `${Math.round(rate).toLocaleString(
        "vi-VN"
      )} ${fromCurrency.currencyId} = 1 ${toCurrency.currencyId}`;
    }

    // 👉 Các currency khác
    const rate = convert(1, fromCurrency.currencyId, toCurrency.currencyId);
    if (rate === null) return "N/A";

    return `1 ${fromCurrency.currencyId} = ${rate.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })} ${toCurrency.currencyId}`;
  };

  const formatRateDate = () => {
    if (!rateDate) return "";
    return new Date(rateDate).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (ratesLoading) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Quy đổi tiền tệ" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Đang tải dữ liệu...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Quy đổi tiền tệ" showBackButton />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: hp(2) + insets.bottom }]}>
        <View style={styles.subtitleRow}>
          <ThemedText style={styles.subtitle}>
            Chuyển đổi tiền tệ theo tỷ giá hiện tại
          </ThemedText>
          {rateDate && (
            <ThemedText style={styles.updateTime}>
              Cập nhật: {formatRateDate()}
            </ThemedText>
          )}
        </View>

        {/* Main Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* FROM */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>Từ</ThemedText>
              <TouchableOpacity
                style={styles.currencyBadge}
                onPress={() => {
                  selectingTypeRef.current = "from";
                  router.push("/(protected)/select-currency");
                }}
              >
                <ThemedText style={styles.currencyBadgeText}>
                  {fromCurrency.currencyId}
                </ThemedText>
                <Ionicons name="chevron-down" size={16} />
              </TouchableOpacity>
            </View>

            <MoneyInput
              value={fromAmount}
              onChange={setFromAmount}
              currency={fromCurrency.symbol}
              containerStyle={styles.largeInputContainer}
              currencyStyle={styles.largeCurrency}
              inputStyle={styles.largeInput}
            />
            <ThemedText style={styles.currencyName}>{fromCurrency.name}</ThemedText>
          </View>

          {/* Swap */}
          <View style={styles.swapContainer}>
            <TouchableOpacity
              style={[styles.swapButton, { backgroundColor: colors.tint }]}
              onPress={() => {
                setFromCurrency(toCurrency);
                setToCurrency(fromCurrency);
                setFromAmount(toAmount);
              }}
            >
              <Ionicons name="swap-vertical" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* TO */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>Đến</ThemedText>
              <TouchableOpacity
                style={styles.currencyBadge}
                onPress={() => {
                  selectingTypeRef.current = "to";
                  router.push("/(protected)/select-currency");
                }}
              >
                <ThemedText style={styles.currencyBadgeText}>
                  {toCurrency.currencyId}
                </ThemedText>
                <Ionicons name="chevron-down" size={16} />
              </TouchableOpacity>
            </View>

            <MoneyInput
              value={toAmount}
              onChange={() => {}}
              editable={false}
              highlightMode
              currency={toCurrency.symbol}
              containerStyle={styles.largeInputContainer}
              currencyStyle={styles.largeCurrency}
              inputStyle={styles.largeInput}
            />
            <ThemedText style={styles.currencyName}>{toCurrency.name}</ThemedText>
          </View>
        </View>

        {/* Rate Card */}
        <View style={[styles.rateCard, { backgroundColor: colors.card }]}>
          <Ionicons name="analytics-outline" size={24} color={colors.tint} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.rateLabel}>Tỷ giá chuyển đổi</ThemedText>
            <ThemedText style={styles.rateValue}>
              {getSmartExchangeRate()}
            </ThemedText>
          </View>
          <TouchableOpacity onPress={refetchRates}>
            <Ionicons name="refresh" size={20} color={colors.tint} />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.disclaimer}>
          * Tỷ giá từ Vietcombank, mang tính tham khảo
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

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: normalize(12),
  },
  loadingText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },

  // Subtitle
  subtitleRow: {
    gap: normalize(4),
  },
  subtitle: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    opacity: 0.7,
    lineHeight: normalize(20),
  },
  updateTime: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    opacity: 0.6,
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

  // Large Input Styles
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
  refreshButton: {
    padding: normalize(8),
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