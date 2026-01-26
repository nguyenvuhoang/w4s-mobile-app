import AppHeader from "@/components/base/AppHeader";
import MoneyInput from "@/components/base/MoneyInput";
import BottomSelectModal, {
  BottomSelectOption,
} from "@/components/modals/SelectModal";
import { ThemedText } from "@/components/themed-text";
import { Fonts } from "@/core/theme/font";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------------- OPTIONS ---------------- */

const PERIOD_OPTIONS: BottomSelectOption<number>[] = [
  { label: "1 Tháng", value: 1 },
  { label: "3 Tháng", value: 3 },
  { label: "6 Tháng", value: 6 },
  { label: "9 Tháng", value: 9 },
  { label: "12 Tháng", value: 12 },
  { label: "18 Tháng", value: 18 },
  { label: "24 Tháng", value: 24 },
  { label: "36 Tháng", value: 36 },
];

const CALCULATION_OPTIONS: BottomSelectOption<"simple" | "compound">[] = [
  { label: "Lãi đơn", value: "simple" },
  { label: "Lãi kép", value: "compound" },
];

/* ---------------- SCREEN ---------------- */

const InterestCalculatorScreen: React.FC = () => {
  const { colors } = useAppTheme();

  /* ---------- STATE ---------- */
  const [principal, setPrincipal] = useState<number>(0);
  const [interestRate, setInterestRate] = useState("0");

  const [period, setPeriod] = useState(PERIOD_OPTIONS[2]); // 6 tháng
  const [calculationType, setCalculationType] = useState(CALCULATION_OPTIONS[0]);

  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);

  /* ---------- HELPERS ---------- */
  const formatMoney = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(Math.round(value));

  const handleInterestRateChange = (text: string) => {
    const cleaned = text.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setInterestRate(cleaned);
  };

  /* ---------- CALCULATION ---------- */
  const { interest, total } = useMemo(() => {
    const P = principal;
    const r = parseFloat(interestRate) / 100;
    const months = period.value;

    if (P <= 0 || r <= 0 || months <= 0 || isNaN(r)) {
      return { interest: 0, total: P };
    }

    // 🔹 Lãi đơn
    if (calculationType.value === "simple") {
      const interest = P * r * (months / 12);
      return {
        interest,
        total: P + interest,
      };
    }

    // 🔹 Lãi kép (kép theo tháng)
    const total = P * Math.pow(1 + r / 12, months);

    return {
      interest: total - P,
      total,
    };
  }, [principal, interestRate, period, calculationType]);

  /* ---------- RENDER ---------- */
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Tính lãi suất" showBackButton />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Subtitle */}
        <ThemedText style={[styles.subtitle, { color: colors.text }]}>
          Ước tính lãi khi gửi tiết kiệm hoặc vay
        </ThemedText>

        {/* INPUT CARD */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Số tiền gốc */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              Số tiền gốc
            </ThemedText>

            <MoneyInput
              value={principal}
              onChange={setPrincipal}
              currency="đ"
              placeholder="Nhập số tiền"
            />
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Lãi suất */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              Lãi suất (%/năm)
            </ThemedText>

            <View style={[styles.rateInputWrapper, { borderColor: colors.border }]}>
              <TextInput
                value={interestRate}
                onChangeText={handleInterestRateChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.icon}
                style={[styles.rateInput, { color: colors.text }]}
              />
              <ThemedText style={[styles.percentSymbol, { color: colors.icon }]}>
                %
              </ThemedText>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Kỳ hạn + Cách tính */}
          <View style={styles.row}>
            {/* Kỳ hạn */}
            <View style={styles.halfColumn}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Kỳ hạn
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setPeriodModalVisible(true)}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.selectText, { color: colors.text }]}>
                  {period.label}
                </ThemedText>
                <Ionicons name="chevron-down" size={normalize(18)} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* Cách tính */}
            <View style={styles.halfColumn}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Cách tính lãi
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setTypeModalVisible(true)}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.selectText, { color: colors.text }]}>
                  {calculationType.label}
                </ThemedText>
                <Ionicons name="chevron-down" size={normalize(18)} color={colors.icon} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* RESULT CARD */}
        <View style={[styles.card, styles.resultCard, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.resultTitle, { color: colors.text }]}>
            Kết quả dự kiến
          </ThemedText>

          <View style={styles.resultItem}>
            <ThemedText style={[styles.resultLabel, { color: colors.icon }]} numberOfLines={1}>
              Tiền lãi
            </ThemedText>
            <ThemedText
              style={[styles.resultValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatMoney(interest)} đ
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={[styles.resultItem, styles.highlightResult]}>
            <ThemedText style={[styles.resultLabel, { color: colors.text }]} numberOfLines={1}>
              Tổng nhận cuối kỳ
            </ThemedText>
            <ThemedText
              style={[styles.highlightValue, { color: colors.tint }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatMoney(total)} đ
            </ThemedText>
          </View>

          <ThemedText style={[styles.disclaimer, { color: colors.icon }]}>
            * Kết quả mang tính tham khảo, có thể khác so với thực tế
          </ThemedText>
        </View>
      </ScrollView>

      {/* -------- BOTTOM MODALS -------- */}
      <BottomSelectModal
        visible={periodModalVisible}
        title="Chọn kỳ hạn"
        options={PERIOD_OPTIONS}
        selectedValue={period.value}
        onClose={() => setPeriodModalVisible(false)}
        onSelect={setPeriod}
      />

      <BottomSelectModal
        visible={typeModalVisible}
        title="Cách tính lãi"
        options={CALCULATION_OPTIONS}
        selectedValue={calculationType.value}
        onClose={() => setTypeModalVisible(false)}
        onSelect={setCalculationType}
      />
    </SafeAreaView>
  );
};

export default InterestCalculatorScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1
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
    gap: normalize(20),
  },

  // Section
  section: {
    gap: normalize(12),
  },
  label: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    lineHeight: normalize(20),
  },

  // Divider
  divider: {
    height: 1,
    opacity: 0.1,
  },

  // Rate Input
  rateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    paddingBottom: normalize(12),
  },
  rateInput: {
    flex: 1,
    fontSize: normalize(28),
    fontFamily: Fonts.bold,
    padding: 0,
  },
  percentSymbol: {
    fontSize: normalize(20),
    fontFamily: Fonts.medium,
    marginLeft: normalize(8),
  },

  // Row
  row: {
    flexDirection: "row",
    gap: normalize(12),
  },
  halfColumn: {
    flex: 1,
    gap: normalize(12),
  },

  // Select Button
  selectButton: {
    height: normalize(48),
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
  },

  // Result
  resultCard: {
    gap: normalize(16),
  },
  resultTitle: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    lineHeight: normalize(22),
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: normalize(12),
  },
  resultLabel: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    flexShrink: 0,
  },
  resultValue: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  highlightResult: {
    paddingTop: normalize(8),
  },
  highlightValue: {
    fontSize: normalize(24),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  disclaimer: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: normalize(8),
    opacity: 0.6,
  },
});