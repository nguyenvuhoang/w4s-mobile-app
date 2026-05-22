import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import STORAGE_KEY from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { FloatingSchedulePreview } from "@/features/paybook/components/FloatingSchedulePreview";
import { usePaybookDetail } from "@/features/paybook/hooks/usePaybook";
import TransactionAmountInput from "@/features/transaction/components/TransactionAmountInput";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useCurrencyPicker } from "@/hooks/useCurrencyPicker";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import {
  type CounterpartyType,
  type FloatingRatePeriod,
  type InterestCalcMethod,
  type InterestRateType,
  type LoanScheduleItem,
  type LoanType,
  type PaymentType,
  type PeriodUnit,
} from "@/services/repositories/paybook.repository";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
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
import { createStyles, collapsibleStyles } from "../styles/CreatePaybookScreen.styles";
import { SafeAreaView } from "react-native-safe-area-context";

interface SelectedCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

// Local types
interface SelectedContact {
  id: string;
  name: string;
  phoneNumber?: string;
  avatarColor?: string;
  display_name?: string;
  phone?: string;
  isFromServer?: boolean;
}

// Option configs
const AVATAR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"];

// Default values khi toggle off
const DEFAULT_INTEREST_RATE = "0";
const DEFAULT_INTEREST_RATE_TYPE: InterestRateType = "FIXED";
const DEFAULT_INTEREST_CALC_METHOD: InterestCalcMethod = "REDUCING";
const DEFAULT_PAYMENT_TYPE: PaymentType = "BULLET";
// Schedule generation helpers
const PERIOD_MONTHS_MAP: Record<PeriodUnit, number> = {
  DAY: 1 / 30,
  WEEK: 7 / 30,
  MONTH: 1,
  QUARTER: 3,
  YEAR: 12,
};

function addPeriod(date: Date, unit: PeriodUnit, count = 1): Date {
  const d = new Date(date);
  switch (unit) {
    case "DAY": d.setDate(d.getDate() + count); break;
    case "WEEK": d.setDate(d.getDate() + count * 7); break;
    case "MONTH": d.setMonth(d.getMonth() + count); break;
    case "QUARTER": d.setMonth(d.getMonth() + count * 3); break;
    case "YEAR": d.setFullYear(d.getFullYear() + count); break;
  }
  return d;
}

function generateSchedules(
  principal: number,
  totalInstallments: number,
  startDate: Date,
  periodUnit: PeriodUnit,
  interestEnabled: boolean,
  interestRate: number,
  interestRateType: InterestRateType,
  calcMethod: InterestCalcMethod,
  floatingRates: FloatingRatePeriod[],
): LoanScheduleItem[] {
  const monthsPerPeriod = PERIOD_MONTHS_MAP[periodUnit];
  const principalDue = Math.round(principal / totalInstallments);
  const rows: LoanScheduleItem[] = [];
  let balance = principal;

  for (let i = 1; i <= totalInstallments; i++) {
    const fromDate = addPeriod(startDate, periodUnit, i - 1);
    const toDate = addPeriod(startDate, periodUnit, i);

    let interestDue: number | undefined;
    if (interestEnabled) {
      const annualRate =
        interestRateType === "FLOATING"
          ? (() => {
            let r = floatingRates[0]?.rate ?? 0;
            for (const fr of floatingRates) {
              if (i >= fr.from_installment) r = fr.rate;
              else break;
            }
            return r;
          })()
          : interestRate;
      const periodicRate = (annualRate / 100 / 12) * monthsPerPeriod;
      const base = calcMethod === "FLAT" ? principal : balance;
      interestDue = Math.round(base * periodicRate);
    }

    const currentPrincipalDue = i === totalInstallments ? balance : principalDue;

    rows.push({
      installment_no: i,
      from_date: fromDate.toISOString(),
      to_date: toDate.toISOString(),
      due_date: toDate.toISOString(),
      principal_due_amount: currentPrincipalDue,
      ...(interestDue !== undefined ? { interest_due_amount: interestDue } : {}),
    });
    balance = Math.max(balance - currentPrincipalDue, 0);
  }
  return rows;
}


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
      {/* Toggle header */}
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

      {/* Collapsible content */}
      <Animated.View
        style={{
          opacity: animHeight,
          overflow: "hidden",
          maxHeight: animHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 5000],
          }),
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
};


