import AppHeader from "@/components/base/AppHeader";
import MoneyInput from "@/components/base/MoneyInput";
import BottomSelectModal, {
  BottomSelectOption,
} from "@/components/modals/SelectModal";
import { ThemedText } from "@/components/themed-text";
import {
  DEPENDENT_DEDUCTION,
  INSURANCE_RATE,
  PERSONAL_DEDUCTION,
  TAX_BRACKETS,
  TAX_BRACKETS_DISPLAY,
  calculateFromNet,
  calculateInsurance,
} from "@/config/TaxConfig";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Tokens } from "@/core/theme/theme";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type IncomeType = "gross" | "net";

const DEPENDENT_OPTIONS: BottomSelectOption<number>[] = Array.from({ length: 11 }, (_, i) => ({
  label: i.toString(),
  value: i,
}));

const PersonalIncomeTaxScreen = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const DEPENDENT_OPTIONS_DISPLAY = useMemo(
    () =>
      DEPENDENT_OPTIONS.map((opt) => ({
        ...opt,
        label: t("pit.people_count", { count: opt.value }),
      })),
    [t]
  );

  const [incomeType, setIncomeType] = useState<IncomeType>("gross");
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [insuranceMode, setInsuranceMode] = useState<"auto" | "manual">("auto");
  const [compulsoryInsurance, setCompulsoryInsurance] = useState("");
  const [dependents, setDependents] = useState<BottomSelectOption<number>>(
    DEPENDENT_OPTIONS[0]
  );
  const [otherDeduction, setOtherDeduction] = useState<number>(0);
  const [dependentModalVisible, setDependentModalVisible] = useState(false);

  const calculation = useMemo(() => {
    // ── Bước 0: xác định Gross ──────────────────────────────────────────────
    let grossIncome: number;

    if (incomeType === "net") {
      // Dùng binary search từ TaxConfig để tính ngược Gross từ Net chính xác
      const result = calculateFromNet(monthlyIncome, dependents.value, otherDeduction);
      grossIncome = result.grossIncome;
    } else {
      grossIncome = monthlyIncome;
    }

    // ── Bước 1: Bảo hiểm bắt buộc ──────────────────────────────────────────
    // "Thu nhập tính thuế" = Gross − Bảo hiểm (chưa trừ giảm trừ gia cảnh)
    const insuranceOverride =
      insuranceMode === "manual" && compulsoryInsurance
        ? parseFloat(compulsoryInsurance.replace(/[^\d]/g, ""))
        : undefined;

    const insurance =
      insuranceOverride !== undefined
        ? insuranceOverride
        : calculateInsurance(grossIncome);

    // ── Bước 2: Thu nhập tính thuế (= Gross − Bảo hiểm) ───────────────────
    // Đây là cơ sở trước khi áp dụng giảm trừ gia cảnh
    const taxableIncome = grossIncome - insurance;

    // ── Bước 3: Tổng giảm trừ gia cảnh ────────────────────────────────────
    const totalDeduction =
      PERSONAL_DEDUCTION +
      dependents.value * DEPENDENT_DEDUCTION +
      otherDeduction;

    // ── Bước 4: Thu nhập chịu thuế (= Thu nhập tính thuế − Giảm trừ) ──────
    // Đây mới là con số thực sự đưa vào biểu thuế lũy tiến
    const taxableAmount = Math.max(0, taxableIncome - totalDeduction);

    // ── Bước 5: Tính thuế lũy tiến từng phần ──────────────────────────────
    let tax = 0;
    let remaining = taxableAmount;
    let prevLimit = 0;

    for (const bracket of TAX_BRACKETS) {
      if (remaining <= 0) break;
      const bracketSize =
        bracket.limit === Infinity ? remaining : bracket.limit - prevLimit;
      const taxableInBracket = Math.min(remaining, bracketSize);
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
      prevLimit = bracket.limit === Infinity ? prevLimit : bracket.limit;
    }

    // ── Bước 6: Thu nhập thực nhận & tỷ lệ thuế ───────────────────────────
    const netIncome = grossIncome - insurance - tax;
    const taxRate = grossIncome > 0 ? (tax / grossIncome) * 100 : 0;

    return {
      grossIncome,
      insurance,
      taxableIncome,   // Gross − Bảo hiểm  → "Thu nhập tính thuế"
      totalDeduction,
      taxableAmount,   // taxableIncome − Giảm trừ → "Thu nhập chịu thuế"
      tax,
      netIncome,
      taxRate,
    };
  }, [monthlyIncome, incomeType, insuranceMode, compulsoryInsurance, dependents, otherDeduction]);

  const { i18n } = useTranslation();
  const formatMoney = (value: number) =>
    new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(Math.round(value));

  const handleInsuranceChange = (text: string) => {
    setCompulsoryInsurance(text.replace(/[^\d]/g, ""));
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title={t("pit.title")} showBackButton />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: hp(2) + insets.bottom },
        ]}
      >
        {/* Subtitle */}
        <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
          {t("pit.subtitle")}
        </ThemedText>

        {/* Income Type Toggle */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.cardLabel, { color: colors.text }]}>
            {t("pit.income_type_question")}
          </ThemedText>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                { backgroundColor: incomeType === "gross" ? "transparent" : colors.background, overflow: "hidden" },
              ]}
              onPress={() => setIncomeType("gross")}
              activeOpacity={0.7}
            >
              {incomeType === "gross" && (
                <LinearGradient
                  colors={Tokens.gradients.base}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <ThemedText
                style={[styles.toggleText, { color: incomeType === "gross" ? "#fff" : colors.text }]}
              >
                {t("pit.gross_salary")}
              </ThemedText>
              <ThemedText
                style={[styles.toggleSubText, { color: incomeType === "gross" ? "rgba(255,255,255,0.75)" : colors.icon }]}
              >
                {t("pit.gross_desc")}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                { backgroundColor: incomeType === "net" ? "transparent" : colors.background, overflow: "hidden" },
              ]}
              onPress={() => setIncomeType("net")}
              activeOpacity={0.7}
            >
              {incomeType === "net" && (
                <LinearGradient
                  colors={Tokens.gradients.base}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <ThemedText
                style={[styles.toggleText, { color: incomeType === "net" ? "#fff" : colors.text }]}
              >
                {t("pit.net_salary")}
              </ThemedText>
              <ThemedText
                style={[styles.toggleSubText, { color: incomeType === "net" ? "rgba(255,255,255,0.75)" : colors.icon }]}
              >
                {t("pit.net_desc")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
            {incomeType === "gross" ? t("pit.input_gross_label") : t("pit.input_net_label")}
          </ThemedText>

          <View style={styles.section}>
            <MoneyInput
              value={monthlyIncome}
              onChange={setMonthlyIncome}
              currency={t("pit.currency_symbol")}
              placeholder="0"
              containerStyle={styles.largeInputContainer}
              currencyStyle={styles.largeCurrency}
              inputStyle={styles.largeInput}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bảo hiểm bắt buộc */}
          <View style={styles.section}>
            <View style={styles.labelWithToggle}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                {t("pit.insurance_label")}
              </ThemedText>
              <View style={styles.miniToggle}>
                <TouchableOpacity
                  style={[
                    styles.miniToggleButton,
                    insuranceMode === "auto" && { backgroundColor: "transparent", overflow: "hidden" },
                  ]}
                  onPress={() => { setInsuranceMode("auto"); setCompulsoryInsurance(""); }}
                  activeOpacity={0.7}
                >
                  {insuranceMode === "auto" && (
                    <LinearGradient
                      colors={Tokens.gradients.base}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <ThemedText
                    style={[
                      styles.miniToggleText,
                      { color: insuranceMode === "auto" ? "#fff" : colors.icon },
                    ]}
                  >
                    {t("pit.auto")}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.miniToggleButton,
                    insuranceMode === "manual" && { backgroundColor: "transparent", overflow: "hidden" },
                  ]}
                  onPress={() => { setInsuranceMode("manual"); setCompulsoryInsurance("0"); }}
                  activeOpacity={0.7}
                >
                  {insuranceMode === "manual" && (
                    <LinearGradient
                      colors={Tokens.gradients.base}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <ThemedText
                    style={[
                      styles.miniToggleText,
                      { color: insuranceMode === "manual" ? "#fff" : colors.icon },
                    ]}
                  >
                    {t("pit.manual")}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity: insuranceMode === "auto" ? 0.6 : 1,
                },
              ]}
            >
              <ThemedText style={[styles.inputCurrency, { color: colors.tint }]}>
                {t("pit.currency_symbol")}
              </ThemedText>
              <TextInput
                value={
                  insuranceMode === "auto"
                    ? formatMoney(calculation.insurance)
                    : compulsoryInsurance
                      ? formatMoney(parseFloat(compulsoryInsurance))
                      : ""
                }
                onChangeText={handleInsuranceChange}
                keyboardType="numeric"
                placeholder={insuranceMode === "manual" ? t("pit.manual_insurance_placeholder") : ""}
                placeholderTextColor={colors.icon}
                editable={insuranceMode === "manual"}
                style={[styles.textInput, { color: colors.text }]}
              />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Số người phụ thuộc */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              {t("pit.dependents_label")}
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.selectButton,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => setDependentModalVisible(true)}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.selectText, { color: colors.text }]}>
                {t("pit.people_count", { count: dependents.value })}
              </ThemedText>
              <Ionicons name="chevron-down" size={normalize(18)} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Giảm trừ khác */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              {t("pit.other_deductions_label")}
            </ThemedText>
            <MoneyInput
              value={otherDeduction}
              onChange={setOtherDeduction}
              currency={t("pit.currency_symbol")}
              placeholder="0"
              containerStyle={styles.largeInputContainer}
              currencyStyle={styles.largeCurrency}
              inputStyle={styles.largeInput}
            />
          </View>
        </View>

        {/* Result Card */}
        <View style={[styles.card, styles.resultCard, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
            {t("pit.result_title")}
          </ThemedText>

          {/* 
            ── THUẬT NGỮ ĐÚNG ──────────────────────────────────────────
            Thu nhập tính thuế  = Gross − Bảo hiểm
                                  (chưa trừ giảm trừ gia cảnh)
            Thu nhập chịu thuế  = Thu nhập tính thuế − Giảm trừ gia cảnh
                                  (con số thực sự đưa vào biểu thuế)
            ─────────────────────────────────────────────────────────── 
          */}

          {/* Dòng 1: Thu nhập tính thuế (Gross − BH) */}
          <View style={styles.resultItem}>
            <View style={styles.resultLabelGroup}>
              <ThemedText style={[styles.resultLabel, { color: colors.icon }]}>
                {t("pit.taxable_income")}
              </ThemedText>
              <ThemedText style={[styles.resultLabelSub, { color: colors.icon }]}>
                {t("pit.gross_minus_insurance")}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.resultValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatMoney(calculation.taxableIncome)} {t("pit.currency_symbol")}
            </ThemedText>
          </View>

          {/* Dòng 2: Thu nhập chịu thuế (sau khi trừ giảm trừ) */}
          <View style={styles.resultItem}>
            <View style={styles.resultLabelGroup}>
              <ThemedText style={[styles.resultLabel, { color: colors.icon }]}>
                {t("pit.tax_assessed_income")}
              </ThemedText>
              <ThemedText style={[styles.resultLabelSub, { color: colors.icon }]}>
                {t("pit.after_deductions")}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.resultValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatMoney(calculation.taxableAmount)} {t("pit.currency_symbol")}
            </ThemedText>
          </View>

          {/* Dòng 3: Thuế TNCN */}
          <View style={styles.resultItem}>
            <View style={styles.resultLabelGroup}>
              <ThemedText style={[styles.resultLabel, { color: colors.icon }]}>
                {t("pit.pit_amount")}
              </ThemedText>
              <ThemedText style={[styles.resultLabelSub, { color: colors.icon }]}>
                {t("pit.on_tax_assessed_income")}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.resultValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatMoney(calculation.tax)} {t("pit.currency_symbol")}
            </ThemedText>
          </View>

          {/* Dòng 4: Thu nhập thực nhận */}
          <View style={styles.resultItem}>
            <View style={styles.resultLabelGroup}>
              <ThemedText style={[styles.resultLabel, { color: colors.icon }]}>
                {t("pit.net_income")}
              </ThemedText>
              <ThemedText style={[styles.resultLabelSub, { color: colors.icon }]}>
                {t("pit.net_income_calc")}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.resultValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatMoney(calculation.netIncome)} {t("pit.currency_symbol")}
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Tax Rate */}
          <View style={[styles.taxRateContainer, { backgroundColor: colors.tint + "10" }]}>
            <View style={styles.taxRateRow}>
              <ThemedText style={[styles.taxRateLabel, { color: colors.tint }]}>
                {t("pit.tax_to_gross_ratio")}
              </ThemedText>
              <ThemedText style={[styles.taxRateValue, { color: colors.tint }]}>
                {calculation.taxRate.toFixed(1)}%
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText style={[styles.disclaimer, { color: colors.icon }]}>
          {t("pit.disclaimer")}
        </ThemedText>

        {/* How it works - Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.card }]}>
          <View style={styles.noteHeader}>
            <Ionicons name="information-circle" size={normalize(20)} color={colors.tint} />
            <ThemedText style={[styles.noteTitle, { color: colors.text }]}>
              {t("pit.how_it_works_title")}
            </ThemedText>
          </View>

          <View style={styles.noteContent}>
            <ThemedText style={[styles.noteText, { color: colors.text }]}>
              <ThemedText style={{ fontFamily: Fonts.bold }}>{t("pit.step_1")}</ThemedText>{" "}
              Gross − {t("pit.insurance_label")} ({(INSURANCE_RATE * 100).toFixed(1)}%) ={" "}
              <ThemedText style={{ fontFamily: Fonts.bold }}>{t("pit.taxable_income")}</ThemedText>
            </ThemedText>

            <ThemedText style={[styles.noteText, { color: colors.text }]}>
              <ThemedText style={{ fontFamily: Fonts.bold }}>{t("pit.step_2")}</ThemedText>{" "}
              {t("pit.taxable_income")} − Giảm trừ ({(PERSONAL_DEDUCTION / 1_000_000).toFixed(1)}{t("pit.million_unit")} {t("pit.self")} + {(DEPENDENT_DEDUCTION / 1_000_000).toFixed(1)}{t("pit.million_unit")}/{t("pit.dependent")}) ={" "}
              <ThemedText style={{ fontFamily: Fonts.bold }}>{t("pit.tax_assessed_income")}</ThemedText>
            </ThemedText>

            <ThemedText style={[styles.noteText, { color: colors.text }]}>
              <ThemedText style={{ fontFamily: Fonts.bold }}>{t("pit.step_3")}</ThemedText>{" "}
              {t("pit.apply_progressive_tax")} <ThemedText style={{ fontFamily: Fonts.bold }}>{t("pit.tax_assessed_income")}</ThemedText>:
            </ThemedText>

            {/* Biểu thuế 5 bậc — 2 cột x 2 dòng + 1 dòng cuối */}
            <View style={styles.taxBrackets}>
              <View style={styles.bracketRow}>
                <ThemedText style={[styles.bracketText, { color: colors.icon }]}>
                  • {t(TAX_BRACKETS_DISPLAY[0].i18nKey)}: {TAX_BRACKETS_DISPLAY[0].rate}
                </ThemedText>
                <ThemedText style={[styles.bracketText, { color: colors.icon }]}>
                  • {t(TAX_BRACKETS_DISPLAY[1].i18nKey)}: {TAX_BRACKETS_DISPLAY[1].rate}
                </ThemedText>
              </View>
              <View style={styles.bracketRow}>
                <ThemedText style={[styles.bracketText, { color: colors.icon }]}>
                  • {t(TAX_BRACKETS_DISPLAY[2].i18nKey)}: {TAX_BRACKETS_DISPLAY[2].rate}
                </ThemedText>
                <ThemedText style={[styles.bracketText, { color: colors.icon }]}>
                  • {t(TAX_BRACKETS_DISPLAY[3].i18nKey)}: {TAX_BRACKETS_DISPLAY[3].rate}
                </ThemedText>
              </View>
              <ThemedText style={[styles.bracketText, { color: colors.icon }]}>
                • {t(TAX_BRACKETS_DISPLAY[4].i18nKey)}: {TAX_BRACKETS_DISPLAY[4].rate}
              </ThemedText>
            </View>

            {/* Ví dụ cập nhật theo biểu thuế mới */}
            <View style={[styles.noteExample, { backgroundColor: colors.tint + "08" }]}>
              <ThemedText style={[styles.exampleTitle, { color: colors.tint }]}>
                {t("pit.example")}
              </ThemedText>
              <ThemedText style={[styles.exampleText, { color: colors.text }]}>
                {t("pit.tax_assessed_25m")}{"\n"}
                {t("pit.example_calc_1")}{"\n"}
                {t("pit.example_calc_2")}
              </ThemedText>
            </View>

            <ThemedText style={[styles.noteText, { color: colors.text }]}>
              <ThemedText style={{ fontFamily: Fonts.bold }}>{t("pit.step_4")}</ThemedText>{" "}
              Gross − {t("pit.insurance_label")} − {t("pit.tax")} ={" "}
              <ThemedText style={{ fontFamily: Fonts.bold }}>{t("pit.net_income")}</ThemedText>
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      <BottomSelectModal
        visible={dependentModalVisible}
        title={t("pit.select_dependents")}
        options={DEPENDENT_OPTIONS_DISPLAY}
        selectedValue={dependents.value}
        onClose={() => setDependentModalVisible(false)}
        onSelect={setDependents}
      />
    </SafeAreaView>
  );
};

