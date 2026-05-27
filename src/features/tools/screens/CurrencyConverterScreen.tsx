import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import MoneyInput from "@/components/base/MoneyInput";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Tokens } from "@/core/theme/theme";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../styles/CurrencyConverterScreen.styles";

interface SelectedCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

const CurrencyConverterScreen = () => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const {
    rates,
    loading: ratesLoading,
    rateDate,
    convert,
    refetch: refetchRates,
  } = useExchangeRate();

  const [fromCurrency, setFromCurrency] = useState<SelectedCurrency>({
    currencyId: "USD",
    symbol: "$",
    name: t("currency_converter.usd_name"),
  });

  const [toCurrency, setToCurrency] = useState<SelectedCurrency>({
    currencyId: "VND",
    symbol: "đ",
    name: t("currency_converter.vnd_name"),
  });

  const [fromAmount, setFromAmount] = useState<number>(100);
  const [toAmount, setToAmount] = useState<number>(0);

  const selectingTypeRef = useRef<"from" | "to" | null>(null);

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

  const getSmartExchangeRate = () => {
    if (!fromCurrency || !toCurrency) return t("currency_converter.not_available");

    const isFromVND =
      fromCurrency.currencyId === "VND" ||
      fromCurrency.currencyId === "VNĐ";

    const isToVND =
      toCurrency.currencyId === "VND" || toCurrency.currencyId === "VNĐ";

    if (isToVND) {
      const rate = convert(1, fromCurrency.currencyId, toCurrency.currencyId);
      if (rate === null) return t("currency_converter.not_available");

      return `1 ${fromCurrency.currencyId} = ${Math.round(rate).toLocaleString(
        i18n.language === "vi" ? "vi-VN" : "en-US"
      )} ${toCurrency.currencyId}`;
    }

    if (isFromVND) {
      const rate = convert(1, toCurrency.currencyId, fromCurrency.currencyId);
      if (rate === null || rate === 0) return t("currency_converter.not_available");

      return `${Math.round(rate).toLocaleString(
        i18n.language === "vi" ? "vi-VN" : "en-US"
      )} ${fromCurrency.currencyId} = 1 ${toCurrency.currencyId}`;
    }

    const rate = convert(1, fromCurrency.currencyId, toCurrency.currencyId);
    if (rate === null) return t("currency_converter.not_available");

    return `1 ${fromCurrency.currencyId} = ${rate.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })} ${toCurrency.currencyId}`;
  };

  const formatRateDate = () => {
    if (!rateDate) return "";
    return new Date(rateDate).toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US", {
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
        <AppHeader title={t("currency_converter.title")} showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText style={[styles.loadingText, { color: colors.text }]}>{t("currency_converter.loading")}</CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t("currency_converter.title")} showBackButton />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: hp(2) + insets.bottom }]}>
        <View style={styles.subtitleRow}>
          <CustomText style={[styles.subtitle, { color: colors.icon }]}>
            {t("currency_converter.subtitle")}
          </CustomText>
          {rateDate && (
            <CustomText style={[styles.updateTime, { color: colors.icon }]}>
              {t("currency_converter.updated_at", { date: formatRateDate() })}
            </CustomText>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <CustomText style={[styles.label, { color: colors.text }]}>{t("currency_converter.from")}</CustomText>
              <TouchableOpacity
                style={[styles.currencyBadge, { backgroundColor: colors.border, borderColor: colors.border }]}
                onPress={() => {
                  selectingTypeRef.current = "from";
                  router.push("/(protected)/select-currency");
                }}
              >
                <CustomText style={[styles.currencyBadgeText, { color: colors.text }]}>
                  {fromCurrency.currencyId}
                </CustomText>
                <Ionicons name="chevron-down" size={normalize(14)} color={colors.text} />
              </TouchableOpacity>
            </View>

            <MoneyInput
              value={fromAmount}
              onChange={setFromAmount}
              currency={fromCurrency.symbol}
            />
            <CustomText style={[styles.currencyName, { color: colors.icon }]}>{fromCurrency.name}</CustomText>
          </View>

          <View style={styles.swapContainer}>
            <TouchableOpacity
              style={[styles.swapButton, { backgroundColor: "transparent", overflow: "hidden" }]}
              onPress={() => {
                setFromCurrency(toCurrency);
                setToCurrency(fromCurrency);
                setFromAmount(toAmount);
              }}
            >
              <LinearGradient
                colors={Tokens.gradients.base}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="swap-vertical" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <CustomText style={[styles.label, { color: colors.text }]}>{t("currency_converter.to")}</CustomText>
              <TouchableOpacity
                style={[styles.currencyBadge, { backgroundColor: colors.border, borderColor: colors.border }]}
                onPress={() => {
                  selectingTypeRef.current = "to";
                  router.push("/(protected)/select-currency");
                }}
              >
                <CustomText style={[styles.currencyBadgeText, { color: colors.text }]}>
                  {toCurrency.currencyId}
                </CustomText>
                <Ionicons name="chevron-down" size={normalize(14)} color={colors.text} />
              </TouchableOpacity>
            </View>

            <MoneyInput
              value={toAmount}
              onChange={() => { }}
              editable={false}
              highlightMode
              currency={toCurrency.symbol}
            />
            <CustomText style={[styles.currencyName, { color: colors.icon }]}>{toCurrency.name}</CustomText>
          </View>
        </View>

        <View style={[styles.rateCard, { backgroundColor: colors.card }]}>
          <Ionicons name="analytics-outline" size={24} color={colors.tint} />
          <View style={{ flex: 1 }}>
            <CustomText style={[styles.rateLabel, { color: colors.icon }]}>{t("currency_converter.exchange_rate")}</CustomText>
            <CustomText type="bold" style={[styles.rateValue, { color: colors.text }]}>
              {getSmartExchangeRate()}
            </CustomText>
          </View>
          <TouchableOpacity onPress={refetchRates}>
            <Ionicons name="refresh" size={20} color={colors.tint} />
          </TouchableOpacity>
        </View>

        <CustomText style={[styles.disclaimer, { color: colors.icon }]}>
          {t("currency_converter.disclaimer")}
        </CustomText>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CurrencyConverterScreen;