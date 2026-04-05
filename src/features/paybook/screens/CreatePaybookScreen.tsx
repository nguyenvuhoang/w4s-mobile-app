import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import STORAGE_KEY from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import {
  type CounterpartyType,
  type InterestCalcMethod,
  type InterestRateType,
  type LoanType,
  type PaymentType,
  paybookRepository,
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
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Local types ─────────────────────────────────────────────────────────────

interface SelectedContact {
  id: string;
  name: string;
  phoneNumber?: string;
  avatarColor?: string;
  display_name?: string;
  phone?: string;
  isFromServer?: boolean;
}

// ─── Option configs ───────────────────────────────────────────────────────────

const LOAN_TYPE_TABS: { key: LoanType; label: string; icon: string; color: string }[] = [
  { key: "LEND", label: "Cho vay", icon: "arrow-trend-up", color: "#22C55E" },
  { key: "BORROW", label: "Đi vay", icon: "arrow-trend-down", color: "#EF4444" },
];

const COUNTERPARTY_TYPES: { key: CounterpartyType; label: string; icon: string }[] = [
  { key: "INDIVIDUAL", label: "Cá nhân", icon: "user" },
  { key: "MERCHANT", label: "Doanh nghiệp", icon: "building" },
];

const INTEREST_RATE_TYPES: { key: InterestRateType; label: string }[] = [
  { key: "FIXED", label: "Cố định" },
  { key: "FLOATING", label: "Thả nổi" },
];

const INTEREST_CALC_METHODS: { key: InterestCalcMethod; label: string; desc: string }[] = [
  { key: "REDUCING", label: "Dư nợ giảm dần", desc: "Lãi tính trên số dư còn lại" },
  { key: "FLAT", label: "Lãi phẳng", desc: "Lãi tính theo số gốc ban đầu" },
];

const PAYMENT_TYPES: { key: PaymentType; label: string; icon: string; desc: string }[] = [
  { key: "INSTALLMENT", label: "Trả góp", icon: "calendar-days", desc: "Trả theo nhiều kỳ" },
  { key: "BULLET", label: "Trả 1 lần", icon: "circle-check", desc: "Trả toàn bộ cuối kỳ" },
];

const AVATAR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"];

// ─── Component ───────────────────────────────────────────────────────────────

const CreatePaybookScreen = () => {
  const { colors } = useAppTheme();
  const { showNotification } = useNotification();
  const { wallets, defaultWallet } = useWallet();
  const sessionIdRef = useRef<string>(Date.now().toString());

  // ── Form state ────────────────────────────────────────────────────────────
  const [loanType, setLoanType] = useState<LoanType>("LEND");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyType, setCounterpartyType] = useState<CounterpartyType>("INDIVIDUAL");
  const [selectedContact, setSelectedContact] = useState<SelectedContact | null>(null);
  const [loanDescription, setLoanDescription] = useState("");
  const [currencyCode] = useState("VND"); // Mặc định VND; mở rộng sau
  const [loanLimit, setLoanLimit] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [interestRateType, setInterestRateType] = useState<InterestRateType>("FIXED");
  const [interestCalcMethod, setInterestCalcMethod] = useState<InterestCalcMethod>("REDUCING");
  const [startDate, setStartDate] = useState(new Date());
  const [maturityDate, setMaturityDate] = useState<Date | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("INSTALLMENT");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Date pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showMaturityPicker, setShowMaturityPicker] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const accentColor = loanType === "LEND" ? "#22C55E" : "#EF4444";

  // ── Default wallet ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!walletId && defaultWallet) {
      setWalletId(defaultWallet.walletId);
    }
  }, [defaultWallet, walletId]);

  // ── Load contact từ SelectParticipants ────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const loadContact = async () => {
        try {
          const stored = await StorageService.getAsyncItem(
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
          await StorageService.removeAsyncItem(STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE);
        } catch (err) {
          console.error("[CreatePaybook] Load contact failed:", err);
        }
      };
      loadContact();
    }, [])
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  const formatDate = (d: Date) =>
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const getInitials = (n: string) => {
    const words = n.trim().split(" ");
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletId === walletId),
    [wallets, walletId]
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const parsedPrincipal = parseNumber(principalAmount);
  const parsedLimit = parseNumber(loanLimit);
  const parsedRate = parseFloat(interestRate) || 0;

  const isValid =
    !!walletId &&
    counterpartyName.trim().length > 0 &&
    parsedPrincipal > 0 &&
    parsedLimit >= parsedPrincipal &&
    parsedRate >= 0 &&
    !!maturityDate &&
    maturityDate > startDate &&
    (paymentType === "BULLET" || (paymentType === "INSTALLMENT" && parseInt(totalInstallments) > 0));

  // ── Handlers ─────────────────────────────────────────────────────────────
  const clearContact = () => {
    setSelectedContact(null);
    setCounterpartyName("");
  };

  const handleCreate = async () => {
    if (!isValid || !maturityDate) return;
    try {
      setLoading(true);
      await paybookRepository.createLoan({
        wallet_id: walletId!,
        loan_type: loanType,
        counterparty_name: counterpartyName.trim(),
        counterparty_type: counterpartyType,
        loan_description: loanDescription.trim(),
        currency_code: currencyCode,
        loan_limit: parsedLimit,
        principal_amount: parsedPrincipal,
        interest_rate: parsedRate,
        interest_rate_type: interestRateType,
        interest_calc_method: interestCalcMethod,
        start_date: startDate.toISOString(),
        maturity_date: maturityDate.toISOString(),
        payment_type: paymentType,
        total_installments:
          paymentType === "INSTALLMENT" ? parseInt(totalInstallments) : undefined,
        note: note.trim() || undefined,
      });
      showNotification("Tạo sổ nợ thành công!", "success");
      router.back();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Tạo sổ nợ thất bại!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Section renderer ──────────────────────────────────────────────────────
  const SectionHeader = ({ title }: { title: string }) => (
    <View style={[styles.sectionHeader, { borderLeftColor: accentColor }]}>
      <CustomText style={[styles.sectionHeaderText, { color: colors.text }]}>
        {title}
      </CustomText>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <AppHeader title="Tạo sổ nợ mới" />

        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ════════════════════════════════════════════════════════════════
              1. LOẠI KHOẢN VAY
          ════════════════════════════════════════════════════════════════ */}
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
                    <FontAwesome6
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

          {/* ════════════════════════════════════════════════════════════════
              2. THÔNG TIN ĐỐI TÁC
          ════════════════════════════════════════════════════════════════ */}
          <SectionHeader title="Thông tin đối tác" />

          {/* Loại đối tác */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>Loại đối tác</CustomText>
            <View style={styles.chipRow}>
              {COUNTERPARTY_TYPES.map((ct) => {
                const isActive = counterpartyType === ct.key;
                return (
                  <TouchableOpacity
                    key={ct.key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive ? `${accentColor}20` : colors.card,
                        borderColor: isActive ? accentColor : colors.border,
                      },
                    ]}
                    onPress={() => setCounterpartyType(ct.key)}
                    activeOpacity={0.7}
                  >
                    <FontAwesome6
                      name={ct.icon as any}
                      size={normalize(13)}
                      color={isActive ? accentColor : colors.icon}
                      solid
                      style={{ marginRight: wp(1.5) }}
                    />
                    <CustomText
                      style={[
                        styles.chipText,
                        { color: isActive ? accentColor : colors.text, fontFamily: isActive ? Fonts.semiBold : Fonts.regular },
                      ]}
                    >
                      {ct.label}
                    </CustomText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tên đối tác + điền nhanh */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                {loanType === "LEND" ? "Người được vay" : "Chủ nợ"}{" "}
                <CustomText style={{ color: "red" }}>*</CustomText>
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
                <FontAwesome6
                  name="address-book"
                  size={normalize(11)}
                  color={accentColor}
                  solid
                  style={{ marginRight: wp(1) }}
                />
                <CustomText style={[styles.quickFillText, { color: accentColor }]}>
                  Chọn từ danh bạ
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
                  <FontAwesome6 name="xmark" size={normalize(12)} color={colors.icon} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <FontAwesome6 name="user" size={normalize(16)} color={counterpartyName.trim() ? accentColor : colors.icon} solid style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  placeholder={
                    counterpartyType === "MERCHANT"
                      ? "Tên công ty / tổ chức..."
                      : loanType === "LEND"
                      ? "Người được bạn cho vay..."
                      : "Người bạn đang vay..."
                  }
                  placeholderTextColor={colors.icon}
                  value={counterpartyName}
                  onChangeText={setCounterpartyName}
                  returnKeyType="next"
                />
              </View>
            )}
          </View>

          {/* ════════════════════════════════════════════════════════════════
              3. THÔNG TIN KHOẢN VAY
          ════════════════════════════════════════════════════════════════ */}
          <SectionHeader title="Thông tin khoản vay" />

          {/* Ví liên kết */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Ví liên kết <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/(protected)/wallet/wallet-list?mode=select")}
              activeOpacity={0.7}
            >
              <View style={styles.fieldLeft}>
                <FontAwesome6
                  name={(selectedWallet?.icon as any) || "wallet"}
                  size={normalize(16)}
                  color={selectedWallet?.color || colors.icon}
                  solid
                  style={styles.fieldIcon}
                />
                <CustomText style={[styles.fieldText, { color: selectedWallet ? colors.text : colors.icon }]}>
                  {selectedWallet?.name || "Chọn ví liên kết"}
                </CustomText>
              </View>
              <FontAwesome6 name="chevron-right" size={normalize(12)} color={colors.icon} />
            </TouchableOpacity>
          </View>

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

          {/* Hạn mức & Số tiền thực (cạnh nhau) */}
          <View style={[styles.section, { flexDirection: "row", gap: wp(3) }]}>
            {/* Hạn mức */}
            <View style={{ flex: 1 }}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                Hạn mức <CustomText style={{ color: "red" }}>*</CustomText>
              </CustomText>
              <View style={[styles.amountWrapper, { backgroundColor: colors.card, borderColor: parsedLimit > 0 ? accentColor : colors.border }]}>
                <TextInput
                  style={[styles.amountInputSm, { color: parsedLimit > 0 ? accentColor : colors.text, fontFamily: parsedLimit > 0 ? Fonts.semiBold : Fonts.regular }]}
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  value={loanLimit}
                  onChangeText={(t) => setLoanLimit(formatNum(t))}
                  keyboardType="numeric"
                />
                <CustomText style={[styles.currencyTag, { color: accentColor }]}>đ</CustomText>
              </View>
            </View>

            {/* Số tiền thực */}
            <View style={{ flex: 1 }}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                Số tiền vay <CustomText style={{ color: "red" }}>*</CustomText>
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
          </View>

          {parsedLimit > 0 && parsedPrincipal > parsedLimit && (
            <View style={styles.section}>
              <CustomText style={[styles.warningText, { color: "#EF4444" }]}>
                ⚠️ Số tiền vay không được vượt quá hạn mức!
              </CustomText>
            </View>
          )}

          {/* ════════════════════════════════════════════════════════════════
              4. LÃI SUẤT
          ════════════════════════════════════════════════════════════════ */}
          <SectionHeader title="Lãi suất" />

          {/* Lãi suất % */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>Lãi suất (%/năm)</CustomText>
            <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FontAwesome6 name="percent" size={normalize(14)} color={parsedRate > 0 ? accentColor : colors.icon} style={styles.fieldIcon} />
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

          {/* Loại lãi suất */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>Loại lãi suất</CustomText>
            <View style={styles.chipRow}>
              {INTEREST_RATE_TYPES.map((rt) => {
                const isActive = interestRateType === rt.key;
                return (
                  <TouchableOpacity
                    key={rt.key}
                    style={[styles.chip, { flex: 1, backgroundColor: isActive ? `${accentColor}20` : colors.card, borderColor: isActive ? accentColor : colors.border }]}
                    onPress={() => setInterestRateType(rt.key)}
                    activeOpacity={0.7}
                  >
                    <CustomText style={[styles.chipText, { color: isActive ? accentColor : colors.text, fontFamily: isActive ? Fonts.semiBold : Fonts.regular }]}>
                      {rt.label}
                    </CustomText>
                  </TouchableOpacity>
                );
              })}
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

          {/* ════════════════════════════════════════════════════════════════
              5. THỜI HẠN & THANH TOÁN
          ════════════════════════════════════════════════════════════════ */}
          <SectionHeader title="Thời hạn & thanh toán" />

          {/* Ngày bắt đầu & Ngày đáo hạn */}
          <View style={[styles.section, { flexDirection: "row", gap: wp(3) }]}>
            {/* Start date */}
            <View style={{ flex: 1 }}>
              <CustomText style={[styles.label, { color: colors.text }]}>Ngày bắt đầu</CustomText>
              <TouchableOpacity
                style={[styles.dateField, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.7}
              >
                <FontAwesome6 name="calendar" size={normalize(13)} color={accentColor} solid style={{ marginRight: wp(2) }} />
                <CustomText style={[styles.dateText, { color: colors.text }]}>{formatDate(startDate)}</CustomText>
              </TouchableOpacity>
            </View>

            {/* Maturity date */}
            <View style={{ flex: 1 }}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                Đáo hạn <CustomText style={{ color: "red" }}>*</CustomText>
              </CustomText>
              <TouchableOpacity
                style={[styles.dateField, { backgroundColor: colors.card, borderColor: maturityDate ? accentColor : colors.border }]}
                onPress={() => setShowMaturityPicker(true)}
                activeOpacity={0.7}
              >
                <FontAwesome6 name="calendar-days" size={normalize(13)} color={maturityDate ? accentColor : colors.icon} solid style={{ marginRight: wp(2) }} />
                <CustomText style={[styles.dateText, { color: maturityDate ? colors.text : colors.icon }]}>
                  {maturityDate ? formatDate(maturityDate) : "Chọn ngày"}
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hình thức thanh toán */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>Hình thức thanh toán</CustomText>
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
                Số kỳ trả <CustomText style={{ color: "red" }}>*</CustomText>
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

          {/* ════════════════════════════════════════════════════════════════
              6. GHI CHÚ
          ════════════════════════════════════════════════════════════════ */}
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
            onPress={handleCreate}
            disabled={!isValid || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <FontAwesome6 name="floppy-disk" size={normalize(15)} color="#fff" style={{ marginRight: wp(1.5) }} solid />
                <CustomText style={styles.createText}>Lưu sổ nợ</CustomText>
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

    // Type tabs
    typeContainer: { flexDirection: "row", gap: wp(3) },
    typeButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: hp(1.4), borderRadius: normalize(14), borderWidth: 1.5 },
    typeText: { fontSize: normalize(14), fontFamily: Fonts.semiBold },

    // Label
    label: { fontSize: normalize(13), fontFamily: Fonts.medium, marginBottom: hp(0.8) },
    labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: hp(0.8) },
    quickFillBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: wp(2.5), paddingVertical: hp(0.5), borderRadius: normalize(20), borderWidth: 1 },
    quickFillText: { fontSize: normalize(11), fontFamily: Fonts.semiBold },

    // Contact card
    contactCard: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: normalize(14), paddingHorizontal: wp(3), paddingVertical: hp(1.2), gap: wp(2.5) },
    contactAvatar: { width: normalize(40), height: normalize(40), borderRadius: normalize(20), alignItems: "center", justifyContent: "center" },
    contactAvatarText: { fontSize: normalize(14), fontFamily: Fonts.semiBold, color: "#fff" },
    contactInfo: { flex: 1 },
    contactName: { fontSize: normalize(15), fontFamily: Fonts.semiBold, marginBottom: hp(0.2) },
    contactPhone: { fontSize: normalize(12), fontFamily: Fonts.regular },
    removeBtn: { width: normalize(26), height: normalize(26), borderRadius: normalize(13), alignItems: "center", justifyContent: "center" },

    // Fields
    field: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: normalize(14), paddingHorizontal: wp(4), paddingVertical: hp(1.6) },
    fieldLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
    fieldIcon: { marginRight: wp(2.5), width: normalize(20), textAlign: "center" },
    fieldText: { fontSize: normalize(14), fontFamily: Fonts.regular },
    fieldInput: { flex: 1, fontSize: normalize(14), fontFamily: Fonts.regular, padding: 0, margin: 0 },
    unitTag: { fontSize: normalize(13), fontFamily: Fonts.medium, marginLeft: wp(1) },

    // Chip selectors
    chipRow: { flexDirection: "row", gap: wp(2) },
    chip: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: hp(1.2), paddingHorizontal: wp(3), borderRadius: normalize(12), borderWidth: 1 },
    chipText: { fontSize: normalize(13) },
    chipDesc: { fontSize: normalize(11), fontFamily: Fonts.regular, textAlign: "center" },

    // Payment type chips (vertical)
    paymentChip: { alignItems: "center", justifyContent: "center", paddingVertical: hp(1.5), paddingHorizontal: wp(2), borderRadius: normalize(14), borderWidth: 1, gap: hp(0.3) },

    // Option rows (radio)
    optionRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: normalize(14), paddingHorizontal: wp(4), paddingVertical: hp(1.4), marginBottom: hp(1), gap: wp(3) },
    radioCircle: { width: normalize(20), height: normalize(20), borderRadius: normalize(10), borderWidth: 2, alignItems: "center", justifyContent: "center" },
    radioFill: { width: normalize(10), height: normalize(10), borderRadius: normalize(5) },
    optionLabel: { fontSize: normalize(14), fontFamily: Fonts.semiBold, marginBottom: hp(0.2) },
    optionDesc: { fontSize: normalize(12), fontFamily: Fonts.regular },

    // Amount wrapper (small — for 2-column layout)
    amountWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: normalize(14), paddingHorizontal: wp(3), paddingVertical: hp(1.4) },
    amountInputSm: { flex: 1, fontSize: normalize(16), padding: 0, margin: 0 },
    currencyTag: { fontSize: normalize(15), fontFamily: Fonts.bold, marginLeft: wp(1) },

    // Date field
    dateField: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: normalize(14), paddingHorizontal: wp(3), paddingVertical: hp(1.4) },
    dateText: { fontSize: normalize(13), fontFamily: Fonts.medium },

    // Warning
    warningText: { fontSize: normalize(12), fontFamily: Fonts.medium },

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

export default CreatePaybookScreen;
