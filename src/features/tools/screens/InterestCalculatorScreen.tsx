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

interface MonthlyRate {
  month: number;   // 1-based
  rate: string;    // %/năm, string to allow editing
}

interface Fee {
  id: string;
  label: string;
  amount: number;
  type: "onetime" | "monthly" | "prepayment"; // onetime=một lần, monthly=hàng tháng, prepayment=trả trước hạn
  editable?: boolean; // user-added fees
}

interface ScheduleRow {
  month: number;
  rate: number;       // %/năm effective that month
  interest: number;   // tiền lãi tháng đó
  principal: number;  // phần gốc trả (0 if saving)
  balance: number;    // dư nợ / số dư cuối tháng
  fees: number;       // tổng phí tháng đó
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
const CHART_W = SCREEN_W - wp(10) - normalize(40); // card padding
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
   MINI CHART (SVG-like with View boxes)
   Renders a simple bar/line area chart using
   absolute-positioned Views (no SVG lib needed).
───────────────────────────────────────── */

interface MiniChartProps {
  data: { label: string; interest: number; balance: number }[];
  colors: ReturnType<typeof useAppTheme>["colors"];
}

const MiniChart: React.FC<MiniChartProps> = ({ data, colors }) => {
  if (data.length === 0) return null;

  const maxBalance = Math.max(...data.map((d) => d.balance), 1);
  const maxInterest = Math.max(...data.map((d) => d.interest), 1);
  const barW = clamp((CHART_W - normalize(24)) / data.length - 2, 4, 28);
  const gap = (CHART_W - normalize(24) - barW * data.length) / (data.length + 1);

  return (
    <View style={{ width: CHART_W, height: CHART_H + normalize(24), position: "relative" }}>
      {/* Y-axis grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <View
          key={ratio}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: normalize(24) + CHART_H * ratio,
            height: 1,
            backgroundColor: colors.border,
            opacity: 0.2,
          }}
        />
      ))}

      {/* Bars (balance) + line dots (interest) */}
      {data.map((d, i) => {
        const x = gap + i * (barW + gap);
        const balH = clamp((d.balance / maxBalance) * CHART_H, 1, CHART_H);
        const intH = clamp((d.interest / maxInterest) * CHART_H, 1, CHART_H);

        return (
          <View key={i}>
            {/* Balance bar */}
            <View
              style={{
                position: "absolute",
                left: x,
                bottom: normalize(24),
                width: barW,
                height: balH,
                backgroundColor: colors.tint,
                opacity: 0.25,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
              }}
            />
            {/* Interest bar overlay */}
            <View
              style={{
                position: "absolute",
                left: x,
                bottom: normalize(24),
                width: barW,
                height: intH,
                backgroundColor: colors.tint,
                opacity: 0.85,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
              }}
            />
            {/* X label (every few months) */}
            {(i === 0 || (i + 1) % Math.ceil(data.length / 6) === 0 || i === data.length - 1) && (
              <ThemedText
                style={{
                  position: "absolute",
                  left: x - barW,
                  bottom: 0,
                  width: barW * 3,
                  fontSize: normalize(9),
                  color: colors.icon,
                  textAlign: "center",
                  fontFamily: Fonts.regular,
                }}
              >
                T{d.label}
              </ThemedText>
            )}
          </View>
        );
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

  // floating: one entry per month, lazy-init when period changes
  const [monthlyRates, setMonthlyRates] = useState<MonthlyRate[]>(
    () => buildDefaultMonthlyRates(PERIOD_OPTIONS[2].value, "0")
  );

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

  function buildDefaultMonthlyRates(months: number, defaultRate: string): MonthlyRate[] {
    return Array.from({ length: months }, (_, i) => ({
      month: i + 1,
      rate: defaultRate,
    }));
  }

  const handlePeriodChange = (opt: BottomSelectOption<number>) => {
    setPeriod(opt);
    // Resize monthlyRates array
    setMonthlyRates((prev) => {
      const next: MonthlyRate[] = [];
      for (let m = 1; m <= opt.value; m++) {
        const existing = prev.find((r) => r.month === m);
        next.push(existing ?? { month: m, rate: prev[prev.length - 1]?.rate ?? "0" });
      }
      return next;
    });
  };

  const updateMonthlyRate = (month: number, rate: string) => {
    const cleaned = rate.replace(/[^\d.]/g, "");
    setMonthlyRates((prev) =>
      prev.map((r) => (r.month === month ? { ...r, rate: cleaned } : r))
    );
  };

  /** Copy rate from a month down to all subsequent months */
  const propagateRate = (fromMonth: number) => {
    const src = monthlyRates.find((r) => r.month === fromMonth);
    if (!src) return;
    setMonthlyRates((prev) =>
      prev.map((r) => (r.month >= fromMonth ? { ...r, rate: src.rate } : r))
    );
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
          : parseFloat(monthlyRates[m - 1]?.rate || "0") || 0;

      const monthlyRate = annualRate / 100 / 12;

      let interestThisMonth = 0;

      if (calcType.value === "simple") {
        interestThisMonth = P * (annualRate / 100) * (1 / 12);
      } else {
        interestThisMonth = balance * monthlyRate;
      }

      const feesThisMonth =
        (m === 1 ? onetimeFees : 0) + monthlyFeeTotal;

      // For savings: principal stays, balance grows with compound
      // or stays flat with simple (interest paid out separately)
      const newBalance =
        calcType.value === "compound"
          ? balance + interestThisMonth
          : balance; // simple: principal untouched

      rows.push({
        month: m,
        rate: annualRate,
        interest: interestThisMonth,
        principal: 0, // savings product; 0 = no periodic repayment
        balance: newBalance,
        fees: feesThisMonth,
      });

      balance = newBalance;
    }

    return rows;
  }, [principal, period, rateMode, fixedRate, monthlyRates, calcType, fees]);

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

  const cardBg = { backgroundColor: colors.card };
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
          {/* Số tiền gốc */}
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

          {/* Kỳ hạn + Cách tính */}
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
            /* Fixed rate input */
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
            /* Floating: per-month inputs */
            <View style={styles.floatingGrid}>
              <ThemedText style={[styles.hintText, iconColor]}>
                Nhập lãi suất cho từng tháng. Nhấn "→ Áp dụng" để copy xuống các tháng tiếp theo.
              </ThemedText>
              {monthlyRates.map((mr) => (
                <View key={mr.month} style={styles.monthRateRow}>
                  <ThemedText style={[styles.monthLabel, textColor]}>
                    Tháng {mr.month}
                  </ThemedText>
                  <View style={[styles.monthRateInput, borderColor]}>
                    <TextInput
                      value={mr.rate}
                      onChangeText={(t) => updateMonthlyRate(mr.month, t)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.icon}
                      style={[styles.monthRateText, textColor]}
                    />
                    <ThemedText style={[styles.rateSuffix, iconColor]}>%</ThemedText>
                  </View>
                  {mr.month < period.value && (
                    <TouchableOpacity
                      style={[styles.propagateBtn, { borderColor: colors.tint }]}
                      onPress={() => propagateRate(mr.month)}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={[styles.propagateLabel, { color: colors.tint }]}>
                        → Áp dụng
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
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
                  <ThemedText style={[styles.feeLabel, textColor]} numberOfLines={1}>
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
                      <Ionicons name="close-circle" size={normalize(18)} color={colors.icon} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}

          {/* Add fee button */}
          <TouchableOpacity
            style={[styles.addFeeBtn, { borderColor: colors.tint }]}
            onPress={() => setAddFeeModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={normalize(18)} color={colors.tint} />
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
            {/* Tab switcher */}
            <View style={[styles.tabRow, { backgroundColor: colors.background }]}>
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
              /* ── TABLE VIEW ── */
              <View>
                {/* Header */}
                <View style={[styles.tableHeader, { backgroundColor: colors.background }]}>
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
                      idx % 2 === 0 && { backgroundColor: colors.background + "60" },
                    ]}
                  >
                    <ThemedText style={[styles.tdCell, textColor]}>{row.month}</ThemedText>
                    <ThemedText style={[styles.tdCell, textColor]}>
                      {row.rate.toFixed(1)}
                    </ThemedText>
                    <ThemedText style={[styles.tdCell, { color: colors.tint }]} numberOfLines={1}>
                      {fmt(row.interest)}
                    </ThemedText>
                    <ThemedText style={[styles.tdCell, iconColor]} numberOfLines={1}>
                      {fmt(row.fees)}
                    </ThemedText>
                    <ThemedText style={[styles.tdCell, textColor]} numberOfLines={1}>
                      {fmt(row.balance)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              /* ── CHART VIEW ── */
              <View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
                  <ThemedText style={[styles.legendLabel, iconColor]}>Tiền lãi</ThemedText>
                  <View style={[styles.legendDot, { backgroundColor: colors.tint, opacity: 0.25 }]} />
                  <ThemedText style={[styles.legendLabel, iconColor]}>Số dư</ThemedText>
                </View>
                <MiniChart
                  data={schedule.map((r) => ({
                    label: String(r.month),
                    interest: r.interest,
                    balance: r.balance,
                  }))}
                  colors={colors}
                />
                <ThemedText style={[styles.chartHint, iconColor]}>
                  Cột đậm = tiền lãi · Cột mờ = số dư tích lũy
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

      {/* Add Fee Modal */}
      <Modal
        visible={addFeeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddFeeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.modalTitle, textColor]}>Thêm phí mới</ThemedText>

            <ThemedText style={[styles.label, textColor]}>Tên phí</ThemedText>
            <TextInput
              value={newFeeLabel}
              onChangeText={setNewFeeLabel}
              placeholder="VD: Phí công chứng"
              placeholderTextColor={colors.icon}
              style={[styles.textField, { borderColor: colors.border, color: colors.text }]}
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
              style={[styles.selectButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setFeeTypeModal(true)}
            >
              <ThemedText style={[styles.selectText, textColor]}>
                {FEE_TYPE_LABEL[newFeeType]}
              </ThemedText>
              <Ionicons name="chevron-down" size={normalize(18)} color={colors.icon} />
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.background }]}
                onPress={() => setAddFeeModal(false)}
              >
                <ThemedText style={[styles.modalBtnLabel, iconColor]}>Huỷ</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.tint }]}
                onPress={addCustomFee}
              >
                <ThemedText style={[styles.modalBtnLabel, { color: "#fff" }]}>Thêm</ThemedText>
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
    <ThemedText style={[styles.cardTitle, { color: colors.text }]}>{title}</ThemedText>
    {children}
  </View>
);

const Divider: React.FC<{ colors: ReturnType<typeof useAppTheme>["colors"] }> = ({ colors }) => (
  <View style={[styles.divider, { backgroundColor: colors.border }]} />
);

interface SelectButtonProps {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
}
const SelectButton: React.FC<SelectButtonProps> = ({ label, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.selectButton, { backgroundColor: colors.background, borderColor: colors.border }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <ThemedText style={[styles.selectText, { color: colors.text }]}>{label}</ThemedText>
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
const ResultRow: React.FC<ResultRowProps> = ({ label, value, colors, valueColor, large }) => (
  <View style={styles.resultItem}>
    <ThemedText style={[styles.resultLabel, { color: colors.icon }]} numberOfLines={1}>
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
  rateSuffix: { fontSize: normalize(14), fontFamily: Fonts.medium, marginLeft: normalize(6) },

  /* Floating rate grid */
  floatingGrid: { gap: normalize(10) },
  hintText: { fontSize: normalize(12), fontFamily: Fonts.regular, opacity: 0.7 },
  monthRateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  monthLabel: {
    width: normalize(62),
    fontSize: normalize(13),
    fontFamily: Fonts.medium,
  },
  monthRateInput: {
    flex: 1,
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
  propagateBtn: {
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(5),
    borderRadius: normalize(8),
    borderWidth: 1,
  },
  propagateLabel: { fontSize: normalize(11), fontFamily: Fonts.medium },

  /* Fees */
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  feeInfo: { flex: 1 },
  feeLabel: { fontSize: normalize(14), fontFamily: Fonts.medium },
  feeType: { fontSize: normalize(11), fontFamily: Fonts.regular, marginTop: normalize(2) },
  feeRight: { flexDirection: "row", alignItems: "center", gap: normalize(6) },
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
  emptyHint: { fontSize: normalize(13), fontFamily: Fonts.regular, opacity: 0.6, textAlign: "center" },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: normalize(12),
  },
  resultLabel: { fontSize: normalize(14), fontFamily: Fonts.regular, flexShrink: 0 },
  resultValue: { fontSize: normalize(15), fontFamily: Fonts.bold, textAlign: "right", flex: 1 },
  highlightValue: { fontSize: normalize(22), fontFamily: Fonts.bold, textAlign: "right", flex: 1 },
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
  legendRow: { flexDirection: "row", alignItems: "center", gap: normalize(6), marginBottom: normalize(8) },
  legendDot: { width: normalize(10), height: normalize(10), borderRadius: 5 },
  legendLabel: { fontSize: normalize(11), fontFamily: Fonts.regular, marginRight: normalize(8) },
  chartHint: { fontSize: normalize(11), fontFamily: Fonts.regular, textAlign: "center", marginTop: normalize(8), opacity: 0.6 },

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

  /* Add fee modal */
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
  modalActions: { flexDirection: "row", gap: normalize(12), marginTop: normalize(4) },
  modalBtn: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(14),
    alignItems: "center",
  },
  modalBtnLabel: { fontSize: normalize(15), fontFamily: Fonts.bold },
});