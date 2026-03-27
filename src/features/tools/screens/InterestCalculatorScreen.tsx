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
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */

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

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */

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
  { id: "f1", label: "Phí quản lý/dịch vụ", amount: 0, type: "monthly" },
  { id: "f2", label: "Phí mở tài khoản", amount: 0, type: "onetime" },
  { id: "f3", label: "Phí bảo hiểm khoản vay", amount: 0, type: "monthly" },
  { id: "f4", label: "Phí trả nợ trước hạn", amount: 0, type: "prepayment" },
];

const FEE_TYPE_LABEL: Record<Fee["type"], string> = {
  onetime: "Một lần",
  monthly: "Hàng tháng",
  prepayment: "Trả trước hạn",
};

const FEE_TYPE_OPTIONS: BottomSelectOption<Fee["type"]>[] = [
  { label: "Một lần", value: "onetime" },
  { label: "Hàng tháng", value: "monthly" },
  { label: "Trả nợ trước hạn", value: "prepayment" },
];

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - wp(10) - normalize(40);
const CHART_H = normalize(160);

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

const uid = () => Math.random().toString(36).slice(2, 8);

const fmt = (v: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v));

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/* ─────────────────────────────────────────
   LINE CHART
───────────────────────────────────────── */

interface MiniChartProps {
  data: { label: string; interest: number; balance: number }[];
  colors: ReturnType<typeof useAppTheme>["colors"];
}

const LineChart: React.FC<MiniChartProps> = ({ data, colors }) => {
  if (data.length < 2) return null;

  const maxInterest = Math.max(...data.map((d) => d.interest), 1);
  const maxBalance = Math.max(...data.map((d) => d.balance), 1);
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
    y: toY(d.balance, maxBalance),
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
      {/* Grid lines */}
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

      {/* Balance line (mờ) */}
      {renderLine(balancePts, colors.tint, 0.2, 2)}

      {/* Interest line (đậm) */}
      {renderLine(interestPts, colors.tint, 1, 3)}

      {/* Dots - interest */}
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

      {/* X labels */}
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
              T{d.label}
            </ThemedText>
          );
        return null;
      })}
    </View>
  );
};

/* ─────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────── */

const InterestCalculatorScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  /* ── Basic inputs ── */
  const [principal, setPrincipal] = useState<number>(0);
  const [period, setPeriod] = useState(PERIOD_OPTIONS[2]); // 6 tháng
  const [calcType, setCalcType] = useState(CALC_OPTIONS[0]);

  /* ── Rate mode ── */
  const [rateMode, setRateMode] = useState<RateMode>("fixed");
  const [fixedRate, setFixedRate] = useState("0");

  // floating: rate periods thay vì per-month
  const [ratePeriods, setRatePeriods] = useState<RatePeriod[]>([
    { id: uid(), startMonth: 1, rate: "0" },
  ]);
  const [addRateModal, setAddRateModal] = useState(false);
  const [newRateStart, setNewRateStart] = useState("1");
  const [newRateValue, setNewRateValue] = useState("0");

  /* ── Fees ── */
  const [fees, setFees] = useState<Fee[]>(DEFAULT_FEES);
  const [addFeeModal, setAddFeeModal] = useState(false);
  const [newFeeLabel, setNewFeeLabel] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState<number>(0);
  const [newFeeType, setNewFeeType] = useState<Fee["type"]>("monthly");
  const [feeTypeModal, setFeeTypeModal] = useState(false);

  /* ── UI ── */
  const [periodModal, setPeriodModal] = useState(false);
  const [calcModal, setCalcModal] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<"table" | "chart">("table");

  /* ─────────────── helpers ─────────────── */

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
      Alert.alert("Lỗi", `Tháng bắt đầu phải từ 1 đến ${period.value}`);
      return;
    }
    if (ratePeriods.find((p) => p.startMonth === start)) {
      Alert.alert("Lỗi", `Đã có mức lãi suất từ tháng ${start}`);
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
      Alert.alert("Lỗi", "Vui lòng nhập tên phí");
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

  /* ─────────────── CALCULATION ─────────────── */

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

      const newBalance =
        calcType.value === "compound"
          ? balance + interestThisMonth
          : balance;

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

  /* ─────────────── RENDER ─────────────── */

  const borderColor = { borderColor: colors.border };
  const textColor = { color: colors.text };
  const iconColor = { color: colors.icon };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Tính lãi suất" showBackButton />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: hp(4) + insets.bottom },
        ]}
      >
        <ThemedText style={[styles.subtitle, iconColor]}>
          Ước tính lãi khi gửi tiết kiệm hoặc vay
        </ThemedText>

        {/* ══════════ CARD 1: Thông tin cơ bản ══════════ */}
        <SectionCard title="Thông tin khoản tiền" colors={colors}>
          <View style={styles.fieldGroup}>
            <ThemedText style={[styles.label, textColor]}>Số tiền gốc</ThemedText>
            <MoneyInput
              value={principal}
              onChange={setPrincipal}
              currency="đ"
              placeholder="Nhập số tiền"
            />
          </View>

          <Divider colors={colors} />

          <View style={styles.row}>
            <View style={styles.half}>
              <ThemedText style={[styles.label, textColor]}>Kỳ hạn</ThemedText>
              <SelectButton
                label={period.label}
                onPress={() => setPeriodModal(true)}
                colors={colors}
              />
            </View>
            <View style={styles.half}>
              <ThemedText style={[styles.label, textColor]}>Cách tính lãi</ThemedText>
              <SelectButton
                label={calcType.label}
                onPress={() => setCalcModal(true)}
                colors={colors}
              />
            </View>
          </View>
        </SectionCard>

        {/* ══════════ CARD 2: Lãi suất ══════════ */}
        <SectionCard title="Lãi suất" colors={colors}>
          {/* Toggle fixed / floating */}
          <View style={[styles.segmentRow, { backgroundColor: colors.background }]}>
            {(["fixed", "floating"] as RateMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.segmentBtn,
                  rateMode === mode && { backgroundColor: colors.tint },
                ]}
                onPress={() => setRateMode(mode)}
                activeOpacity={0.8}
              >
                <ThemedText
                  style={[
                    styles.segmentLabel,
                    { color: rateMode === mode ? "#fff" : colors.icon },
                  ]}
                >
                  {mode === "fixed" ? "🔒 Cố định" : "📈 Thả nổi"}
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
              <ThemedText style={[styles.rateSuffix, iconColor]}>%/năm</ThemedText>
            </View>
          ) : (
            /* Floating: rate periods */
            <View style={styles.floatingGrid}>
              <ThemedText style={[styles.hintText, iconColor]}>
                Mỗi mức lãi áp dụng từ tháng bắt đầu đến khi có mức mới.
              </ThemedText>

              {ratePeriods.map((rp, idx) => {
                const nextStart = ratePeriods[idx + 1]?.startMonth;
                const toMonth = nextStart ? nextStart - 1 : period.value;
                const isFirst = rp.startMonth === 1 && ratePeriods.length > 1;

                return (
                  <View key={rp.id} style={styles.feeRow}>
                    <View style={styles.feeInfo}>
                      <ThemedText style={[styles.feeLabel, textColor]}>
                        Tháng {rp.startMonth}
                        {toMonth !== rp.startMonth ? ` – ${toMonth}` : ""}
                      </ThemedText>
                      <ThemedText style={[styles.feeType, iconColor]}>
                        {isFirst ? "Lãi suất ban đầu" : "Điều chỉnh lãi suất"}
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

              {/* Add rate period button */}
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
                  Thêm mức lãi suất
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </SectionCard>

        {/* ══════════ CARD 3: Phí ══════════ */}
        <SectionCard title="Phí & Chi phí" colors={colors}>
          {fees.map((fee, idx) => (
            <View key={fee.id}>
              {idx > 0 && <Divider colors={colors} />}
              <View style={styles.feeRow}>
                <View style={styles.feeInfo}>
                  <ThemedText
                    style={[styles.feeLabel, textColor]}
                    numberOfLines={1}
                  >
                    {fee.label}
                  </ThemedText>
                  <ThemedText style={[styles.feeType, iconColor]}>
                    {FEE_TYPE_LABEL[fee.type]}
                  </ThemedText>
                </View>
                <View style={styles.feeRight}>
                  <MoneyInput
                    value={fee.amount}
                    onChange={(v) => updateFeeAmount(fee.id, v)}
                    currency="đ"
                    placeholder="0"
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
              Thêm phí khác
            </ThemedText>
          </TouchableOpacity>
        </SectionCard>

        {/* ══════════ CARD 4: Kết quả ══════════ */}
        <SectionCard title="Kết quả dự kiến" colors={colors}>
          {principal <= 0 ? (
            <ThemedText style={[styles.emptyHint, iconColor]}>
              Nhập số tiền gốc để xem kết quả
            </ThemedText>
          ) : (
            <>
              <ResultRow
                label="Tiền lãi tích lũy"
                value={`${fmt(summary.totalInterest)} đ`}
                colors={colors}
              />
              <Divider colors={colors} />
              <ResultRow
                label="Tổng phí"
                value={`${fmt(summary.totalFees)} đ`}
                colors={colors}
                valueColor={colors.icon}
              />
              {summary.prepayFee > 0 && (
                <ResultRow
                  label="Phí trả trước hạn"
                  value={`${fmt(summary.prepayFee)} đ`}
                  colors={colors}
                  valueColor={colors.icon}
                />
              )}
              <Divider colors={colors} />
              <ResultRow
                label="Tổng nhận cuối kỳ"
                value={`${fmt(summary.finalBalance)} đ`}
                colors={colors}
                valueColor={colors.tint}
                large
              />
              <ThemedText style={[styles.disclaimer, iconColor]}>
                * Kết quả mang tính tham khảo, có thể khác so với thực tế
              </ThemedText>
            </>
          )}
        </SectionCard>

        {/* ══════════ CARD 5: Lịch lãi suất ══════════ */}
        {schedule.length > 0 && (
          <SectionCard title="Lịch lãi suất theo tháng" colors={colors}>
            <View
              style={[styles.tabRow, { backgroundColor: colors.background }]}
            >
              {(["table", "chart"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabBtn,
                    scheduleTab === tab && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setScheduleTab(tab)}
                >
                  <ThemedText
                    style={[
                      styles.tabLabel,
                      { color: scheduleTab === tab ? "#fff" : colors.icon },
                    ]}
                  >
                    {tab === "table" ? "📋 Bảng" : "📊 Biểu đồ"}
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
                  {["Tháng", "LS (%)", "Tiền lãi", "Phí", "Số dư"].map((h) => (
                    <ThemedText key={h} style={[styles.thCell, iconColor]}>
                      {h}
                    </ThemedText>
                  ))}
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
                    Tiền lãi
                  </ThemedText>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: colors.tint, opacity: 0.25 },
                    ]}
                  />
                  <ThemedText style={[styles.legendLabel, iconColor]}>
                    Số dư
                  </ThemedText>
                </View>
                <LineChart
                  data={schedule.map((r) => ({
                    label: String(r.month),
                    interest: r.interest,
                    balance: r.balance,
                  }))}
                  colors={colors}
                />
                <ThemedText style={[styles.chartHint, iconColor]}>
                  Đường đậm = tiền lãi · Đường mờ = số dư tích lũy
                </ThemedText>
              </View>
            )}
          </SectionCard>
        )}
      </ScrollView>

      {/* ════════ MODALS ════════ */}
      <BottomSelectModal
        visible={periodModal}
        title="Chọn kỳ hạn"
        options={PERIOD_OPTIONS}
        selectedValue={period.value}
        onClose={() => setPeriodModal(false)}
        onSelect={handlePeriodChange}
      />
      <BottomSelectModal
        visible={calcModal}
        title="Cách tính lãi"
        options={CALC_OPTIONS}
        selectedValue={calcType.value}
        onClose={() => setCalcModal(false)}
        onSelect={setCalcType}
      />
      <BottomSelectModal
        visible={feeTypeModal}
        title="Loại phí"
        options={FEE_TYPE_OPTIONS}
        selectedValue={newFeeType}
        onClose={() => setFeeTypeModal(false)}
        onSelect={(opt) => setNewFeeType(opt.value)}
      />

      {/* Add Rate Period Modal */}
      <Modal
        visible={addRateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddRateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.modalTitle, textColor]}>
              Thêm mức lãi suất
            </ThemedText>

            <ThemedText style={[styles.label, textColor]}>
              Áp dụng từ tháng (1 – {period.value})
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
              Lãi suất (%/năm)
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
                %/năm
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
                  Huỷ
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.tint }]}
                onPress={addRatePeriod}
              >
                <ThemedText style={[styles.modalBtnLabel, { color: "#fff" }]}>
                  Thêm
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Fee Modal */}
      <Modal
        visible={addFeeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddFeeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.modalTitle, textColor]}>
              Thêm phí mới
            </ThemedText>

            <ThemedText style={[styles.label, textColor]}>Tên phí</ThemedText>
            <TextInput
              value={newFeeLabel}
              onChangeText={setNewFeeLabel}
              placeholder="VD: Phí công chứng"
              placeholderTextColor={colors.icon}
              style={[
                styles.textField,
                { borderColor: colors.border, color: colors.text },
              ]}
            />

            <ThemedText style={[styles.label, textColor]}>Mức phí</ThemedText>
            <MoneyInput
              value={newFeeAmount}
              onChange={setNewFeeAmount}
              currency="đ"
              placeholder="0"
            />

            <ThemedText style={[styles.label, textColor]}>Loại phí</ThemedText>
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
                  Huỷ
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.tint }]}
                onPress={addCustomFee}
              >
                <ThemedText style={[styles.modalBtnLabel, { color: "#fff" }]}>
                  Thêm
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */

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

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */

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
    opacity: 0.7,
  },

  /* Card */
  card: {
    borderRadius: normalize(16),
    padding: normalize(20),
    gap: normalize(16),
  },
  cardTitle: {
    fontSize: normalize(15),
    fontFamily: Fonts.bold,
  },

  /* Field */
  fieldGroup: { gap: normalize(10) },
  label: { fontSize: normalize(14), fontFamily: Fonts.medium },
  divider: { height: 1, opacity: 0.1 },

  /* Row */
  row: { flexDirection: "row", gap: normalize(12) },
  half: { flex: 1, gap: normalize(10) },

  /* Segment toggle */
  segmentRow: {
    flexDirection: "row",
    borderRadius: normalize(12),
    padding: normalize(4),
    gap: normalize(4),
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: normalize(8),
    borderRadius: normalize(10),
    alignItems: "center",
  },
  segmentLabel: { fontSize: normalize(13), fontFamily: Fonts.medium },

  /* Fixed rate input */
  rateWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    paddingBottom: normalize(10),
  },
  rateInput: {
    flex: 1,
    fontSize: normalize(28),
    fontFamily: Fonts.bold,
    padding: 0,
  },
  rateSuffix: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    marginLeft: normalize(6),
  },

  /* Floating rate grid */
  floatingGrid: { gap: normalize(10) },
  hintText: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    opacity: 0.7,
  },
  monthRateInput: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    paddingBottom: normalize(6),
  },
  monthRateText: {
    flex: 1,
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    padding: 0,
  },

  /* Fees */
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  feeInfo: { flex: 1 },
  feeLabel: { fontSize: normalize(14), fontFamily: Fonts.medium },
  feeType: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    marginTop: normalize(2),
  },
  feeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
    width: normalize(130),
  },
  removeBtn: {},
  addFeeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  addFeeLabel: { fontSize: normalize(13), fontFamily: Fonts.medium },

  /* Result */
  emptyHint: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    opacity: 0.6,
    textAlign: "center",
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
    fontSize: normalize(15),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  highlightValue: {
    fontSize: normalize(22),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  disclaimer: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    textAlign: "center",
    opacity: 0.6,
    marginTop: normalize(4),
  },

  /* Schedule tabs */
  tabRow: {
    flexDirection: "row",
    borderRadius: normalize(12),
    padding: normalize(4),
    gap: normalize(4),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: normalize(8),
    borderRadius: normalize(10),
    alignItems: "center",
  },
  tabLabel: { fontSize: normalize(13), fontFamily: Fonts.medium },

  /* Table */
  tableHeader: {
    flexDirection: "row",
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(4),
    borderRadius: normalize(8),
    marginBottom: normalize(4),
  },
  thCell: {
    flex: 1,
    fontSize: normalize(11),
    fontFamily: Fonts.medium,
    textAlign: "center",
    opacity: 0.7,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: normalize(9),
    paddingHorizontal: normalize(4),
    borderRadius: normalize(6),
  },
  tdCell: {
    flex: 1,
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    textAlign: "center",
  },

  /* Chart */
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
    marginBottom: normalize(8),
  },
  legendDot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    marginRight: normalize(8),
  },
  chartHint: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: normalize(8),
    opacity: 0.6,
  },

  /* Select button */
  selectButton: {
    height: normalize(48),
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontSize: normalize(14), fontFamily: Fonts.medium },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    padding: normalize(24),
    gap: normalize(14),
  },
  modalTitle: { fontSize: normalize(17), fontFamily: Fonts.bold },
  textField: {
    borderWidth: 1,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(12),
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
  },
  modalActions: {
    flexDirection: "row",
    gap: normalize(12),
    marginTop: normalize(4),
  },
  modalBtn: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(14),
    alignItems: "center",
  },
  modalBtnLabel: { fontSize: normalize(15), fontFamily: Fonts.bold },
});