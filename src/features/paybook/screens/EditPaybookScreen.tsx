import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import STORAGE_KEY from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { usePaybookDetail } from "@/features/paybook/hooks/usePaybook";
import type { LoanStatus } from "@/features/paybook/types";
import TransactionAmountInput from "@/features/transaction/components/TransactionAmountInput";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import type {
  InterestCalcMethod,
  InterestRateType,
  PaymentType,
} from "@/services/repositories/paybook.repository";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createStyles, collapsibleStyles } from "../styles/EditPaybookScreen.styles";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

interface SelectedCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

// Option configs
// CollapsibleSection
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


// Component
const EditPaybookScreen = () => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { showNotification } = useNotification();
  const { wallets } = useWallet();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const { getLoanDetail, updateLoan, loading } = usePaybookDetail();
  const { defaultCurrency } = useDefaultCurrency();
  const hasManuallySelectedCurrencyRef = useRef(false);

  // Localized option configs
  const INTEREST_CALC_METHODS: { key: InterestCalcMethod; label: string; desc: string }[] = useMemo(() => [
    { key: "REDUCING", label: t("paybook.reducing"), desc: t("paybook.reducing_desc") },
    { key: "FLAT", label: t("paybook.flat"), desc: t("paybook.flat_desc") },
  ], [t]);

  const PAYMENT_TYPES: { key: PaymentType; label: string; icon: string; desc: string }[] = useMemo(() => [
    { key: "BULLET", label: t("paybook.bullet"), icon: "circle-check", desc: t("paybook.bullet_desc") },
    { key: "INSTALLMENT", label: t("paybook.installment_payment"), icon: "calendar-days", desc: t("paybook.installment_desc") },
  ], [t]);

  const STATUS_OPTIONS: { key: LoanStatus; label: string; color: string }[] = useMemo(() => [
    { key: "ACTIVE", label: t("paybook.status_active"), color: "#22C55E" },
    { key: "COMPLETED", label: t("paybook.status_completed"), color: "#6366F1" },
    { key: "OVERDUE", label: t("paybook.status_overdue"), color: "#EF4444" },
    { key: "CANCELLED", label: t("paybook.status_cancelled"), color: "#9CA3AF" },
  ], [t]);

  const LOAN_TYPE_LABELS = useMemo(() => ({
    LEND: t("paybook.lend"),
    BORROW: t("paybook.borrow"),
  }), [t]);

  const [dataLoaded, setDataLoaded] = useState(false);
  const [interestEnabled, setInterestEnabled] = useState(false);

  // Currency state
  const [inputCurrency, setInputCurrency] = useState<SelectedCurrency>({
    currencyId: defaultCurrency.currencyId,
    symbol: defaultCurrency.symbol,
    name: defaultCurrency.name,
  });

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

  // Fetch loan detail on mount
  useEffect(() => {
    if (!loanId) return;
    const fetchDetail = async () => {
      const detail = await getLoanDetail(Number(loanId));
      if (!detail) {
        showNotification(t("paybook.not_found"), "error");
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

  // Auto-calculate maturity date for INSTALLMENT
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

  // Load selected currency từ select-currency screen
  useFocusEffect(
    useCallback(() => {
      const loadCurrency = async () => {
        try {
          const stored = await StorageService.getItem(STORAGE_KEY.TEMP_CURRENCY_STORAGE);
          if (!stored) return;
          const currency: SelectedCurrency = JSON.parse(stored);
          setInputCurrency(currency);
          hasManuallySelectedCurrencyRef.current = true;
          await StorageService.removeItem(STORAGE_KEY.TEMP_CURRENCY_STORAGE);
        } catch (err) {
          console.error("[EditPaybook] Load currency failed:", err);
        }
      };
      loadCurrency();
    }, [])
  );

  // Helpers
  const parseNumber = (val: string) => {
    const raw = val.replace(/\./g, "").replace(/,/g, "");
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  };

  const formatNum = useCallback((val: string) => {
    const raw = val.replace(/\D/g, "");
    if (!raw) return "";
    return new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(parseInt(raw, 10));
  }, [i18n.language]);

  const formatNumRaw = (num: number) => {
    return new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(num);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" });

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletId === walletId),
    [wallets, walletId]
  );

  // Effective values
  const effectiveInterestRate = interestEnabled ? parseFloat(interestRate) || 0 : 0;
  const effectiveInterestCalcMethod = interestEnabled ? interestCalcMethod : "REDUCING";

  // Validation
  const parsedPrincipal = parseNumber(principalAmount);

  const isValid =
    counterpartyName.trim().length > 0 &&
    parsedPrincipal > 0 &&
    !!maturityDate &&
    (paymentType === "BULLET" || (paymentType === "INSTALLMENT" && parseInt(totalInstallments || "0") > 0));

  // Handlers
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
      return showNotification(t("paybook.error_negative_rate"), "error");
    }
    if (maturityDate <= startDate) {
      return showNotification(t("paybook.error_maturity_date"), "error");
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
      showNotification(t("invoice.success_update"), "success");
      router.back();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : t("invoice.error_update"),
        "error"
      );
    }
  };

  // Section renderer
  const SectionHeader = ({ title }: { title: string }) => (
    <View style={[styles.sectionHeader, { borderLeftColor: accentColor }]}>
      <CustomText style={[styles.sectionHeaderText, { color: colors.text }]}>
        {title}
      </CustomText>
    </View>
  );

  // Loading state
  if (!dataLoaded) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <AppHeader title={t("paybook.edit")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={accentColor} />
          <CustomText style={[styles.loadingText, { color: colors.icon }]}>
            {t("common.loading")}
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  // Render
  const typeColor = loanType === "LEND" ? "#22C55E" : "#EF4444";
  const typeLabel = loanType === "LEND" ? LOAN_TYPE_LABELS.LEND : LOAN_TYPE_LABELS.BORROW;
  const typeIcon = loanType === "LEND" ? "arrow-trend-up" : "arrow-trend-down";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <AppHeader title={t("paybook.edit")} />

        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. THÔNG TIN CỐ ĐỊNH (Read-only) */}
          <View style={styles.section}>
            <View style={[styles.readonlyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Loan type badge */}
              <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
                <AppIcon
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
                <AppIcon
                  name={(selectedWallet?.icon as any) || "wallet"}
                  size={normalize(14)}
                  color={selectedWallet?.color || colors.icon}
                  style={{ marginRight: wp(2), width: normalize(20), textAlign: "center" }}
                />
                <CustomText style={[styles.readonlyLabel, { color: colors.icon }]}>{t("paybook.source_wallet")}</CustomText>
                <CustomText style={[styles.readonlyValue, { color: colors.text }]}>
                  {selectedWallet?.name || `ID: ${walletId}`}
                </CustomText>
              </View>

              {/* Loan No */}
              {loanNo ? (
                <View style={styles.readonlyRow}>
                  <AppIcon
                    name="hashtag"
                    size={normalize(14)}
                    color={colors.icon}
                    style={{ marginRight: wp(2), width: normalize(20), textAlign: "center" }}
                  />
                  <CustomText style={[styles.readonlyLabel, { color: colors.icon }]}>{t("paybook.loan_no_label")}</CustomText>
                  <CustomText style={[styles.readonlyValue, { color: colors.text }]}>
                    {loanNo}
                  </CustomText>
                </View>
              ) : null}
            </View>
          </View>

          {/* 3. THÔNG TIN ĐỐI TÁC */}
          <SectionHeader title={t("paybook.partner_info")} />
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {loanType === "LEND" ? t("paybook.debtor") : t("paybook.creditor")} <CustomText style={{ color: "#EF4444" }}>*</CustomText>
            </CustomText>
            <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <AppIcon name="user" size={normalize(16)} color={counterpartyName.trim() ? accentColor : colors.icon} style={styles.fieldIcon} />
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                placeholder={
                  loanType === "LEND"
                    ? t("paybook.lend_placeholder")
                    : t("paybook.borrow_placeholder")
                }
                placeholderTextColor={colors.icon}
                value={counterpartyName}
                onChangeText={setCounterpartyName}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* 4. THÔNG TIN KHOẢN VAY */}
          <SectionHeader title={t("paybook.loan_info")} />

          {/* Mô tả */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>{t("paybook.loan_description")}</CustomText>
            <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <AppIcon name="file-lines" size={normalize(16)} color={loanDescription.trim() ? accentColor : colors.icon} style={styles.fieldIcon} />
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                placeholder={t("paybook.desc_placeholder")}
                placeholderTextColor={colors.icon}
                value={loanDescription}
                onChangeText={setLoanDescription}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Số tiền gốc — dùng TransactionAmountInput để có thể đổi currency */}
          <TransactionAmountInput
            amount={principalAmount}
            onAmountChange={(val) => setPrincipalAmount(val)}
            inputCurrency={inputCurrency}
            walletCurrency={inputCurrency}
            onCurrencyPress={() => {
              hasManuallySelectedCurrencyRef.current = true;
              router.push("/(protected)/select-currency");
            }}
            label={t("paybook.principal_amount_label")}
          />

          {/* 5. HÌNH THỨC THANH TOÁN (Disabled in Edit) */}
          <SectionHeader title={t("paybook.payment_type")} />
          <View style={styles.section}>
            <View style={styles.chipRow}>
              {PAYMENT_TYPES.map((pt) => {
                const isActive = paymentType === pt.key;
                return (
                  <View
                    key={pt.key}
                    style={[
                      styles.paymentChip,
                      { 
                        flex: 1, 
                        backgroundColor: isActive ? `${accentColor}10` : colors.card, 
                        borderColor: isActive ? `${accentColor}50` : colors.border,
                        opacity: isActive ? 1 : 0.5
                      },
                    ]}
                  >
                    <AppIcon
                      name={pt.icon as any}
                      size={normalize(16)}
                      color={isActive ? accentColor : colors.icon}
                    />
                    <CustomText style={[styles.chipText, { color: isActive ? accentColor : colors.text, fontFamily: isActive ? Fonts.semiBold : Fonts.regular, marginTop: hp(0.5) }]}>
                      {pt.label}
                    </CustomText>
                    <CustomText style={[styles.chipDesc, { color: colors.icon }]}>{pt.desc}</CustomText>
                  </View>
                );
              })}
            </View>
          </View>
          {paymentType === "INSTALLMENT" && (
            <View style={styles.section}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                {t("paybook.installments_count")} <CustomText style={{ color: "#EF4444" }}>*</CustomText>
              </CustomText>
              <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <AppIcon name="list-ol" size={normalize(15)} color={totalInstallments ? accentColor : colors.icon} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  placeholder={t("paybook.installments_placeholder")}
                  placeholderTextColor={colors.icon}
                  value={totalInstallments}
                  onChangeText={setTotalInstallments}
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
                <CustomText style={[styles.unitTag, { color: colors.icon }]}>{t("paybook.installments")}</CustomText>
              </View>
            </View>
          )}

          {/* 6. LÃI SUẤT — Toggle section */}
          <CollapsibleSection
            title={t("paybook.interest_rate")}
            subtitle={interestEnabled ? t("paybook.custom_interest_hint") : t("paybook.default_interest_hint")}
            enabled={interestEnabled}
            onToggle={handleToggleInterest}
            accentColor={accentColor}
            colors={colors}
          >
            {/* Lãi suất % */}
            <View style={styles.section}>
              <CustomText style={[styles.label, { color: colors.text }]}>{t("paybook.interest_rate_annual")}</CustomText>
              <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <AppIcon name="percent" size={normalize(14)} color={effectiveInterestRate > 0 ? accentColor : colors.icon} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  value={interestRate}
                  onChangeText={setInterestRate}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
                <CustomText style={[styles.unitTag, { color: colors.icon }]}>%/ {t("paybook.year")}</CustomText>
              </View>
            </View>

            {/* Phương pháp tính lãi */}
            <View style={styles.section}>
              <CustomText style={[styles.label, { color: colors.text }]}>{t("paybook.interest_calc_method")}</CustomText>
              {INTEREST_CALC_METHODS.map((cm) => {
                const isActive = interestCalcMethod === cm.key;
                return (
                  <View
                    key={cm.key}
                    style={[
                      styles.optionRow,
                      { 
                        backgroundColor: colors.card, 
                        borderColor: isActive ? `${accentColor}40` : colors.border,
                        opacity: isActive ? 1 : 0.5
                      },
                    ]}
                  >
                    <View style={[styles.radioCircle, { borderColor: isActive ? accentColor : colors.border }]}>
                      {isActive && <View style={[styles.radioFill, { backgroundColor: accentColor }]} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <CustomText style={[styles.optionLabel, { color: colors.text }]}>{cm.label}</CustomText>
                      <CustomText style={[styles.optionDesc, { color: colors.icon }]}>{cm.desc}</CustomText>
                    </View>
                  </View>
                );
              })}
            </View>
          </CollapsibleSection>

          {/* 7. THỜI HẠN */}
          <SectionHeader title={t("paybook.term")} />
          <View style={[styles.section, { flexDirection: "row", gap: wp(3) }]}>
            <View style={{ flex: 1 }}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                {t("paybook.start_date")} <CustomText style={{ color: "#EF4444" }}>*</CustomText>
              </CustomText>
              <TouchableOpacity
                style={[styles.dateField, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.7}
              >
                <AppIcon name="calendar" size={normalize(13)} color={accentColor} style={{ marginRight: wp(2) }} />
                <CustomText style={[styles.dateText, { color: colors.text }]}>{formatDate(startDate)}</CustomText>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                {t("paybook.maturity_date")} <CustomText style={{ color: "#EF4444" }}>*</CustomText>
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
                <AppIcon
                  name="calendar-days"
                  size={normalize(13)}
                  color={maturityDate ? accentColor : colors.icon}
                  style={{ marginRight: wp(2), opacity: paymentType === "INSTALLMENT" ? 0.5 : 1 }}
                />
                <CustomText style={[styles.dateText, { color: maturityDate ? colors.text : colors.icon, opacity: paymentType === "INSTALLMENT" ? 0.5 : 1 }]}>
                  {maturityDate ? formatDate(maturityDate) : t("paybook.select_date")}
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>

          {/* 8. GHI CHÚ */}
          <SectionHeader title={t("paybook.note")} />
          <View style={styles.section}>
            <TextInput
              style={[styles.noteInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder={t("paybook.note_placeholder")}
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

        {/* Date Pickers */}
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
              <CustomText style={[styles.pickerButtonText, { color: colors.tint }]}>{t("common.confirm")}</CustomText>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.tint }]}
            onPress={() => router.back()}
            disabled={loading}
            activeOpacity={0.7}
          >
            <CustomText style={[styles.cancelText, { color: colors.tint }]}>{t("common.cancel")}</CustomText>
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
                <AppIcon name="floppy-disk" size={normalize(15)} color="#fff" style={{ marginRight: wp(1.5) }} />
                <CustomText style={styles.createText}>{t("common.save")}</CustomText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditPaybookScreen;