const CreatePaybookScreen = () => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { showNotification } = useNotification();
  const { wallets, defaultWallet, refresh } = useWallet();
  const { defaultCurrency } = useDefaultCurrency();
  const sessionIdRef = useRef<string>(Date.now().toString());


  // Localized option configs
  const LOAN_TYPE_TABS: { key: LoanType; label: string; icon: string; color: string }[] = useMemo(() => [
    { key: "LEND", label: t("paybook.lend"), icon: "arrow-trend-up", color: "#22C55E" },
    { key: "BORROW", label: t("paybook.borrow"), icon: "arrow-trend-down", color: "#EF4444" },
  ], [t]);

  const INTEREST_RATE_TYPES: { key: InterestRateType; label: string; icon: string; desc: string }[] = useMemo(() => [
    { key: "FIXED", label: t("paybook.fixed"), icon: "lock", desc: t("paybook.fixed_desc") },
    { key: "FLOATING", label: t("paybook.floating"), icon: "wave-square", desc: t("paybook.floating_desc") },
  ], [t]);

  const PERIOD_UNITS: { key: PeriodUnit; label: string }[] = useMemo(() => [
    { key: "DAY", label: t("paybook.day") },
    { key: "WEEK", label: t("paybook.week") },
    { key: "MONTH", label: t("paybook.month") },
    { key: "QUARTER", label: t("paybook.quarter") },
    { key: "YEAR", label: t("paybook.year_unit") },
  ], [t]);

  const INTEREST_CALC_METHODS: { key: InterestCalcMethod; label: string; desc: string }[] = useMemo(() => [
    { key: "REDUCING", label: t("paybook.reducing"), desc: t("paybook.reducing_desc") },
    { key: "FLAT", label: t("paybook.flat"), desc: t("paybook.flat_desc") },
  ], [t]);

  const PAYMENT_TYPES: { key: PaymentType; label: string; icon: string; desc: string }[] = useMemo(() => [
    { key: "BULLET", label: t("paybook.bullet"), icon: "circle-check", desc: t("paybook.bullet_desc") },
    { key: "INSTALLMENT", label: t("paybook.installment_payment"), icon: "calendar-days", desc: t("paybook.installment_desc") },
  ], [t]);

  const [interestEnabled, setInterestEnabled] = useState(false);
  
  // Helpers
  const parseNumber = useCallback((val: string) => {
    const raw = val.replace(/\./g, "").replace(/,/g, "");
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  }, []);

  const formatNum = useCallback(
    (val: string) => {
      const raw = val.replace(/\D/g, "");
      if (!raw) return "";
      return new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(
        parseInt(raw, 10)
      );
    },
    [i18n.language]
  );

  const formatDate = (d: Date) =>
    d.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const getInitials = (n: string) => {
    const words = n.trim().split(" ");
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const [loanType, setLoanType] = useState<LoanType>("LEND");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyType, setCounterpartyType] = useState<CounterpartyType>("INDIVIDUAL");
  const [selectedContact, setSelectedContact] = useState<SelectedContact | null>(null);
  const [loanDescription, setLoanDescription] = useState("");
  const [loanLimit, setLoanLimit] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [interestRateType, setInterestRateType] = useState<InterestRateType>("FIXED");
  const [interestCalcMethod, setInterestCalcMethod] = useState<InterestCalcMethod>("REDUCING");
  // Lãi thả nổi
  const [floatingRates, setFloatingRates] = useState<FloatingRatePeriod[]>([{ from_installment: 1, rate: 0 }]);
  const [showAddFloating, setShowAddFloating] = useState(false);
  const [newFloatingFrom, setNewFloatingFrom] = useState("");
  const [newFloatingRate, setNewFloatingRate] = useState("");
  // Khoảng thời gian mỗi kỳ (mặc định 1 Tháng)
  const [periodValue, setPeriodValue] = useState("1");
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>("MONTH");
  const [startDate, setStartDate] = useState(new Date());
  const [maturityDate, setMaturityDate] = useState<Date | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("BULLET");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [note, setNote] = useState("");
  const { createLoan, loading } = usePaybookDetail();

  // Currency picker (shared hook)
  // baseCurrency = defaultCurrency: khi user chọn currency khác, hiển thị
  // số tiền tương đương theo đơn vị mặc định bên dưới input.
  const {
    inputCurrency,
    onCurrencyPress,
    needsConversion,
    exchangeRate,
    convertedAmount,
  } = useCurrencyPicker({ amount: principalAmount });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showMaturityPicker, setShowMaturityPicker] = useState(false);


  // Auto-reset interestRateType khi chuyển sang BULLET (FLOATING chỉ dành cho INSTALLMENT)
  useEffect(() => {
    if (paymentType === "BULLET" && interestRateType === "FLOATING") {
      setInterestRateType("FIXED");
      setFloatingRates([{ from_installment: 1, rate: 0 }]);
    }
  }, [paymentType]);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const accentColor = colors.tint;

  const effectiveInterestRate = interestEnabled ? parseFloat(interestRate) || 0 : parseFloat(DEFAULT_INTEREST_RATE);
  const effectiveInterestRateType = interestEnabled ? interestRateType : DEFAULT_INTEREST_RATE_TYPE;
  const effectiveInterestCalcMethod = interestEnabled ? interestCalcMethod : DEFAULT_INTEREST_CALC_METHOD;

  useEffect(() => {
    if (paymentType === "INSTALLMENT") {
      const installments = parseInt(totalInstallments || "0", 10);
      const pVal = parseInt(periodValue || "1", 10) || 1;
      if (installments > 0 && startDate) {
        const d = new Date(startDate);
        switch (periodUnit) {
          case "DAY": d.setDate(d.getDate() + installments * pVal); break;
          case "WEEK": d.setDate(d.getDate() + installments * pVal * 7); break;
          case "MONTH": d.setMonth(d.getMonth() + installments * pVal); break;
          case "QUARTER": d.setMonth(d.getMonth() + installments * pVal * 3); break;
          case "YEAR": d.setFullYear(d.getFullYear() + installments * pVal); break;
        }
        setMaturityDate(d);
      } else if (installments === 0) {
        setMaturityDate(null);
      }
    }
  }, [startDate, paymentType, totalInstallments, periodValue, periodUnit]);

  // Bullet interest calculation
  const bulletSummary = useMemo(() => {
    if (paymentType !== "BULLET" || !interestEnabled || !maturityDate || !startDate) return null;
    const principal = parseNumber(principalAmount);
    const rate = parseFloat(interestRate) || 0;
    const diffMs = maturityDate.getTime() - startDate.getTime();
    if (diffMs <= 0) return null;

    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const years = diffDays / 365;
    const interest = Math.round(principal * (rate / 100) * years);

    return {
      interest,
      total: principal + interest,
      days: diffDays,
    };
  }, [paymentType, interestEnabled, principalAmount, interestRate, startDate, maturityDate]);

  // Default wallet
  useEffect(() => {
    if (!walletId && defaultWallet) {
      setWalletId(defaultWallet.walletId);
    }
  }, [defaultWallet, walletId]);

  // Load contact từ SelectParticipants
  useFocusEffect(
    useCallback(() => {
      const loadContact = async () => {
        try {
          const stored = await StorageService.getItem(
            STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE
          );
          if (!stored) return;
          const data = JSON.parse(stored);
          if (data.sessionId !== sessionIdRef.current) return;
          const participants: SelectedContact[] = data.participants || [];
          if (participants.length === 0) return;
          const contact = participants[0];
          setSelectedContact(contact);
          setCounterpartyName(contact.display_name || contact.name || "");
          await StorageService.removeItem(STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE);
        } catch (err) {
          console.error("[CreatePaybook] Load contact failed:", err);
        }
      };
      loadContact();
    }, [])
  );

  // Load selected wallet
  useFocusEffect(
    useCallback(() => {
      const loadSelectedWallet = async () => {
        try {
          const stored = await StorageService.getItem(
            STORAGE_KEY.TEMP_WALLET_STORAGE
          );
          if (!stored) return;
          const wallet = JSON.parse(stored);
          if (wallet && wallet.walletId !== undefined) {
            setWalletId(wallet.walletId);
            // Nếu ví không có trong danh sách hiện tại, refresh lại
            const exists = wallets.some(w => w.walletId === wallet.walletId);
            if (!exists) {
              refresh();
            }
          }
          await StorageService.removeItem(STORAGE_KEY.TEMP_WALLET_STORAGE);
        } catch (err) {
          console.error("[CreatePaybook] Load wallet failed:", err);
        }
      };
      loadSelectedWallet();
    }, [wallets, refresh])
  );




  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletId === walletId),
    [wallets, walletId]
  );

  // Validation
  const parsedPrincipal = parseNumber(principalAmount);
  const parsedLimit = parseNumber(loanLimit);

  const isValid =
    !!walletId &&
    counterpartyName.trim().length > 0 &&
    parsedPrincipal > 0 &&
    !!maturityDate &&
    (paymentType === "BULLET" || (paymentType === "INSTALLMENT" && parseInt(totalInstallments || "0") > 0));


  // Handlers
  const clearContact = () => {
    setSelectedContact(null);
    setCounterpartyName("");
  };

  const handleToggleInterest = (val: boolean) => {
    setInterestEnabled(val);
    if (!val) {
      setInterestRate("");
      setInterestRateType(DEFAULT_INTEREST_RATE_TYPE);
      setInterestCalcMethod(DEFAULT_INTEREST_CALC_METHOD);
      setFloatingRates([{ from_installment: 1, rate: 0 }]);
    }
  };

  // Floating rate helpers
  const updateFloatingRate = (idx: number, val: string) => {
    const r = parseFloat(val) || 0;
    setFloatingRates((prev) => prev.map((p, i) => (i === idx ? { ...p, rate: r } : p)));
  };

  const removeFloatingPeriod = (idx: number) => {
    setFloatingRates((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const addFloatingPeriod = () => {
    const from = parseInt(newFloatingFrom) || 0;
    const totalKy = parseInt(totalInstallments) || 1;
    if (from < 1 || from > totalKy) {
      showNotification(t("paybook.error_period_range", { max: totalKy }), "error"); return;
    }
    if (floatingRates.find((f) => f.from_installment === from)) {
      showNotification(t("paybook.error_period_exists", { period: from }), "error"); return;
    }
    setFloatingRates((prev) =>
      [...prev, { from_installment: from, rate: parseFloat(newFloatingRate) || 0 }].sort(
        (a, b) => a.from_installment - b.from_installment
      )
    );
    setNewFloatingFrom(""); setNewFloatingRate(""); setShowAddFloating(false);
  };

  const handleCreate = async () => {
    if (!maturityDate) return;
    if (effectiveInterestRate < 0) return showNotification(t("paybook.error_negative_rate"), "error");
    if (maturityDate <= startDate) return showNotification(t("paybook.error_maturity_date"), "error");

    // Sinh schedules cho INSTALLMENT
    let schedules: LoanScheduleItem[] | undefined;
    if (paymentType === "INSTALLMENT") {
      const n = parseInt(totalInstallments);
      if (!n || n <= 0) return showNotification(t("paybook.error_installments_required"), "error");
      schedules = generateSchedules(
        parsedPrincipal, n, startDate, periodUnit,
        interestEnabled, effectiveInterestRate,
        effectiveInterestRateType, effectiveInterestCalcMethod,
        floatingRates,
      );
    }

    try {
      await createLoan({
        wallet_id: walletId!,
        loan_type: loanType,
        counterparty_name: counterpartyName.trim(),
        counterparty_type: counterpartyType,
        loan_description: loanDescription.trim(),
        currency_code: inputCurrency.currencyId,
        loan_limit: parsedLimit,
        principal_amount: parsedPrincipal,
        interest_rate: effectiveInterestRate,
        interest_rate_type: effectiveInterestRateType,
        interest_calc_method: effectiveInterestCalcMethod,
        start_date: startDate.toISOString(),
        maturity_date: maturityDate.toISOString(),
        payment_type: paymentType,
        ...(schedules ? { schedules } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      showNotification(t("paybook.success_create"), "success");
      router.back();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : t("paybook.error_create"),
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

  // Render
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <AppHeader title={t("paybook.create_new")} />

        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. LOẠI KHOẢN VAY */}
          <View style={styles.section}>
            <View style={styles.typeContainer}>
              {LOAN_TYPE_TABS.map((tab) => {
                const isActive = loanType === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.typeButton,
                      { backgroundColor: isActive ? tab.color : colors.card, borderColor: isActive ? tab.color : colors.border },
                    ]}
                    onPress={() => setLoanType(tab.key)}
                    activeOpacity={0.7}
                  >
                    <AppIcon
                      name={tab.icon as any}
                      size={normalize(14)}
                      color={isActive ? "#fff" : colors.icon}
                      style={{ marginRight: wp(1.5) }}
                    />
                    <CustomText style={[styles.typeText, { color: isActive ? "#fff" : colors.text }]}>
                      {tab.label}
                    </CustomText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. THÔNG TIN ĐỐI TÁC */}
          <SectionHeader title={t("paybook.partner_info")} />

          {/* Loại đối tác */}
          <View style={styles.section}>
            {/* <CustomText style={[styles.label, { color: colors.text }]}>Loại đối tác</CustomText> */}
            <View style={styles.chipRow}>
              {/* COUNTERPARTY_TYPES rendering (commented out in original) */}
            </View>
          </View>

          {/* Tên đối tác + điền nhanh */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                {loanType === "LEND" ? t("paybook.debtor") : t("paybook.creditor")}{" "}
                <CustomText style={{ color: "#EF4444" }}>*</CustomText>
              </CustomText>
              <TouchableOpacity
                style={[styles.quickFillBtn, { borderColor: accentColor }]}
                onPress={() =>
                  router.push({
                    pathname: "/(protected)/select-participants",
                    params: { sessionId: sessionIdRef.current },
                  })
                }
                activeOpacity={0.7}
              >
                <AppIcon
                  name="address-book"
                  size={normalize(11)}
                  color={accentColor}
                  style={{ marginRight: wp(1) }}
                />
                <CustomText style={[styles.quickFillText, { color: accentColor }]}>
                  {t("paybook.select_contact")}
                </CustomText>
              </TouchableOpacity>
            </View>

            {selectedContact ? (
              <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: accentColor }]}>
                <View style={[styles.contactAvatar, { backgroundColor: selectedContact.avatarColor || AVATAR_COLORS[0] }]}>
                  <CustomText style={styles.contactAvatarText}>
                    {getInitials(counterpartyName || selectedContact.name)}
                  </CustomText>
                </View>
                <View style={styles.contactInfo}>
                  <CustomText style={[styles.contactName, { color: colors.text }]}>
                    {counterpartyName}
                  </CustomText>
                  {(selectedContact.phone || selectedContact.phoneNumber) ? (
                    <CustomText style={[styles.contactPhone, { color: colors.icon }]}>
                      {selectedContact.phone || selectedContact.phoneNumber}
                    </CustomText>
                  ) : null}
                </View>
                <TouchableOpacity style={[styles.removeBtn, { backgroundColor: colors.background }]} onPress={clearContact} hitSlop={8}>
                  <AppIcon name="xmark" size={normalize(12)} color={colors.icon} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <AppIcon name="user" size={normalize(16)} color={counterpartyName.trim() ? accentColor : colors.icon} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  placeholder={
                    counterpartyType === "MERCHANT"
                      ? t("paybook.company_placeholder")
                      : loanType === "LEND"
                        ? t("paybook.lend_placeholder")
                        : t("paybook.borrow_placeholder")
                  }
                  placeholderTextColor={colors.icon}
                  value={counterpartyName}
                  onChangeText={setCounterpartyName}
                  returnKeyType="next"
                />
              </View>
            )}
          </View>

          {/* 3. THÔNG TIN KHOẢN VAY */}
          <SectionHeader title={t("paybook.loan_info")} />

          {/* Ví liên kết */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("paybook.linked_wallet")} <CustomText style={{ color: "#EF4444" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/(protected)/wallet/wallet-list?mode=select")}
              activeOpacity={0.7}
            >
              <View style={styles.fieldLeft}>
                <AppIcon
                  name={(selectedWallet?.icon as any) || "wallet"}
                  size={normalize(16)}
                  color={selectedWallet?.color || colors.icon}
                  style={styles.fieldIcon}
                />
                <CustomText style={[styles.fieldText, { color: selectedWallet ? colors.text : colors.icon }]}>
                  {selectedWallet?.name || t("paybook.select_wallet_placeholder")}
                </CustomText>
              </View>
              <AppIcon name="chevron-right" size={normalize(12)} color={colors.icon} />
            </TouchableOpacity>
          </View>

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

          {/* Hạn mức tín dụng (optional) */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("paybook.limit")}
            </CustomText>
            <View style={[styles.amountWrapper, { backgroundColor: colors.card, borderColor: parsedLimit > 0 ? accentColor : colors.border }]}>
              <TextInput
                style={[styles.amountInputSm, { color: parsedLimit > 0 ? accentColor : colors.text, fontFamily: parsedLimit > 0 ? Fonts.semiBold : Fonts.regular }]}
                placeholder="0"
                placeholderTextColor={colors.icon}
                value={loanLimit}
                onChangeText={(val) => setLoanLimit(formatNum(val))}
                keyboardType="numeric"
              />
              <CustomText style={[styles.currencyTag, { color: accentColor }]}>{inputCurrency.symbol}</CustomText>
            </View>
          </View>

          {/* Số tiền gốc — dùng TransactionAmountInput với currency picker + conversion */}
          <TransactionAmountInput
            amount={principalAmount}
            onAmountChange={setPrincipalAmount}
            inputCurrency={inputCurrency}
            walletCurrency={{
              currencyId: defaultCurrency.currencyId,
              symbol: defaultCurrency.symbol,
            }}
            onCurrencyPress={onCurrencyPress}
            label={`${t("paybook.loan_amount")} *`}
          />

          {parsedLimit > 0 && parsedPrincipal > parsedLimit && (
            <View style={styles.section}>
              <CustomText style={[styles.warningText, { color: "#EF4444" }]}>
                {t("paybook.amount_limit_warning")}
              </CustomText>
            </View>
          )}


          {/* Hình thức thanh toán */}
          <SectionHeader title={t("paybook.payment_method")} />
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
                    <AppIcon
                      name={pt.icon as any}
                      size={normalize(16)}
                      color={isActive ? accentColor : colors.icon}
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

          {/* Số kỳ trả + Khoảng thời gian mỗi kỳ (chỉ hiện khi INSTALLMENT) */}
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
                  onChangeText={(t) => {
                    const raw = t.replace(/\D/g, "");
                    const num = parseInt(raw) || 0;
                    setTotalInstallments(num > 100 ? "100" : raw);
                  }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
                <CustomText style={[styles.unitTag, { color: colors.icon }]}>{t("paybook.installments")}</CustomText>
              </View>
              {parseInt(totalInstallments) >= 100 && (
                <CustomText style={[styles.warningText, { color: accentColor, marginTop: hp(0.5) }]}>
                  {t("paybook.max_installments_hint")}
                </CustomText>
              )}

              {/* Khoảng thời gian mỗi kỳ — chỉ cần chọn đơn vị, mặc định số lượng = 1 */}
              <CustomText style={[styles.label, { color: colors.text, marginTop: hp(1.5) }]}>{t("paybook.period_duration")}</CustomText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: wp(1.5) }}>
                {PERIOD_UNITS.map((pu) => {
                  const isActive = periodUnit === pu.key;
                  return (
                    <TouchableOpacity
                      key={pu.key}
                      style={[
                        styles.periodUnitBtn,
                        { backgroundColor: isActive ? accentColor : colors.card, borderColor: isActive ? accentColor : colors.border },
                      ]}
                      onPress={() => setPeriodUnit(pu.key)}
                      activeOpacity={0.7}
                    >
                      <CustomText style={{ fontSize: normalize(13), fontFamily: isActive ? Fonts.semiBold : Fonts.regular, color: isActive ? "#fff" : colors.text }}>
                        {pu.label}
                      </CustomText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <SectionHeader title={t("paybook.timeline")} />
          <View style={[styles.section, { flexDirection: "row", gap: wp(3) }]}>
            <View style={{ flex: 1 }}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                {t("paybook.start_date_label")} <CustomText style={{ color: "#EF4444" }}>*</CustomText>
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
                {t("paybook.maturity_date_label")} <CustomText style={{ color: "#EF4444" }}>*</CustomText>
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
                  {maturityDate ? formatDate(maturityDate) : t("paybook.select_date_placeholder")}
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. LÃI SUẤT — Toggle section */}
          <CollapsibleSection
            title={t("paybook.interest")}
            subtitle={interestEnabled ? t("paybook.custom_interest_hint", "Tuỳ chỉnh lãi suất & phương thức") : t("paybook.default_interest_hint", "Mặc định: không lãi suất (0%)")}
            enabled={interestEnabled}
            onToggle={handleToggleInterest}
            accentColor={accentColor}
            colors={colors}
          >
            {/* Phương pháp tính lãi */}
            <View style={styles.section}>
              <CustomText style={[styles.label, { color: colors.text }]}>{t("paybook.interest_calc_method_label")}</CustomText>
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

            {/* Loại lãi suất: Cố định / Thả nổi (chỉ hiện khi INSTALLMENT) */}
            {paymentType === "INSTALLMENT" && (
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]}>{t("paybook.interest_rate_type")}</CustomText>
                <View style={styles.chipRow}>
                  {INTEREST_RATE_TYPES.map((rt) => {
                    const isActive = interestRateType === rt.key;
                    return (
                      <TouchableOpacity
                        key={rt.key}
                        style={[
                          styles.paymentChip,
                          { flex: 1, backgroundColor: isActive ? `${accentColor}18` : colors.card, borderColor: isActive ? accentColor : colors.border },
                        ]}
                        onPress={() => setInterestRateType(rt.key)}
                        activeOpacity={0.7}
                      >
                        <AppIcon name={rt.icon as any} size={normalize(15)} color={isActive ? accentColor : colors.icon} />
                        <CustomText style={[styles.chipText, { color: isActive ? accentColor : colors.text, fontFamily: isActive ? Fonts.semiBold : Fonts.regular, marginTop: hp(0.4) }]}>
                          {rt.label}
                        </CustomText>
                        <CustomText style={[styles.chipDesc, { color: colors.icon }]}>{rt.desc}</CustomText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Nếu FIXED: nhập lãi suất */}
            {interestRateType === "FIXED" && (
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
                  <CustomText style={[styles.unitTag, { color: colors.icon }]}>%/{t("paybook.year")}</CustomText>
                </View>
              </View>
            )}

            {/* Nếu FLOATING: danh sách giai đoạn lãi + preview */}
            {interestRateType === "FLOATING" && (
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]}>{t("paybook.interest_rate_period")}</CustomText>
                {floatingRates.map((fr, idx) => {
                  const nextFrom = floatingRates[idx + 1]?.from_installment;
                  const toLabel = nextFrom ? `${fr.from_installment}–${nextFrom - 1}` : `${fr.from_installment}+`;
                  return (
                    <View key={idx} style={[styles.floatingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <CustomText style={[styles.optionLabel, { color: colors.text, marginBottom: 0 }]}>{t("paybook.period_label", { label: toLabel })}</CustomText>
                        <CustomText style={[styles.optionDesc, { color: colors.icon }]}>
                          {idx === 0 ? t("paybook.initial_rate_desc") : t("paybook.adjusted_rate_desc")}
                        </CustomText>
                      </View>
                      <View style={[styles.floatingRateInput, { borderColor: colors.border }]}>
                        <TextInput
                          style={[styles.fieldInput, { color: colors.text, textAlign: "right" }]}
                          value={fr.rate > 0 ? String(fr.rate) : ""}
                          onChangeText={(t) => updateFloatingRate(idx, t)}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={colors.icon}
                        />
                        <CustomText style={[styles.unitTag, { color: colors.icon }]}>%</CustomText>
                      </View>
                      {floatingRates.length > 1 && (
                        <TouchableOpacity onPress={() => removeFloatingPeriod(idx)} hitSlop={8} style={{ marginLeft: wp(1) }}>
                          <AppIcon name="circle-xmark" size={normalize(18)} color={colors.icon} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                {!showAddFloating ? (
                  <TouchableOpacity
                    style={[styles.addFloatingBtn, { borderColor: accentColor }]}
                    onPress={() => {
                      const used = new Set(floatingRates.map((f) => f.from_installment));
                      let s = 2; const max = parseInt(totalInstallments) || 99;
                      while (used.has(s) && s <= max) s++;
                      setNewFloatingFrom(s <= max ? String(s) : "");
                      setNewFloatingRate(""); setShowAddFloating(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="circle-plus" size={normalize(16)} color={accentColor} />
                    <CustomText style={[styles.addFloatingLabel, { color: accentColor }]}>{t("paybook.add_floating_period")}</CustomText>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.addFloatingPanel, { backgroundColor: colors.card, borderColor: accentColor }]}>
                    <CustomText style={[styles.label, { color: colors.text }]}>{t("paybook.add_floating_period")}</CustomText>
                    <View style={{ flexDirection: "row", gap: wp(2), marginBottom: hp(1) }}>
                      <View style={{ flex: 1 }}>
                        <CustomText style={[styles.optionDesc, { color: colors.icon, marginBottom: hp(0.3) }]}>{t("paybook.from_period")}</CustomText>
                        <View style={[styles.field, { backgroundColor: colors.background, borderColor: colors.border, paddingVertical: hp(1.2) }]}>
                          <TextInput style={[styles.fieldInput, { color: colors.text }]} value={newFloatingFrom} onChangeText={setNewFloatingFrom} keyboardType="number-pad" placeholder="2" placeholderTextColor={colors.icon} />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <CustomText style={[styles.optionDesc, { color: colors.icon, marginBottom: hp(0.3) }]}>{t("paybook.interest_rate_annual")}</CustomText>
                        <View style={[styles.field, { backgroundColor: colors.background, borderColor: colors.border, paddingVertical: hp(1.2) }]}>
                          <TextInput style={[styles.fieldInput, { color: colors.text }]} value={newFloatingRate} onChangeText={setNewFloatingRate} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.icon} />
                          <CustomText style={[styles.unitTag, { color: colors.icon }]}>%</CustomText>
                        </View>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: wp(2) }}>
                      <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowAddFloating(false)} activeOpacity={0.7}>
                        <CustomText style={[styles.cancelText, { color: colors.icon }]}>{t("common.cancel")}</CustomText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.addFloatingConfirm, { backgroundColor: accentColor }]} onPress={addFloatingPeriod} activeOpacity={0.7}>
                        <CustomText style={{ color: "#fff", fontSize: normalize(13), fontFamily: Fonts.semiBold }}>{t("common.add")}</CustomText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              </View>
            )}

            {/* Preview bảng lịch lãi — Hiện cho cả Fixed và Floating khi trả góp */}
            {paymentType === "INSTALLMENT" && (
              <View style={styles.section}>
                <FloatingSchedulePreview
                  floatingRates={
                    interestRateType === "FLOATING"
                      ? floatingRates
                      : [{ from_installment: 1, rate: parseFloat(interestRate) || 0 }]
                  }
                  totalInstallments={parseInt(totalInstallments) || 0}
                  principalAmount={parseNumber(principalAmount)}
                  interestCalcMethod={interestCalcMethod}
                  periodUnit={periodUnit}
                  colors={colors}
                  accentColor={accentColor}
                />
              </View>
            )}


          {/* Summary cho Bullet */}
          {paymentType === "BULLET" && bulletSummary && interestEnabled && (
            <View style={[styles.section, { marginTop: hp(1) }]}>
              <View style={[styles.bulletSummaryCard, { backgroundColor: `${accentColor}10`, borderColor: accentColor }]}>
                <View style={styles.summaryHeader}>
                  <AppIcon name="circle-info" size={normalize(14)} color={accentColor} />
                  <CustomText style={[styles.summaryTitle, { color: accentColor }]}>
                    {t("paybook.payment_summary", "Tóm tắt thanh toán")}
                  </CustomText>
                </View>
                
                <View style={styles.summaryRow}>
                  <CustomText style={[styles.summaryLabel, { color: colors.text }]}>{t("paybook.duration", "Thời hạn")}</CustomText>
                  <CustomText style={[styles.summaryValue, { color: colors.text }]}>
                    {bulletSummary.days} {t("paybook.days_unit", "ngày")}
                  </CustomText>
                </View>

                <View style={styles.summaryRow}>
                  <CustomText style={[styles.summaryLabel, { color: colors.text }]}>{t("paybook.interest", "Lãi")}</CustomText>
                  <CustomText style={[styles.summaryValue, { color: accentColor, fontFamily: Fonts.bold }]}>
                    {new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(bulletSummary.interest)} {inputCurrency.symbol}
                  </CustomText>
                </View>

                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

                <View style={styles.summaryRow}>
                  <CustomText style={[styles.summaryLabel, { color: colors.text, fontFamily: Fonts.semiBold }]}>{t("paybook.total_payment", "Tổng thanh toán")}</CustomText>
                  <CustomText style={[styles.summaryValue, { color: colors.text, fontSize: normalize(15), fontFamily: Fonts.bold }]}>
                    {new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(bulletSummary.total)} {inputCurrency.symbol}
                  </CustomText>
                </View>
              </View>
            </View>
          )}
          </CollapsibleSection>


          {/* 6. GHI CHÚ */}
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
              <CustomText style={[styles.pickerButtonText, { color: colors.tint }]}>{t("common.close")}</CustomText>
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
            onPress={handleCreate}
            disabled={!isValid || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <AppIcon name="floppy-disk" size={normalize(15)} color="#fff" style={{ marginRight: wp(1.5) }} />
                <CustomText style={styles.createText}>{t("paybook.save_paybook")}</CustomText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePaybookScreen;


