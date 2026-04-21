import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface CurrencyInfo {
  currencyId: string;
  symbol: string;
}

interface TransactionAmountInputProps {
  amount: string;
  onAmountChange: (value: string) => void;
  inputCurrency: CurrencyInfo;
  walletCurrency: CurrencyInfo;
  onCurrencyPress?: () => void;
  disableCurrencySelect?: boolean;
  hasExceededLimit?: boolean;
  exceededLabel?: string | null;
  needsConversion?: boolean;
  convertedAmount?: number | null;
  exchangeRate?: number | null;
  selectedType?: "income" | "expense" | "inout";
  label?: string;
  required?: boolean;
}

const TransactionAmountInput: React.FC<TransactionAmountInputProps> = ({
  amount,
  onAmountChange,
  inputCurrency,
  walletCurrency,
  onCurrencyPress,
  disableCurrencySelect = false,
  hasExceededLimit = false,
  exceededLabel,
  needsConversion: propsNeedsConversion,
  convertedAmount: propsConvertedAmount = null,
  exchangeRate: propsExchangeRate = null,
  selectedType = "expense",
  label,
  required = true,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { convert } = useExchangeRate();

  // Internal conversion logic
  const effectiveNeedsConversion = useMemo(() => {
    if (propsNeedsConversion !== undefined) return propsNeedsConversion;
    return inputCurrency.currencyId !== walletCurrency.currencyId;
  }, [propsNeedsConversion, inputCurrency.currencyId, walletCurrency.currencyId]);

  const effectiveExchangeRate = useMemo(() => {
    if (propsExchangeRate !== null) return propsExchangeRate;
    if (!effectiveNeedsConversion) return null;
    const rate = convert(1, inputCurrency.currencyId, walletCurrency.currencyId);
    if (rate === null) return null;
    const isVND = walletCurrency.currencyId === "VND" || walletCurrency.currencyId === "VNĐ";
    return isVND ? Math.round(rate) : Math.round(rate * 10000) / 10000;
  }, [propsExchangeRate, effectiveNeedsConversion, inputCurrency.currencyId, walletCurrency.currencyId, convert]);

  const effectiveConvertedAmount = useMemo(() => {
    if (propsConvertedAmount !== null) return propsConvertedAmount;
    if (!effectiveNeedsConversion || !amount || amount === "0") return null;
    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(numAmount)) return null;
    const result = convert(numAmount, inputCurrency.currencyId, walletCurrency.currencyId);
    if (result === null) return null;
    const isVND = walletCurrency.currencyId === "VND" || walletCurrency.currencyId === "VNĐ";
    return isVND ? Math.round(result) : Math.round(result * 100) / 100;
  }, [propsConvertedAmount, amount, effectiveNeedsConversion, inputCurrency.currencyId, walletCurrency.currencyId, convert]);

  const formatConvertedAmount = (val: number) => {
    if (walletCurrency.currencyId === "VND" || walletCurrency.currencyId === "VNĐ") {
      return Math.round(val).toLocaleString("vi-VN");
    }
    return val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatExchangeRate = (rate: number) => {
    if (walletCurrency.currencyId === "VND" || walletCurrency.currencyId === "VNĐ") {
      return Math.round(rate).toLocaleString("vi-VN");
    }
    return rate.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  const isWarningLimit = hasExceededLimit && selectedType === "expense";

  const handleAmountChange = (text: string) => {
    // Chỉ cho phép số và dấu chấm
    let cleaned = text.replace(/[^0-9.]/g, "");

    // Xử lý trường hợp có nhiều dấu chấm (chỉ giữ lại 1)
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }

    const rawParts = cleaned.split(".");
    let integerPart = rawParts[0];

    // Giới hạn phần thập phân tối đa 2 chữ số
    const decimalPart = rawParts.length > 1 ? "." + rawParts[1].substring(0, 2) : "";

    // Nếu người dùng bắt đầu bằng dấu chấm liền (ví dụ ".5" -> thành "0.5")
    if (!integerPart && rawParts.length > 1) {
      integerPart = "0";
    }

    // Thêm dấu phẩy phân cách hàng nghìn
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const newDisplayValue = formattedInteger + decimalPart;

    onAmountChange(newDisplayValue);
  };

  const suggestions = useMemo(() => {
    const raw = amount.replace(/,/g, "");
    const num = parseFloat(raw);
    // Chỉ hiện gợi ý khi nhập từ 1-5 chữ số và là số hợp lệ
    if (isNaN(num) || num <= 0 || raw.length > 5 || raw.includes(".")) return [];

    // Gợi ý các mức phổ biến: x1.000, x10.000, x100.000, x1.000.000
    const multipliers = [1000, 10000, 100000, 1000000];
    return multipliers
      .map((m) => {
        const val = num * m;
        return val.toLocaleString("en-US", { maximumFractionDigits: 0 });
      })
      .filter((s) => s !== amount); // Không gợi ý số hiện tại
  }, [amount, inputCurrency.currencyId]);

  return (
    <View style={styles.section}>
      <CustomText style={[styles.label, { color: colors.text }]}>
        {label || t("transaction.amount")} {required && <CustomText style={{ color: "red" }}>*</CustomText>}
      </CustomText>
      <View
        style={[
          styles.amountContainer,
          {
            backgroundColor: colors.card,
            borderColor: isWarningLimit ? "#FF9800" : colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onCurrencyPress}
          style={styles.currencyButton}
          disabled={disableCurrencySelect || !onCurrencyPress}
        >
          <CustomText style={[styles.currency, { color: colors.tint }]}>
            {inputCurrency.symbol}
          </CustomText>
        </TouchableOpacity>
        <TextInput
          style={[styles.amountInput, { color: colors.text }]}
          placeholder="0"
          placeholderTextColor={colors.icon}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={handleAmountChange}
        />
      </View>

      {/* Quick selection suggestions */}
      {suggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionScroll}
          contentContainerStyle={styles.suggestionContent}
          keyboardShouldPersistTaps="handled"
        >
          {suggestions.map((s, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.suggestionChip,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => onAmountChange(s)}
            >
              <CustomText style={[styles.suggestionText, { color: colors.tint }]}>
                {s}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Inline limit warning */}
      {exceededLabel && (
        <View style={styles.warningContainer}>
          <FontAwesome6
            name="triangle-exclamation"
            size={normalize(12)}
            color="#FF9800"
            style={{ marginTop: 2 }}
          />
          <CustomText style={styles.warningText}>{exceededLabel}</CustomText>
        </View>
      )}

      {/* Conversion Display */}
      {effectiveNeedsConversion && effectiveConvertedAmount !== null && effectiveExchangeRate !== null && (
        <View style={styles.conversionContainer}>
          <FontAwesome6
            name="arrow-right-arrow-left"
            size={normalize(12)}
            color={colors.icon}
          />
          <View style={styles.conversionTextContainer}>
            <CustomText style={[styles.conversionText, { color: colors.icon }]}>
              ≈ {walletCurrency.symbol} {formatConvertedAmount(effectiveConvertedAmount)}
              <CustomText style={{ fontSize: normalize(11), opacity: 0.7 }}>
                {" "}
                ({walletCurrency.currencyId})
              </CustomText>
            </CustomText>
            <CustomText style={[styles.exchangeRateText, { color: colors.icon }]}>
              1 {inputCurrency.currencyId} = {formatExchangeRate(effectiveExchangeRate)}{" "}
              {walletCurrency.currencyId}
            </CustomText>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: wp(5),
    marginTop: hp(2),
  },
  label: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    marginBottom: normalize(8),
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(10),
    borderRadius: normalize(12),
    borderWidth: 1,
    gap: normalize(12),
  },
  currencyButton: {
    paddingVertical: normalize(4),
    paddingHorizontal: normalize(8),
    marginRight: normalize(4),
  },
  currency: {
    fontSize: normalize(20),
    fontFamily: Fonts.semiBold,
  },
  amountInput: {
    flex: 1,
    fontSize: normalize(18),
    fontFamily: Fonts.regular,
    padding: 0,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
    gap: 6,
  },
  warningText: {
    color: "#FF9800",
    fontSize: normalize(12),
    flex: 1,
    lineHeight: normalize(18),
  },
  conversionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: normalize(8),
    marginTop: normalize(8),
    paddingHorizontal: normalize(4),
  },
  conversionTextContainer: {
    flex: 1,
    gap: normalize(2),
  },
  conversionText: {
    fontSize: normalize(13),
    fontFamily: Fonts.medium,
  },
  exchangeRateText: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    opacity: 0.7,
  },
  suggestionScroll: {
    marginTop: normalize(10),
  },
  suggestionContent: {
    paddingHorizontal: normalize(4),
    gap: normalize(8),
  },
  suggestionChip: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(16),
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: normalize(12),
    fontFamily: Fonts.medium,
  },
});

export default TransactionAmountInput;
