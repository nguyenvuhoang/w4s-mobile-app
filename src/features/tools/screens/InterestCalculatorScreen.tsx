import AppHeader from "@/components/base/AppHeader";
import MoneyInput from "@/components/base/MoneyInput";
import BottomSelectModal, {
  BottomSelectOption,
} from "@/components/modals/SelectModal";
import { ThemedText } from "@/components/themed-text";
import { useNotification } from "@/contexts/NotificationContext";
import { Fonts } from "@/core/theme/font";
import { Tokens } from "@/core/theme/theme";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../styles/InterestCalculatorScreen.styles";

type RateMode = "fixed" | "floating";
type CalcType = "simple" | "compound";

interface RatePeriod {
  id: string;
  startMonth: number; // lãi suất áp dụng từ tháng này
  rate: string;       // %/năm
}

interface Fee {
  id: string;
  label: string;
  amount: number;
  type: "onetime" | "monthly" | "prepayment";
  editable?: boolean;
}

interface ScheduleRow {
  month: number;
  rate: number;
  interest: number;
  principal: number;
  balance: number;
  fees: number;
}

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

const CALC_OPTIONS: BottomSelectOption<CalcType>[] = [
  { label: "Lãi đơn", value: "simple" },
  { label: "Lãi kép", value: "compound" },
];

const DEFAULT_FEES: Fee[] = [
  { id: "f1", label: "interest_calculator.fee_management", amount: 0, type: "monthly" },
  { id: "f2", label: "interest_calculator.fee_opening", amount: 0, type: "onetime" },
  { id: "f3", label: "interest_calculator.fee_insurance", amount: 0, type: "monthly" },
  { id: "f4", label: "interest_calculator.fee_prepayment", amount: 0, type: "prepayment" },
];

const FEE_TYPE_OPTIONS: BottomSelectOption<Fee["type"]>[] = [
  { label: "interest_calculator.fee_type_onetime", value: "onetime" },
  { label: "interest_calculator.fee_type_monthly", value: "monthly" },
  { label: "interest_calculator.fee_type_prepayment", value: "prepayment" },
];

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - wp(10) - normalize(40);
const CHART_H = normalize(160);

const uid = () => Math.random().toString(36).slice(2, 8);

const fmt = (v: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v));

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

interface MiniChartProps {
  data: { label: string; interest: number; balance: number }[];
  colors: ReturnType<typeof useAppTheme>["colors"];
  t: any;
}