export default PersonalIncomeTaxScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(16),
  },
  subtitle: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    lineHeight: normalize(20),
  },
  card: {
    borderRadius: normalize(16),
    padding: normalize(20),
    gap: normalize(20),
  },
  cardLabel: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    marginBottom: normalize(-8),
  },
  cardTitle: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    lineHeight: normalize(22),
  },
  toggleContainer: {
    flexDirection: "row",
    gap: normalize(8),
    padding: normalize(4),
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: normalize(100),
  },
  toggleButton: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(100),
    alignItems: "center",
    gap: normalize(2),
  },
  toggleText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
  },
  toggleSubText: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
  },
  section: { gap: normalize(12) },
  label: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    lineHeight: normalize(20),
  },
  labelWithToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: normalize(8),
    padding: normalize(3),
    gap: normalize(4),
  },
  miniToggleButton: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(6),
  },
  miniToggleText: {
    fontSize: normalize(12),
    fontFamily: Fonts.medium,
  },
  divider: { height: 1, opacity: 0.1 },
  largeInputContainer: {
    height: normalize(56),
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderRadius: 0,
  },
  largeCurrency: {
    fontSize: normalize(20),
    marginRight: normalize(8),
  },
  largeInput: { fontSize: normalize(28) },
  inputContainer: {
    height: normalize(48),
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(12),
    flexDirection: "row",
    alignItems: "center",
  },
  inputCurrency: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    marginRight: normalize(6),
  },
  textInput: {
    flex: 1,
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    textAlign: "right",
  },
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
  resultCard: { gap: normalize(16) },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: normalize(12),
  },
  resultLabelGroup: {
    flexShrink: 0,
    gap: normalize(2),
  },
  resultLabel: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },
  resultLabelSub: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    opacity: 0.6,
  },
  resultValue: {
    fontSize: normalize(15),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  taxRateContainer: {
    borderRadius: normalize(12),
    padding: normalize(16),
  },
  taxRateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: normalize(12),
  },
  taxRateLabel: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    flex: 1,
  },
  taxRateValue: {
    fontSize: normalize(20),
    fontFamily: Fonts.bold,
  },
  disclaimer: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    textAlign: "center",
    opacity: 0.6,
  },
  noteCard: {
    borderRadius: normalize(16),
    padding: normalize(20),
    gap: normalize(16),
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  noteTitle: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
  },
  noteContent: { gap: normalize(12) },
  noteText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    lineHeight: normalize(20),
  },
  taxBrackets: {
    gap: normalize(6),
    paddingLeft: normalize(12),
  },
  bracketRow: {
    flexDirection: "row",
    gap: normalize(12),
  },
  bracketText: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    flex: 1,
  },
  noteExample: {
    padding: normalize(12),
    borderRadius: normalize(8),
    gap: normalize(4),
  },
  exampleTitle: {
    fontSize: normalize(13),
    fontFamily: Fonts.bold,
  },
  exampleText: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    lineHeight: normalize(18),
  },
});