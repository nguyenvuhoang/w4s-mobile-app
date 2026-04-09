import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useNotification } from "@/contexts/NotificationContext";
import { Fonts } from "@/core/theme/font";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { usePaybookDetail } from "@/features/paybook/hooks/usePaybook";
import type { LoanStatus } from "@/features/paybook/types";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import type {
  InterestCalcMethod,
  InterestRateType,
  PaymentType,
} from "@/services/repositories/paybook.repository";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Option configs ───────────────────────────────────────────────────────────

const INTEREST_CALC_METHODS: { key: InterestCalcMethod; label: string; desc: string }[] = [
  { key: "REDUCING", label: "Dư nợ giảm dần", desc: "Lãi tính trên số dư còn lại" },
  { key: "FLAT", label: "Lãi phẳng", desc: "Lãi tính theo số gốc ban đầu" },
];

const PAYMENT_TYPES: { key: PaymentType; label: string; icon: string; desc: string }[] = [
  { key: "BULLET", label: "Trả 1 lần", icon: "circle-check", desc: "Trả toàn bộ cuối kỳ" },
  { key: "INSTALLMENT", label: "Trả góp", icon: "calendar-days", desc: "Trả theo nhiều kỳ" },
];

const STATUS_OPTIONS: { key: LoanStatus; label: string; color: string }[] = [
  { key: "ACTIVE", label: "Đang hoạt động", color: "#22C55E" },
  { key: "COMPLETED", label: "Đã hoàn thành", color: "#6366F1" },
  { key: "OVERDUE", label: "Quá hạn", color: "#EF4444" },
  { key: "CANCELLED", label: "Đã huỷ", color: "#9CA3AF" },
];

// ─── CollapsibleSection ───────────────────────────────────────────────────────

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  enabled: boolean;
  onToggle: (val: boolean) => void;
  accentColor: string;
  colors: any;
  children: React.ReactNode;
}

const CollapsibleSection = ({
  title,
  subtitle,
  enabled,
  onToggle,
  accentColor,
  colors,
  children,
}: CollapsibleSectionProps) => {
  const animHeight = useRef(new Animated.Value(enabled ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animHeight, {
      toValue: enabled ? 1 : 0,
      useNativeDriver: false,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [enabled]);

  return (
    <View style={{ marginBottom: hp(0.5) }}>
      <View
        style={[
          collapsibleStyles.header,
          {
            backgroundColor: colors.card,
            borderColor: enabled ? accentColor : colors.border,
            borderLeftColor: enabled ? accentColor : colors.border,
          },
        ]}
      >
        <View style={collapsibleStyles.headerLeft}>
          <View
            style={[
              collapsibleStyles.dot,
              { backgroundColor: enabled ? accentColor : colors.border },
            ]}
          />
          <View>
            <CustomText
              style={[
                collapsibleStyles.title,
                { color: enabled ? colors.text : colors.icon },
              ]}
            >
              {title}
            </CustomText>
            {subtitle ? (
              <CustomText
                style={[collapsibleStyles.subtitle, { color: colors.icon }]}
              >
                {subtitle}
              </CustomText>
            ) : null}
          </View>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: `${accentColor}55` }}
          thumbColor={enabled ? accentColor : colors.icon}
          ios_backgroundColor={colors.border}
        />
      </View>

      <Animated.View
        style={{
          opacity: animHeight,
          overflow: "hidden",
          maxHeight: animHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 2000],
          }),
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const collapsibleStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: wp(4),
    marginTop: hp(2),
    marginBottom: hp(0),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.4),
    borderRadius: normalize(14),
    borderWidth: 1.5,
    borderLeftWidth: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2.5),
    flex: 1,
  },
  dot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
  },
  title: {
    fontSize: normalize(13),
    fontFamily: Fonts.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    marginTop: hp(0.2),
  },
});

// ─── Component ───────────────────────────────────────────────────────────────