const LineChart: React.FC<MiniChartProps> = ({ data, colors, t }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (data.length < 2) return null;

  const maxInterest = Math.max(...data.map((d) => d.interest), 1);
  const minBalance = Math.min(...data.map((d) => d.balance));
  const maxBalance = Math.max(...data.map((d) => d.balance), minBalance + 1);
  const totalW = CHART_W - normalize(24);
  const step = totalW / (data.length - 1);

  const toX = (i: number) => i * step;
  const toY = (val: number, max: number) =>
    CHART_H - clamp((val / max) * CHART_H, 2, CHART_H);

  const renderLine = (
    points: { x: number; y: number }[],
    color: string,
    opacity = 1,
    thickness = 3
  ) =>
    points.slice(0, -1).map((p, i) => {
      const nx = points[i + 1].x;
      const ny = points[i + 1].y;
      const dx = nx - p.x;
      const dy = ny - p.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const mx = (p.x + nx) / 2;
      const my = (p.y + ny) / 2;
      return (
        <View
          key={i}
          style={{
            position: "absolute",
            left: mx - len / 2,
            top: my - thickness / 2,
            width: len,
            height: thickness,
            backgroundColor: color,
            opacity,
            borderRadius: thickness,
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      );
    });

  const interestPts = data.map((d, i) => ({
    x: toX(i),
    y: toY(d.interest, maxInterest),
  }));
  const balancePts = data.map((d, i) => ({
    x: toX(i),
    y: CHART_H - clamp(((d.balance - minBalance) / (maxBalance - minBalance)) * CHART_H, 2, CHART_H - 10),
  }));

  return (
    <View
      style={{
        width: CHART_W,
        height: CHART_H + normalize(24),
        position: "relative",
        marginLeft: normalize(12),
      }}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((r) => (
        <View
          key={r}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: CHART_H * r,
            height: 1,
            backgroundColor: colors.border,
            opacity: 0.2,
          }}
        />
      ))}

      <ThemedText style={{ position: "absolute", top: -normalize(18), left: 0, fontSize: normalize(9), color: colors.icon }}>
        Max: {fmt(maxBalance)} đ
      </ThemedText>

      {renderLine(balancePts, colors.tint, 0.2, 2)}
      {renderLine(interestPts, colors.tint, 1, 3)}

      {interestPts.map((p, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: p.x - normalize(4),
            top: p.y - normalize(4),
            width: normalize(8),
            height: normalize(8),
            borderRadius: normalize(4),
            backgroundColor: colors.tint,
            borderWidth: 2,
            borderColor: colors.card,
          }}
        />
      ))}

      {data.map((d, i) => {
        if (
          i === 0 ||
          (i + 1) % Math.ceil(data.length / 6) === 0 ||
          i === data.length - 1
        )
          return (
            <ThemedText
              key={i}
              style={{
                position: "absolute",
                left: toX(i) - normalize(12),
                bottom: 0,
                width: normalize(24),
                fontSize: normalize(9),
                color: colors.icon,
                textAlign: "center",
                fontFamily: Fonts.regular,
              }}
            >
              {t("interest_calculator.table_month").slice(0, 1)}{d.label}
            </ThemedText>
          );
        return null;
      })}

      <View style={{ ...StyleSheet.absoluteFillObject, flexDirection: "row", bottom: normalize(24) }}>
        {data.map((d, i) => (
          <TouchableOpacity
            key={`touch-${i}`}
            style={{ flex: 1, zIndex: 10 }}
            onPress={() => setSelectedIdx(i)}
            activeOpacity={1}
          />
        ))}
      </View>

      {selectedIdx !== null && (
        <>
          <View
            style={{
              position: "absolute",
              left: Math.max(0, Math.min(toX(selectedIdx) - normalize(65), CHART_W - normalize(130))),
              top: -normalize(25),
              backgroundColor: colors.text,
              padding: normalize(6),
              borderRadius: normalize(8),
              minWidth: normalize(130),
              alignItems: "center",
              zIndex: 20,
            }}
            pointerEvents="none"
          >
            <ThemedText style={{ color: colors.background, fontSize: normalize(10), fontFamily: Fonts.bold }}>
              {t("interest_calculator.table_month")} {data[selectedIdx].label}
            </ThemedText>
            <ThemedText style={{ color: colors.background, fontSize: normalize(9), fontFamily: Fonts.regular }}>
              {t("interest_calculator.chart_balance")}: {fmt(data[selectedIdx].balance)} đ
            </ThemedText>
            <ThemedText style={{ color: colors.background, fontSize: normalize(9), fontFamily: Fonts.regular }}>
              {t("interest_calculator.chart_interest")}: {fmt(data[selectedIdx].interest)} đ
            </ThemedText>
          </View>
          <View
            style={{
              position: "absolute",
              left: toX(selectedIdx),
              top: 0,
              bottom: normalize(24),
              width: 1,
              backgroundColor: colors.tint,
              opacity: 0.5,
              zIndex: 5,
            }}
          />
        </>
      )}
    </View>
  );
};

const InterestCalculatorScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showNotification } = useNotification();

  const FEE_TYPE_LABEL: Record<Fee["type"], string> = {
    onetime: t("interest_calculator.fee_type_onetime"),
    monthly: t("interest_calculator.fee_type_monthly"),
    prepayment: t("interest_calculator.fee_type_prepayment"),
  };

  const PERIOD_OPTIONS_DISPLAY = useMemo(
    () =>
      PERIOD_OPTIONS.map((opt) => ({
        ...opt,
        label: t("interest_calculator.month_count", { count: opt.value }),
      })),
    [t]
  );

  const CALC_OPTIONS_DISPLAY = useMemo(
    () => [
      { label: t("interest_calculator.simple_interest"), value: "simple" as CalcType },
      { label: t("interest_calculator.compound_interest"), value: "compound" as CalcType },
    ],
    [t]
  );

  const [principal, setPrincipal] = useState<number>(0);
  const [period, setPeriod] = useState(PERIOD_OPTIONS[2]); // 6 tháng
  const [calcType, setCalcType] = useState(CALC_OPTIONS[0]);

  const [rateMode, setRateMode] = useState<RateMode>("fixed");
  const [fixedRate, setFixedRate] = useState("0");

  // floating: rate periods thay vì per-month
  const [ratePeriods, setRatePeriods] = useState<RatePeriod[]>([
    { id: uid(), startMonth: 1, rate: "0" },
  ]);
  const [addRateModal, setAddRateModal] = useState(false);
  const [newRateStart, setNewRateStart] = useState("1");
  const [newRateValue, setNewRateValue] = useState("0");

  const [fees, setFees] = useState<Fee[]>(DEFAULT_FEES);
  const [addFeeModal, setAddFeeModal] = useState(false);
  const [newFeeLabel, setNewFeeLabel] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState<number>(0);
  const [newFeeType, setNewFeeType] = useState<Fee["type"]>("monthly");
  const [feeTypeModal, setFeeTypeModal] = useState(false);

  const [periodModal, setPeriodModal] = useState(false);
  const [calcModal, setCalcModal] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<"table" | "chart">("table");

  const handlePeriodChange = (opt: BottomSelectOption<number>) => {
    setPeriod(opt);
    setRatePeriods((prev) => {
      const filtered = prev.filter((p) => p.startMonth <= opt.value);
      if (filtered.length === 0) return [{ id: uid(), startMonth: 1, rate: "0" }];
      if (!filtered.find((p) => p.startMonth === 1))
        filtered.unshift({ id: uid(), startMonth: 1, rate: prev[0]?.rate ?? "0" });
      return filtered;
    });
  };

  const addRatePeriod = () => {
    const start = parseInt(newRateStart) || 0;
    if (start < 1 || start > period.value) {
      showNotification(
        t("interest_calculator.err_invalid_month", { max: period.value }),
        "error"
      );
      return;
    }
    if (ratePeriods.find((p) => p.startMonth === start)) {
      showNotification(
        t("interest_calculator.err_duplicate_month", { month: start }),
        "error"
      );
      return;
    }
    setRatePeriods((prev) =>
      [...prev, { id: uid(), startMonth: start, rate: newRateValue }].sort(
        (a, b) => a.startMonth - b.startMonth
      )
    );
    setNewRateStart("");
    setNewRateValue("0");
    setAddRateModal(false);
  };

  const removeRatePeriod = (id: string) => {
    setRatePeriods((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((p) => p.id !== id);
    });
  };

  const updateRatePeriodValue = (id: string, rate: string) => {
    const cleaned = rate.replace(/[^\d.]/g, "");
    setRatePeriods((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rate: cleaned } : p))
    );
  };

  /** Tìm lãi suất áp dụng cho tháng m */
  const getRateForMonth = (m: number): number => {
    const applicable = ratePeriods
      .filter((p) => p.startMonth <= m)
      .sort((a, b) => b.startMonth - a.startMonth);
    return parseFloat(applicable[0]?.rate || "0") || 0;
  };

  const updateFeeAmount = (id: string, amount: number) => {
    setFees((prev) => prev.map((f) => (f.id === id ? { ...f, amount } : f)));
  };

  const removeFee = (id: string) => {
    setFees((prev) => prev.filter((f) => f.id !== id));
  };

  const addCustomFee = () => {
    if (!newFeeLabel.trim()) {
      showNotification(t("interest_calculator.err_empty_fee_name"), "error");
      return;
    }
    const fee: Fee = {
      id: uid(),
      label: newFeeLabel.trim(),
      amount: newFeeAmount,
      type: newFeeType,
      editable: true,
    };
    setFees((prev) => [...prev, fee]);
    setNewFeeLabel("");
    setNewFeeAmount(0);
    setNewFeeType("monthly");
    setAddFeeModal(false);
  };

  const schedule = useMemo<ScheduleRow[]>(() => {
    const P = principal;
    const months = period.value;
    if (P <= 0 || months <= 0) return [];

    const onetimeFees = fees
      .filter((f) => f.type === "onetime" && f.amount > 0)
      .reduce((s, f) => s + f.amount, 0);
    const monthlyFeeTotal = fees
      .filter((f) => f.type === "monthly" && f.amount > 0)
      .reduce((s, f) => s + f.amount, 0);

    const rows: ScheduleRow[] = [];
    let balance = P;

    for (let m = 1; m <= months; m++) {
      const annualRate =
        rateMode === "fixed"
          ? parseFloat(fixedRate) || 0
          : getRateForMonth(m);

      const monthlyRate = annualRate / 100 / 12;

      let interestThisMonth = 0;
      if (calcType.value === "simple") {
        interestThisMonth = P * (annualRate / 100) * (1 / 12);
      } else {
        interestThisMonth = balance * monthlyRate;
      }

      const feesThisMonth = (m === 1 ? onetimeFees : 0) + monthlyFeeTotal;

      const newBalance = balance + interestThisMonth;

      rows.push({
        month: m,
        rate: annualRate,
        interest: interestThisMonth,
        principal: 0,
        balance: newBalance,
        fees: feesThisMonth,
      });

      balance = newBalance;
    }

    return rows;
  }, [principal, period, rateMode, fixedRate, ratePeriods, calcType, fees]);

  const summary = useMemo(() => {
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
    const totalFees = schedule.reduce((s, r) => s + r.fees, 0);
    const prepayFee = fees
      .filter((f) => f.type === "prepayment" && f.amount > 0)
      .reduce((s, f) => s + f.amount, 0);
    const finalBalance = schedule[schedule.length - 1]?.balance ?? principal;
    return { totalInterest, totalFees, prepayFee, finalBalance };
  }, [schedule, fees, principal]);

  const borderColor = { borderColor: colors.border };
  const textColor = { color: colors.text };
  const iconColor = { color: colors.icon };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title={t("interest_calculator.title")} showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: hp(4) + insets.bottom },
          ]}
        >
          <ThemedText style={[styles.subtitle, iconColor]}>
            {t("interest_calculator.subtitle")}
          </ThemedText>

          <SectionCard title={t("interest_calculator.card_basic_info")} colors={colors}>
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, textColor]}>{t("interest_calculator.principal")}</ThemedText>
              <MoneyInput
                value={principal}
                onChange={setPrincipal}
                currency="đ"
                placeholder={t("interest_calculator.principal_placeholder")}
              />
            </View>

            <Divider colors={colors} />

            <View style={styles.row}>
              <View style={styles.half}>
                <ThemedText style={[styles.label, textColor]}>{t("interest_calculator.period")}</ThemedText>
                <SelectButton
                  label={t("interest_calculator.month_count", { count: period.value })}
                  onPress={() => setPeriodModal(true)}
                  colors={colors}
                />
              </View>
              <View style={styles.half}>
                <ThemedText style={[styles.label, textColor]}>{t("interest_calculator.calc_type")}</ThemedText>
                <SelectButton
                  label={t(`interest_calculator.${calcType.value}_interest`)}
                  onPress={() => setCalcModal(true)}
                  colors={colors}
                />
              </View>
            </View>
          </SectionCard>

          <SectionCard title={t("interest_calculator.rate")} colors={colors}>
            <View style={[styles.segmentRow, { backgroundColor: colors.background }]}>
              {(["fixed", "floating"] as RateMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.segmentBtn,
                    rateMode === mode && { backgroundColor: "transparent", overflow: "hidden" },
                  ]}
                  onPress={() => setRateMode(mode)}
                  activeOpacity={0.8}
                >
                  {rateMode === mode && (
                    <LinearGradient
                      colors={Tokens.gradients.base}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <ThemedText
                    style={[
                      styles.segmentLabel,
                      { color: rateMode === mode ? "#fff" : colors.icon },
                    ]}
                  >
                    {t(`interest_calculator.${mode}`)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {rateMode === "fixed" ? (
              <View style={[styles.rateWrapper, borderColor]}>
                <TextInput
                  value={fixedRate}
                  onChangeText={(t) => {
                    const c = t.replace(/[^\d.]/g, "");
                    if (c.split(".").length > 2) return;
                    setFixedRate(c);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.icon}
                  style={[styles.rateInput, textColor]}
                />
                <ThemedText style={[styles.rateSuffix, iconColor]}>{t("interest_calculator.annual_rate")}</ThemedText>
              </View>
            ) : (
              <View style={styles.floatingGrid}>
                <ThemedText style={[styles.hintText, iconColor]}>
                  {t("interest_calculator.floating_hint")}
                </ThemedText>

                {ratePeriods.map((rp, idx) => {
                  const nextStart = ratePeriods[idx + 1]?.startMonth;
                  const toMonth = nextStart ? nextStart - 1 : period.value;
                  const isFirst = rp.startMonth === 1;

                  return (
                    <View key={rp.id} style={styles.feeRow}>
                      <View style={styles.feeInfo}>
                        <ThemedText style={[styles.feeLabel, textColor]}>
                          {t("interest_calculator.table_month")} {rp.startMonth}
                          {toMonth !== rp.startMonth ? ` – ${toMonth}` : ""}
                        </ThemedText>
                        <ThemedText style={[styles.feeType, iconColor]}>
                          {isFirst ? t("interest_calculator.initial_rate") : t("interest_calculator.adjust_rate")}
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.monthRateInput,
                          borderColor,
                          { flex: 0, width: normalize(110) },
                        ]}
                      >
                        <TextInput
                          value={rp.rate}
                          onChangeText={(t) => updateRatePeriodValue(rp.id, t)}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={colors.icon}
                          style={[styles.monthRateText, textColor]}
                        />
                        <ThemedText style={[styles.rateSuffix, iconColor]}>%</ThemedText>
                      </View>
                      {ratePeriods.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeRatePeriod(rp.id)}
                          style={styles.removeBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={normalize(18)}
                            color={colors.icon}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={[styles.addFeeBtn, { borderColor: colors.tint }]}
                  onPress={() => {
                    const usedMonths = new Set(ratePeriods.map((p) => p.startMonth));
                    let suggested = 2;
                    while (usedMonths.has(suggested) && suggested <= period.value)
                      suggested++;
                    setNewRateStart(
                      suggested <= period.value ? String(suggested) : ""
                    );
                    setNewRateValue(
                      ratePeriods[ratePeriods.length - 1]?.rate ?? "0"
                    );
                    setAddRateModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={normalize(18)}
                    color={colors.tint}
                  />
                  <ThemedText style={[styles.addFeeLabel, { color: colors.tint }]}>
                    {t("interest_calculator.add_rate")}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </SectionCard>

          <SectionCard title={t("interest_calculator.fees")} colors={colors}>
            {fees.map((fee, idx) => (
              <View key={fee.id}>
                {idx > 0 && <Divider colors={colors} />}
                <View style={styles.feeRow}>
                  <View style={styles.feeInfo}>
                    <ThemedText
                      style={[styles.feeLabel, textColor]}
                      numberOfLines={1}
                    >
                      {t(fee.label)}
                    </ThemedText>
                    <ThemedText style={[styles.feeType, iconColor]}>
                      {FEE_TYPE_LABEL[fee.type]}
                    </ThemedText>
                  </View>
                  <View style={styles.feeRight}>
                    <MoneyInput
                      containerStyle={{ flex: 1, height: normalize(40), paddingHorizontal: normalize(8) }}
                      inputStyle={{ fontSize: normalize(14) }}
                      value={fee.amount}
                      onChange={(v) => updateFeeAmount(fee.id, v)}
                      currency="đ"
                      placeholder="0"
                      showSuggestions={false}
                    />
                    {fee.editable && (
                      <TouchableOpacity
                        onPress={() => removeFee(fee.id)}
                        style={styles.removeBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={normalize(18)}
                          color={colors.icon}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.addFeeBtn, { borderColor: colors.tint }]}
              onPress={() => setAddFeeModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-circle-outline"
                size={normalize(18)}
                color={colors.tint}
              />
              <ThemedText style={[styles.addFeeLabel, { color: colors.tint }]}>
                {t("interest_calculator.add_fee")}
              </ThemedText>
            </TouchableOpacity>
          </SectionCard>

          <SectionCard title={t("interest_calculator.results")} colors={colors}>
            {principal <= 0 ? (
              <ThemedText style={[styles.emptyHint, iconColor]}>
                {t("interest_calculator.input_principal_hint")}
              </ThemedText>
            ) : (
              <>
                <ResultRow
                  label={t("interest_calculator.total_interest")}
                  value={`${fmt(summary.totalInterest)} đ`}
                  colors={colors}
                />
                <Divider colors={colors} />
                <ResultRow
                  label={t("interest_calculator.total_fees")}
                  value={`${fmt(summary.totalFees)} đ`}
                  colors={colors}
                  valueColor={colors.icon}
                />
                {summary.prepayFee > 0 && (
                  <ResultRow
                    label={t("interest_calculator.prepayment_fee")}
                    value={`${fmt(summary.prepayFee)} đ`}
                    colors={colors}
                    valueColor={colors.icon}
                  />
                )}
                <Divider colors={colors} />
                <ResultRow
                  label={t("interest_calculator.final_balance")}
                  value={`${fmt(summary.finalBalance)} đ`}
                  colors={colors}
                  valueColor={colors.tint}
                  large
                />
                <ThemedText style={[styles.disclaimer, iconColor]}>
                  {t("interest_calculator.disclaimer")}
                </ThemedText>
              </>
            )}
          </SectionCard>

          {schedule.length > 0 && (
            <SectionCard title={t("interest_calculator.schedule")} colors={colors}>
              <View
                style={[styles.tabRow, { backgroundColor: colors.background }]}
              >
                {(["table", "chart"] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tabBtn,
                      scheduleTab === tab && { backgroundColor: "transparent", overflow: "hidden" },
                    ]}
                    onPress={() => setScheduleTab(tab)}
                  >
                    {scheduleTab === tab && (
                      <LinearGradient
                        colors={Tokens.gradients.base}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <ThemedText
                      style={[
                        styles.tabLabel,
                        { color: scheduleTab === tab ? "#fff" : colors.icon },
                      ]}
                    >
                      {t(`interest_calculator.tab_${tab}`)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {scheduleTab === "table" ? (
                <View>
                  <View
                    style={[
                      styles.tableHeader,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <ThemedText style={[styles.thCell, iconColor]}>{t("interest_calculator.table_month")}</ThemedText>
                    <ThemedText style={[styles.thCell, iconColor]}>{t("interest_calculator.table_rate")}</ThemedText>
                    <ThemedText style={[styles.thCell, iconColor]}>{t("interest_calculator.table_interest")}</ThemedText>
                    <ThemedText style={[styles.thCell, iconColor]}>{t("interest_calculator.table_fees")}</ThemedText>
                    <ThemedText style={[styles.thCell, iconColor]}>{t("interest_calculator.table_balance")}</ThemedText>
                  </View>
                  {schedule.map((row, idx) => (
                    <View
                      key={row.month}
                      style={[
                        styles.tableRow,
                        idx % 2 === 0 && {
                          backgroundColor: colors.background + "60",
                        },
                      ]}
                    >
                      <ThemedText style={[styles.tdCell, textColor]}>
                        {row.month}
                      </ThemedText>
                      <ThemedText style={[styles.tdCell, textColor]}>
                        {row.rate.toFixed(1)}
                      </ThemedText>
                      <ThemedText
                        style={[styles.tdCell, { color: colors.tint }]}
                        numberOfLines={1}
                      >
                        {fmt(row.interest)}
                      </ThemedText>
                      <ThemedText
                        style={[styles.tdCell, iconColor]}
                        numberOfLines={1}
                      >
                        {fmt(row.fees)}
                      </ThemedText>
                      <ThemedText
                        style={[styles.tdCell, textColor]}
                        numberOfLines={1}
                      >
                        {fmt(row.balance)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : (
                <View>
                  <View style={styles.legendRow}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.tint },
                      ]}
                    />
                    <ThemedText style={[styles.legendLabel, iconColor]}>
                      {t("interest_calculator.chart_interest")}
                    </ThemedText>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.tint, opacity: 0.25 },
                      ]}
                    />
                    <ThemedText style={[styles.legendLabel, iconColor]}>
                      {t("interest_calculator.chart_balance")}
                    </ThemedText>
                  </View>
                  <LineChart
                    data={schedule.reduce<{ label: string, interest: number, balance: number }[]>((acc, r, i) => {
                      const prevInterest = i > 0 ? acc[i - 1].interest : 0;
                      acc.push({
                        label: String(r.month),
                        interest: prevInterest + r.interest,
                        balance: r.balance,
                      });
                      return acc;
                    }, [])}
                    colors={colors}
                    t={t}
                  />
                  <ThemedText style={[styles.chartHint, iconColor]}>
                    {t("interest_calculator.chart_hint")}
                  </ThemedText>
                </View>
              )}
            </SectionCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSelectModal
        visible={periodModal}
        title={t("interest_calculator.period")}
        options={PERIOD_OPTIONS_DISPLAY}
        selectedValue={period.value}
        onClose={() => setPeriodModal(false)}
        onSelect={handlePeriodChange}
      />
      <BottomSelectModal
        visible={calcModal}
        title={t("interest_calculator.calc_type")}
        options={CALC_OPTIONS_DISPLAY}
        selectedValue={calcType.value}
        onClose={() => setCalcModal(false)}
        onSelect={setCalcType}
      />
      <BottomSelectModal
        visible={feeTypeModal}
        title={t("interest_calculator.fee_type")}
        options={FEE_TYPE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
        selectedValue={newFeeType}
        onClose={() => setFeeTypeModal(false)}
        onSelect={(opt) => setNewFeeType(opt.value)}
      />

      <Modal
        visible={addRateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddRateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.modalTitle, textColor]}>
              {t("interest_calculator.modal_add_rate")}
            </ThemedText>

            <ThemedText style={[styles.label, textColor]}>
              {t("interest_calculator.start_month", { max: period.value })}
            </ThemedText>
            <TextInput
              value={newRateStart}
              onChangeText={(t) => setNewRateStart(t.replace(/[^\d]/g, ""))}
              keyboardType="number-pad"
              placeholder="VD: 7"
              placeholderTextColor={colors.icon}
              style={[
                styles.textField,
                { borderColor: colors.border, color: colors.text },
              ]}
            />

            <ThemedText style={[styles.label, textColor]}>
              {t("interest_calculator.rate")} ({t("interest_calculator.annual_rate")})
            </ThemedText>
            <View style={[styles.rateWrapper, { borderColor: colors.border }]}>
              <TextInput
                value={newRateValue}
                onChangeText={(t) => {
                  const c = t.replace(/[^\d.]/g, "");
                  if (c.split(".").length > 2) return;
                  setNewRateValue(c);
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.icon}
                style={[styles.rateInput, textColor]}
              />
              <ThemedText style={[styles.rateSuffix, iconColor]}>
                {t("interest_calculator.annual_rate")}
              </ThemedText>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => setAddRateModal(false)}
              >
                <ThemedText style={[styles.modalBtnLabel, iconColor]}>
                  {t("common.cancel")}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "transparent", overflow: "hidden" }]}
                onPress={addRatePeriod}
              >
                <LinearGradient
                  colors={Tokens.gradients.base}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <ThemedText style={[styles.modalBtnLabel, { color: "#fff" }]}>
                  {t("common.add")}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={addFeeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddFeeModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.modalTitle, textColor]}>
              {t("interest_calculator.modal_add_fee")}
            </ThemedText>

            <ThemedText style={[styles.label, textColor]}>{t("interest_calculator.fee_name")}</ThemedText>
            <TextInput
              value={newFeeLabel}
              onChangeText={setNewFeeLabel}
              placeholder={t("interest_calculator.placeholder_fee_name")}
              placeholderTextColor={colors.icon}
              style={[
                styles.textField,
                { borderColor: colors.border, color: colors.text },
              ]}
            />

            <ThemedText style={[styles.label, textColor]}>{t("interest_calculator.fee_amount")}</ThemedText>
            <MoneyInput
              value={newFeeAmount}
              onChange={setNewFeeAmount}
              currency="đ"
              placeholder="0"
              showSuggestions={false}
            />

            <ThemedText style={[styles.label, textColor]}>{t("interest_calculator.fee_type")}</ThemedText>
            <TouchableOpacity
              style={[
                styles.selectButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFeeTypeModal(true)}
            >
              <ThemedText style={[styles.selectText, textColor]}>
                {FEE_TYPE_LABEL[newFeeType]}
              </ThemedText>
              <Ionicons
                name="chevron-down"
                size={normalize(18)}
                color={colors.icon}
              />
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => setAddFeeModal(false)}
              >
                <ThemedText style={[styles.modalBtnLabel, iconColor]}>
                  {t("common.cancel")}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "transparent", overflow: "hidden" }]}
                onPress={addCustomFee}
              >
                <LinearGradient
                  colors={Tokens.gradients.base}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <ThemedText style={[styles.modalBtnLabel, { color: "#fff" }]}>
                  {t("common.add")}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useAppTheme>["colors"];
}
const SectionCard: React.FC<SectionCardProps> = ({ title, children, colors }) => (
  <View style={[styles.card, { backgroundColor: colors.card }]}>
    <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
      {title}
    </ThemedText>
    {children}
  </View>
);

const Divider: React.FC<{
  colors: ReturnType<typeof useAppTheme>["colors"];
}> = ({ colors }) => (
  <View style={[styles.divider, { backgroundColor: colors.border }]} />
);

interface SelectButtonProps {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
}
const SelectButton: React.FC<SelectButtonProps> = ({
  label,
  onPress,
  colors,
}) => (
  <TouchableOpacity
    style={[
      styles.selectButton,
      { backgroundColor: colors.background, borderColor: colors.border },
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <ThemedText style={[styles.selectText, { color: colors.text }]}>
      {label}
    </ThemedText>
    <Ionicons name="chevron-down" size={normalize(18)} color={colors.icon} />
  </TouchableOpacity>
);

interface ResultRowProps {
  label: string;
  value: string;
  colors: ReturnType<typeof useAppTheme>["colors"];
  valueColor?: string;
  large?: boolean;
}
const ResultRow: React.FC<ResultRowProps> = ({
  label,
  value,
  colors,
  valueColor,
  large,
}) => (
  <View style={styles.resultItem}>
    <ThemedText
      style={[styles.resultLabel, { color: colors.icon }]}
      numberOfLines={1}
    >
      {label}
    </ThemedText>
    <ThemedText
      style={[
        large ? styles.highlightValue : styles.resultValue,
        { color: valueColor ?? colors.text },
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
    >
      {value}
    </ThemedText>
  </View>
);

export default InterestCalculatorScreen;