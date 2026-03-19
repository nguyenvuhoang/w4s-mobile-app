import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { wp, hp, normalize } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface CurrencyInfo {
  currencyId: string;
  symbol: string;
}

interface TransactionAmountInputProps {
  amount: string;
  onAmountChange: (value: string) => void;
  inputCurrency: CurrencyInfo;
  walletCurrency: CurrencyInfo;
  onCurrencyPress: () => void;
  hasExceededLimit?: boolean;
  exceededLabel?: string | null;
  needsConversion?: boolean;
  convertedAmount?: number | null;
  exchangeRate?: number | null;
  selectedType?: "income" | "expense" | "inout";
}

const TransactionAmountInput: React.FC<TransactionAmountInputProps> = ({
  amount,
  onAmountChange,
  inputCurrency,
  walletCurrency,
  onCurrencyPress,
  hasExceededLimit = false,
  exceededLabel,
  needsConversion = false,
  convertedAmount = null,
  exchangeRate = null,
  selectedType = "expense",
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

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

  return (
    <View style={styles.section}>
      <CustomText style={[styles.label, { color: colors.text }]}>
        {t("transaction.amount")} <CustomText style={{ color: "red" }}>*</CustomText>
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
        <TouchableOpacity onPress={onCurrencyPress} style={styles.currencyButton}>
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
      {needsConversion && convertedAmount !== null && exchangeRate !== null && (
        <View style={styles.conversionContainer}>
          <FontAwesome6
            name="arrow-right-arrow-left"
            size={normalize(12)}
            color={colors.icon}
          />
          <View style={styles.conversionTextContainer}>
            <CustomText style={[styles.conversionText, { color: colors.icon }]}>
              ≈ {walletCurrency.symbol} {formatConvertedAmount(convertedAmount)}
              <CustomText style={{ fontSize: normalize(11), opacity: 0.7 }}>
                {" "}
                ({walletCurrency.currencyId})
              </CustomText>
            </CustomText>
            <CustomText style={[styles.exchangeRateText, { color: colors.icon }]}>
              1 {inputCurrency.currencyId} = {formatExchangeRate(exchangeRate)}{" "}
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
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1,
    gap: normalize(12),
  },
  currencyButton: {
    paddingVertical: normalize(4),
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
});

export default TransactionAmountInput;