const EditPaybookScreen = () => {
  const { colors } = useAppTheme();
  const { showNotification } = useNotification();
  const { wallets } = useWallet();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const { getLoanDetail, updateLoan, loading } = usePaybookDetail();

  const [dataLoaded, setDataLoaded] = useState(false);
  const [interestEnabled, setInterestEnabled] = useState(false);

  // Read-only fields (displayed but not editable)
  const [loanType, setLoanType] = useState<string>("LEND");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [loanNo, setLoanNo] = useState("");

  // Editable fields
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyType, setCounterpartyType] = useState("INDIVIDUAL");
  const [loanDescription, setLoanDescription] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [balance, setBalance] = useState<number>(0);
  const [interestRate, setInterestRate] = useState("");
  const [interestRateType, setInterestRateType] = useState<InterestRateType>("FIXED");
  const [interestCalcMethod, setInterestCalcMethod] = useState<InterestCalcMethod>("REDUCING");
  const [startDate, setStartDate] = useState(new Date());
  const [maturityDate, setMaturityDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<LoanStatus>("ACTIVE");
  const [paymentType, setPaymentType] = useState<PaymentType>("BULLET");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [note, setNote] = useState("");

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showMaturityPicker, setShowMaturityPicker] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const accentColor = colors.tint;

  // ── Fetch loan detail on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!loanId) return;
    const fetchDetail = async () => {
      const detail = await getLoanDetail(Number(loanId));
      if (!detail) {
        showNotification("Không tìm thấy khoản vay!", "error");
        router.back();
        return;
      }

      // Populate form
      setLoanType(detail.loan_type);
      setWalletId(detail.wallet_id);
      setLoanNo(detail.loan_no || "");
      setCounterpartyName(detail.counterparty_name || "");
      setCounterpartyType(detail.counterparty_type || "INDIVIDUAL");
      setLoanDescription(detail.description || "");
      setPrincipalAmount(detail.principal_amount > 0 ? formatNumRaw(detail.principal_amount) : "");
      setBalance(detail.balance || 0);
      setInterestRate(detail.interest_rate > 0 ? String(detail.interest_rate) : "");
      setInterestRateType(detail.interest_rate_type || "FIXED");
      setInterestCalcMethod(detail.interest_calc_method || "REDUCING");
      setStartDate(new Date(detail.start_date));
      setMaturityDate(detail.maturity_date ? new Date(detail.maturity_date) : null);
      setStatus(detail.status || "ACTIVE");
      setPaymentType(detail.payment_type || "BULLET");
      setTotalInstallments(detail.total_installments > 0 ? String(detail.total_installments) : "");
      setNote(detail.note || "");
      setInterestEnabled(detail.interest_rate > 0);
      setDataLoaded(true);
    };
    fetchDetail();
  }, [loanId]);

  // ── Auto-calculate maturity date for INSTALLMENT ────────────────────────
  useEffect(() => {
    if (!dataLoaded) return;
    if (paymentType === "INSTALLMENT") {
      const installments = parseInt(totalInstallments || "0", 10);
      if (installments > 0 && startDate) {
        const newMaturityDate = new Date(startDate);
        newMaturityDate.setMonth(newMaturityDate.getMonth() + installments);
        setMaturityDate(newMaturityDate);
      }
    }
  }, [startDate, paymentType, totalInstallments, dataLoaded]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const parseNumber = (val: string) => {
    const raw = val.replace(/\./g, "").replace(/,/g, "");
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  };

  const formatNum = useCallback((val: string) => {
    const raw = val.replace(/\D/g, "");
    if (!raw) return "";
    return new Intl.NumberFormat("vi-VN").format(parseInt(raw, 10));
  }, []);

  const formatNumRaw = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletId === walletId),
    [wallets, walletId]
  );

  // ── Effective values ───────────────────────────────────────────────────
  const effectiveInterestRate = interestEnabled ? parseFloat(interestRate) || 0 : 0;
  const effectiveInterestCalcMethod = interestEnabled ? interestCalcMethod : "REDUCING";

  // ── Validation ─────────────────────────────────────────────────────────
  const parsedPrincipal = parseNumber(principalAmount);

  const isValid =
    counterpartyName.trim().length > 0 &&
    parsedPrincipal > 0 &&
    !!maturityDate &&
    (paymentType === "BULLET" || (paymentType === "INSTALLMENT" && parseInt(totalInstallments || "0") > 0));

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleToggleInterest = (val: boolean) => {
    setInterestEnabled(val);
    if (!val) {
      setInterestRate("");
      setInterestRateType("FIXED");
      setInterestCalcMethod("REDUCING");
    }
  };

  const handleUpdate = async () => {
    if (!maturityDate || !loanId) return;
    if (effectiveInterestRate < 0) {
      return showNotification("Lãi suất không được là số âm!", "error");
    }
    if (maturityDate <= startDate) {
      return showNotification("Ngày đáo hạn phải sau ngày bắt đầu!", "error");
    }

    try {
      await updateLoan({
        id: Number(loanId),
        counterparty_name: counterpartyName.trim(),
        counterparty_type: counterpartyType,
        description: loanDescription.trim(),
        principal_amount: parsedPrincipal,
        balance: balance,
        interest_rate: effectiveInterestRate,
        interest_rate_type: interestEnabled ? interestRateType : "FIXED",
        interest_calc_method: effectiveInterestCalcMethod,
        start_date: startDate.toISOString(),
        maturity_date: maturityDate.toISOString(),
        status: status,
        payment_type: paymentType,
        total_installments: paymentType === "INSTALLMENT"
          ? parseInt(totalInstallments) || undefined
          : undefined,
        note: note.trim() || "",
      });
      showNotification("Cập nhật sổ nợ thành công!", "success");
      router.back();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Cập nhật sổ nợ thất bại!",
        "error"
      );
    }
  };

  // ── Section renderer ──────────────────────────────────────────────────
  const SectionHeader = ({ title }: { title: string }) => (
    <View style={[styles.sectionHeader, { borderLeftColor: accentColor }]}>
      <CustomText style={[styles.sectionHeaderText, { color: colors.text }]}>
        {title}
      </CustomText>
    </View>
  );

  // ── Loading state ──────────────────────────────────────────────────────
  if (!dataLoaded) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <AppHeader title="Chỉnh sửa sổ nợ" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={accentColor} />
          <CustomText style={[styles.loadingText, { color: colors.icon }]}>
            Đang tải dữ liệu...
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  const typeColor = loanType === "LEND" ? "#22C55E" : "#EF4444";
  const typeLabel = loanType === "LEND" ? "Cho vay" : "Đi vay";
  const typeIcon = loanType === "LEND" ? "arrow-trend-up" : "arrow-trend-down";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <AppHeader title="Chỉnh sửa sổ nợ" />

        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ══════════════════════════════════════════════════════════════
              1. THÔNG TIN CỐ ĐỊNH (Read-only)
          ══════════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <View style={[styles.readonlyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Loan type badge */}
              <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
                <FontAwesome6
                  name={typeIcon as any}
                  size={normalize(13)}
                  color={typeColor}
                  style={{ marginRight: wp(1.5) }}
                />
                <CustomText style={[styles.typeBadgeText, { color: typeColor }]}>
                  {typeLabel}
                </CustomText>
              </View>

              {/* Wallet */}
              <View style={styles.readonlyRow}>
                <FontAwesome6
                  name={(selectedWallet?.icon as any) || "wallet"}
                  size={normalize(14)}
                  color={selectedWallet?.color || colors.icon}
                  solid
                  style={{ marginRight: wp(2), width: normalize(20), textAlign: "center" }}
                />
                <CustomText style={[styles.readonlyLabel, { color: colors.icon }]}>Ví nguồn:</CustomText>
                <CustomText style={[styles.readonlyValue, { color: colors.text }]}>
                  {selectedWallet?.name || `ID: ${walletId}`}
                </CustomText>
              </View>

              {/* Loan No */}
              {loanNo ? (
                <View style={styles.readonlyRow}>
                  <FontAwesome6
                    name="hashtag"
                    size={normalize(14)}
                    color={colors.icon}
                    style={{ marginRight: wp(2), width: normalize(20), textAlign: "center" }}
                  />
                  <CustomText style={[styles.readonlyLabel, { color: colors.icon }]}>Mã sổ:</CustomText>
                  <CustomText style={[styles.readonlyValue, { color: colors.text }]}>
                    {loanNo}
                  </CustomText>
                </View>
              ) : null}
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════
              3. THÔNG TIN ĐỐI TÁC
          ══════════════════════════════════════════════════════════════ */}
          <SectionHeader title="Thông tin đối tác" />
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Tên đối tác <CustomText style={{ color: "#EF4444" }}>*</CustomText>
            </CustomText>
            <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FontAwesome6 name="user" size={normalize(16)} color={counterpartyName.trim() ? accentColor : colors.icon} solid style={styles.fieldIcon} />
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                placeholder="Tên người/đơn vị giao dịch..."
                placeholderTextColor={colors.icon}
                value={counterpartyName}
                onChangeText={setCounterpartyName}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════
              4. THÔNG TIN KHOẢN VAY
          ══════════════════════════════════════════════════════════════ */}
          <SectionHeader title="Thông tin khoản vay" />

          {/* Mô tả */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>Mô tả khoản vay</CustomText>
            <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FontAwesome6 name="file-lines" size={normalize(16)} color={loanDescription.trim() ? accentColor : colors.icon} solid style={styles.fieldIcon} />
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                placeholder="Mô tả ngắn gọn mục đích..."
                placeholderTextColor={colors.icon}
                value={loanDescription}
                onChangeText={setLoanDescription}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Số tiền vay */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Số tiền gốc <CustomText style={{ color: "#EF4444" }}>*</CustomText>
            </CustomText>
            <View style={[styles.amountWrapper, { backgroundColor: colors.card, borderColor: parsedPrincipal > 0 ? accentColor : colors.border }]}>
              <TextInput
                style={[styles.amountInputSm, { color: parsedPrincipal > 0 ? accentColor : colors.text, fontFamily: parsedPrincipal > 0 ? Fonts.semiBold : Fonts.regular }]}
                placeholder="0"
                placeholderTextColor={colors.icon}
                value={principalAmount}
                onChangeText={(t) => setPrincipalAmount(formatNum(t))}
                keyboardType="numeric"
              />
              <CustomText style={[styles.currencyTag, { color: accentColor }]}>đ</CustomText>
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════
              5. HÌNH THỨC THANH TOÁN
          ══════════════════════════════════════════════════════════════ */}
          <SectionHeader title="Hình thức thanh toán" />
          <View style={styles.section}>
            <View style={styles.chipRow}>
              {PAYMENT_TYPES.map((pt) => {
                const isActive = paymentType === pt.key;
                return (
                  <TouchableOpacity
                    key={pt.key}
                    style={[
                      styles.paymentChip,
                      { flex: 1, backgroundColor: isActive ? `${accentColor}18` : colors.card, borderColor: isActive ? accentColor : colors.border },
                    ]}
                    onPress={() => setPaymentType(pt.key)}
                    activeOpacity={0.7}
                  >
                    <FontAwesome6
                      name={pt.icon as any}
                      size={normalize(16)}
                      color={isActive ? accentColor : colors.icon}
                      solid
                    />
                    <CustomText style={[styles.chipText, { color: isActive ? accentColor : colors.text, fontFamily: isActive ? Fonts.semiBold : Fonts.regular, marginTop: hp(0.5) }]}>
                      {pt.label}
                    </CustomText>
                    <CustomText style={[styles.chipDesc, { color: colors.icon }]}>{pt.desc}</CustomText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Số kỳ trả (chỉ hiện khi INSTALLMENT) */}
          {paymentType === "INSTALLMENT" && (
            <View style={styles.section}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                Số kỳ trả <CustomText style={{ color: "#EF4444" }}>*</CustomText>
              </CustomText>
              <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <FontAwesome6 name="list-ol" size={normalize(15)} color={totalInstallments ? accentColor : colors.icon} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  placeholder="Ví dụ: 12"
                  placeholderTextColor={colors.icon}
                  value={totalInstallments}
                  onChangeText={setTotalInstallments}
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
                <CustomText style={[styles.unitTag, { color: colors.icon }]}>kỳ</CustomText>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════
              6. LÃI SUẤT — Toggle section
          ══════════════════════════════════════════════════════════════ */}
          <CollapsibleSection
            title="Lãi suất"
            subtitle={interestEnabled ? "Tuỳ chỉnh lãi suất & phương thức" : "Mặc định: không lãi suất (0%)"}
            enabled={interestEnabled}
            onToggle={handleToggleInterest}
            accentColor={accentColor}
            colors={colors}
          >
            {/* Lãi suất % */}
            <View style={styles.section}>
              <CustomText style={[styles.label, { color: colors.text }]}>Lãi suất (%/năm)</CustomText>
              <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <FontAwesome6 name="percent" size={normalize(14)} color={effectiveInterestRate > 0 ? accentColor : colors.icon} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  value={interestRate}
                  onChangeText={setInterestRate}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
                <CustomText style={[styles.unitTag, { color: colors.icon }]}>%/năm</CustomText>
              </View>
            </View>

            {/* Phương pháp tính lãi */}
            <View style={styles.section}>
              <CustomText style={[styles.label, { color: colors.text }]}>Phương pháp tính lãi</CustomText>
              {INTEREST_CALC_METHODS.map((cm) => {
                const isActive = interestCalcMethod === cm.key;
                return (
                  <TouchableOpacity
                    key={cm.key}
                    style={[
                      styles.optionRow,
                      { backgroundColor: colors.card, borderColor: isActive ? accentColor : colors.border },
                    ]}
                    onPress={() => setInterestCalcMethod(cm.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioCircle, { borderColor: isActive ? accentColor : colors.border }]}>
                      {isActive && <View style={[styles.radioFill, { backgroundColor: accentColor }]} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <CustomText style={[styles.optionLabel, { color: colors.text }]}>{cm.label}</CustomText>
                      <CustomText style={[styles.optionDesc, { color: colors.icon }]}>{cm.desc}</CustomText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CollapsibleSection>

          {/* ══════════════════════════════════════════════════════════════
              7. THỜI HẠN
          ══════════════════════════════════════════════════════════════ */}
          <SectionHeader title="Thời hạn" />
          <View style={[styles.section, { flexDirection: "row", gap: wp(3) }]}>
            <View style={{ flex: 1 }}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                Ngày bắt đầu <CustomText style={{ color: "#EF4444" }}>*</CustomText>
              </CustomText>
              <TouchableOpacity
                style={[styles.dateField, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.7}
              >
                <FontAwesome6 name="calendar" size={normalize(13)} color={accentColor} solid style={{ marginRight: wp(2) }} />
                <CustomText style={[styles.dateText, { color: colors.text }]}>{formatDate(startDate)}</CustomText>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                Đáo hạn <CustomText style={{ color: "#EF4444" }}>*</CustomText>
              </CustomText>
              <TouchableOpacity
                style={[
                  styles.dateField,
                  {
                    backgroundColor: paymentType === "INSTALLMENT" ? `${colors.border}40` : colors.card,
                    borderColor: maturityDate ? accentColor : colors.border
                  }
                ]}
                onPress={() => setShowMaturityPicker(true)}
                activeOpacity={0.7}
                disabled={paymentType === "INSTALLMENT"}
              >
                <FontAwesome6
                  name="calendar-days"
                  size={normalize(13)}
                  color={maturityDate ? accentColor : colors.icon}
                  solid
                  style={{ marginRight: wp(2), opacity: paymentType === "INSTALLMENT" ? 0.5 : 1 }}
                />
                <CustomText style={[styles.dateText, { color: maturityDate ? colors.text : colors.icon, opacity: paymentType === "INSTALLMENT" ? 0.5 : 1 }]}>
                  {maturityDate ? formatDate(maturityDate) : "Chọn ngày"}
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════
              8. GHI CHÚ
          ══════════════════════════════════════════════════════════════ */}
          <SectionHeader title="Ghi chú" />
          <View style={styles.section}>
            <TextInput
              style={[styles.noteInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Thêm ghi chú (tùy chọn)"
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={3}
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: hp(14) }} />
        </ScrollView>

        {/* ── Date Pickers ──────────────────────────────────────────────── */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, d) => {
              if (Platform.OS === "android") setShowStartPicker(false);
              if (d) setStartDate(d);
            }}
          />
        )}
        {showMaturityPicker && (
          <DateTimePicker
            value={maturityDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, d) => {
              if (Platform.OS === "android") setShowMaturityPicker(false);
              if (d) setMaturityDate(d);
            }}
            minimumDate={startDate}
          />
        )}
        {Platform.OS === "ios" && (showStartPicker || showMaturityPicker) && (
          <View style={[styles.pickerToolbar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setShowStartPicker(false); setShowMaturityPicker(false); }} style={styles.pickerButton}>
              <CustomText style={[styles.pickerButtonText, { color: colors.tint }]}>Xong</CustomText>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Bottom Bar ───────────────────────────────────────────────── */}
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.tint }]}
            onPress={() => router.back()}
            disabled={loading}
            activeOpacity={0.7}
          >
            <CustomText style={[styles.cancelText, { color: colors.tint }]}>Huỷ</CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.createBtn,
              { backgroundColor: isValid && !loading ? accentColor : colors.border, shadowColor: isValid && !loading ? accentColor : "transparent" },
            ]}
            onPress={handleUpdate}
            disabled={!isValid || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <FontAwesome6 name="floppy-disk" size={normalize(15)} color="#fff" style={{ marginRight: wp(1.5) }} solid />
                <CustomText style={styles.createText}>Lưu thay đổi</CustomText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: any) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background },

    // Loading
    loadingText: { fontSize: normalize(14), fontFamily: Fonts.medium, marginTop: hp(2) },

    // Section header
    sectionHeader: {
      marginHorizontal: wp(4),
      marginTop: hp(2.5),
      marginBottom: hp(0.5),
      paddingLeft: wp(2.5),
      borderLeftWidth: 3,
    },
    sectionHeaderText: { fontSize: normalize(13), fontFamily: Fonts.semiBold, textTransform: "uppercase", letterSpacing: 0.5 },

    section: { paddingHorizontal: wp(4), paddingTop: hp(1.5) },

    // Readonly card
    readonlyCard: {
      borderWidth: 1,
      borderRadius: normalize(14),
      padding: normalize(14),
      gap: hp(1.2),
    },
    readonlyRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    readonlyLabel: {
      fontSize: normalize(13),
      fontFamily: Fonts.regular,
      marginRight: wp(1.5),
    },
    readonlyValue: {
      fontSize: normalize(13),
      fontFamily: Fonts.semiBold,
      flex: 1,
    },

    // Type badge
    typeBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.6),
      borderRadius: normalize(20),
    },
    typeBadgeText: {
      fontSize: normalize(12),
      fontFamily: Fonts.semiBold,
    },

    // Status dot
    statusDot: {
      width: normalize(8),
      height: normalize(8),
      borderRadius: normalize(4),
      marginRight: wp(1.5),
    },

    // Label
    label: { fontSize: normalize(13), fontFamily: Fonts.medium, marginBottom: hp(0.8) },

    // Fields
    field: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: normalize(14), paddingHorizontal: wp(4), paddingVertical: hp(1.6) },
    fieldLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
    fieldIcon: { marginRight: wp(2.5), width: normalize(20), textAlign: "center" },
    fieldText: { fontSize: normalize(14), fontFamily: Fonts.regular },
    fieldInput: { flex: 1, fontSize: normalize(14), fontFamily: Fonts.regular, padding: 0, margin: 0 },
    unitTag: { fontSize: normalize(13), fontFamily: Fonts.medium, marginLeft: wp(1) },

    // Chip selectors
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: wp(2) },
    chip: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: hp(1.2), paddingHorizontal: wp(3), borderRadius: normalize(12), borderWidth: 1 },
    chipText: { fontSize: normalize(13) },
    chipDesc: { fontSize: normalize(11), fontFamily: Fonts.regular, textAlign: "center" },

    // Payment type chips
    paymentChip: { alignItems: "center", justifyContent: "center", paddingVertical: hp(1.5), paddingHorizontal: wp(2), borderRadius: normalize(14), borderWidth: 1, gap: hp(0.3) },

    // Option rows (radio)
    optionRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: normalize(14), paddingHorizontal: wp(4), paddingVertical: hp(1.4), marginBottom: hp(1), gap: wp(3) },
    radioCircle: { width: normalize(20), height: normalize(20), borderRadius: normalize(10), borderWidth: 2, alignItems: "center", justifyContent: "center" },
    radioFill: { width: normalize(10), height: normalize(10), borderRadius: normalize(5) },
    optionLabel: { fontSize: normalize(14), fontFamily: Fonts.semiBold, marginBottom: hp(0.2) },
    optionDesc: { fontSize: normalize(12), fontFamily: Fonts.regular },

    // Amount wrapper
    amountWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: normalize(14), paddingHorizontal: wp(3), paddingVertical: hp(1.4) },
    amountInputSm: { flex: 1, fontSize: normalize(16), padding: 0, margin: 0 },
    currencyTag: { fontSize: normalize(15), fontFamily: Fonts.bold, marginLeft: wp(1) },

    // Date field
    dateField: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: normalize(14), paddingHorizontal: wp(3), paddingVertical: hp(1.4) },
    dateText: { fontSize: normalize(13), fontFamily: Fonts.medium },

    // Note
    noteInput: { borderWidth: 1, borderRadius: normalize(14), padding: normalize(12), fontSize: normalize(14), fontFamily: Fonts.regular, minHeight: hp(10) },

    // iOS date picker toolbar
    pickerToolbar: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: wp(4), paddingVertical: hp(1), borderTopWidth: 1 },
    pickerButton: { padding: normalize(8) },
    pickerButtonText: { fontSize: normalize(16), fontFamily: Fonts.semiBold },

    // Bottom bar
    bottomBar: { flexDirection: "row", paddingHorizontal: wp(4), paddingVertical: hp(2), paddingBottom: hp(3), borderTopWidth: 1, gap: wp(3) },
    cancelBtn: { flex: 1, paddingVertical: hp(1.8), borderRadius: normalize(14), borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
    cancelText: { fontSize: normalize(15), fontFamily: Fonts.semiBold },
    createBtn: { flex: 2, flexDirection: "row", paddingVertical: hp(1.8), borderRadius: normalize(14), alignItems: "center", justifyContent: "center", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    createText: { fontSize: normalize(15), color: "#fff", fontFamily: Fonts.semiBold },
  });

export default EditPaybookScreen;
