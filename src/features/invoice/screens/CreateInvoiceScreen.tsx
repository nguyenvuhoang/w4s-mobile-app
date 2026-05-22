import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import BottomRecurringModal, {
  RecurringResult,
  RecurringType,
} from "@/components/modals/BottomRecurringModal";
import STORAGE_KEY from "@/constants/StorageKey";
import { GlobalContext } from "@/contexts/GlobalContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import TransactionAmountInput from "@/features/transaction/components/TransactionAmountInput";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import StorageService from "@/services/StorageService";
import { invoiceRepository } from "@/services/repositories/invoice.repository";
import { normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInvoice } from "../hooks/useInvoice";
import { createStyles } from "../styles/CreateInvoiceScreen.styles";

interface SelectedCategoryData {
  id: number;
  category_id: string;
  category_name: string;
  category_type: string;
  category_group: "EXPENSE" | "INCOME" | "LOAN";
  icon: string;
  color: string;
}

interface SelectedCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

interface AutofillData {
  walletId?: number;
  category?: SelectedCategoryData;
  amount?: string | number;
  date?: string | Date;
  note?: string;
  recurring?: {
    type?: RecurringType;
    count?: number;
    isForever?: boolean;
    selectedDays?: number[];
  };
}

const CreateRecurringInvoiceScreen = () => {
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams();
  const { wallets, defaultWallet } = useWallet();
  const { appInfo } = React.useContext(GlobalContext);
  const { createInvoice, updateInvoice, deleteInvoice, loading: creating } = useInvoice();
  const { showNotification } = useNotification();
  const { t, i18n } = useTranslation();
  const { currencies } = useCurrency({ autoFetch: true });
  const { convert } = useExchangeRate();

  // insets dùng thủ công — KHÔNG dùng SafeAreaView để tránh conflict với KAV
  const insets = useSafeAreaInsets();

  const scrollViewRef = useRef<ScrollView>(null);
  const hasManuallySelectedCurrencyRef = useRef(false);
  const prevWalletIdRef = useRef<number | null>(null);

  const selectedType = "expense";
  const isEditMode = (params.mode as string) === "edit";
  const editId = params.id as string | undefined;
  const screenTitle = isEditMode
    ? t("invoice.edit_recurring")
    : (params.title as string) || t("invoice.create_recurring");

  // Form states
  const [sourceWalletId, setSourceWalletId] = useState<number | null>(null);
  const [selectedCategoryData, setSelectedCategoryData] = useState<SelectedCategoryData | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState("");
  const [inputCurrency, setInputCurrency] = useState<SelectedCurrency>({
    currencyId: "VND",
    symbol: "đ",
    name: "Việt Nam Đồng",
  });

  // Recurring states
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringType, setRecurringType] = useState<RecurringType>("none");
  const [recurringCount, setRecurringCount] = useState<number | null>(null);
  const [isForever, setIsForever] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [recurringLabel, setRecurringLabel] = useState("");

  const getLocalizedRecurringLabel = useCallback(
    (type: RecurringType, count: number | null, forever: boolean) => {
      const labelMap: Record<string, string> = {
        none: t("invoice.rec_none"),
        daily: t("invoice.rec_daily"),
        weekly: t("invoice.rec_weekly"),
        monthly: t("invoice.rec_monthly"),
        yearly: t("invoice.rec_yearly"),
      };
      let label = labelMap[type] || t("invoice.rec_none");
      if (count && !forever) label += ` - ${count} ${t("invoice.times")}`;
      else if (forever) label += ` - ${t("invoice.forever")}`;
      return label;
    },
    [t],
  );

  useEffect(() => {
    if (!recurringLabel) {
      setRecurringLabel(getLocalizedRecurringLabel(recurringType, recurringCount, isForever));
    }
  }, [recurringType, recurringCount, isForever, getLocalizedRecurringLabel]);

  useEffect(() => {
    if (!params.autofillData) return;
    try {
      const autofillData: AutofillData =
        typeof params.autofillData === "string"
          ? JSON.parse(params.autofillData)
          : params.autofillData;
      if (autofillData.walletId !== undefined) setSourceWalletId(autofillData.walletId);
      if (autofillData.category) setSelectedCategoryData(autofillData.category);
      if (autofillData.amount !== undefined) setAmount(String(autofillData.amount));
      if (autofillData.note) setNote(autofillData.note);
      if (autofillData.date) {
        const date =
          typeof autofillData.date === "string" ? new Date(autofillData.date) : autofillData.date;
        if (date instanceof Date && !isNaN(date.getTime())) setSelectedDate(date);
      }
      if (autofillData.recurring) {
        const r = autofillData.recurring;
        if (r.type) {
          setRecurringType(r.type);
          setRecurringLabel(getLocalizedRecurringLabel(r.type, r.count || null, r.isForever || false));
        }
        if (r.count !== undefined) setRecurringCount(r.count);
        if (r.isForever !== undefined) setIsForever(r.isForever);
        if (r.selectedDays) setSelectedDays(r.selectedDays);
      }
    } catch (error) {
      console.error("[CreateInvoice] Failed to parse autofill data:", error);
    }
  }, [params.autofillData, getLocalizedRecurringLabel]);

  useEffect(() => {
    if (!isEditMode || !editId) return;
    const loadBillData = async () => {
      try {
        const res = await invoiceRepository.getInvoice(parseInt(editId));
        if (!res?.success || !res?.data) return;
        const bill = res.data;
        if (bill.amount !== undefined) setAmount(String(bill.amount));
        if (bill.note) setNote(bill.note);
        if (bill.wallet_id) setSourceWalletId(bill.wallet_id);
        if (bill.due_at_utc) {
          const d = new Date(bill.due_at_utc);
          if (!isNaN(d.getTime())) setSelectedDate(d);
        }
        if (bill.recurring) {
          const typeKey = (bill.recurring.type ?? "Monthly").toLowerCase() as RecurringType;
          setRecurringType(typeKey);
          setIsForever(bill.recurring.is_forever ?? false);
          setRecurringCount(bill.recurring.count ?? 12);
          setRecurringLabel(
            getLocalizedRecurringLabel(typeKey, bill.recurring.count, bill.recurring.is_forever),
          );
        }
      } catch (err) {
        console.error("[CreateInvoiceScreen] loadBillData error:", err);
      }
    };
    loadBillData();
  }, [isEditMode, editId, getLocalizedRecurringLabel]);

  const parseCurrencyName = useCallback(
    (currency: any) => {
      try {
        const name = currency.currency_name;
        if (!name) return "";
        if (!name.startsWith("{")) return name;
        const parsed = JSON.parse(name);
        return parsed[i18n.language] || parsed.vi || parsed.en || name;
      } catch {
        return currency.currency_name || "";
      }
    },
    [i18n.language],
  );

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletId === sourceWalletId),
    [wallets, sourceWalletId],
  );

  const walletCurrency = useMemo<SelectedCurrency>(() => {
    if (!selectedWallet) {
      return {
        currencyId: "VND",
        symbol: "đ",
        name: i18n.language === "vi" ? "Việt Nam Đồng" : "Vietnamese Dong",
      };
    }
    const currency = currencies.find((c) => c.currency_id === selectedWallet.currency);
    if (currency) {
      return { currencyId: currency.currency_id, symbol: currency.symbol, name: parseCurrencyName(currency) };
    }
    return {
      currencyId: selectedWallet.currency || "VND",
      symbol: selectedWallet.currency === "USD" ? "$" : "đ",
      name: selectedWallet.currency || (i18n.language === "vi" ? "Việt Nam Đồng" : "Vietnamese Dong"),
    };
  }, [selectedWallet, currencies, parseCurrencyName, i18n.language]);

  const needsConversion = useMemo(
    () => inputCurrency.currencyId !== walletCurrency.currencyId,
    [inputCurrency.currencyId, walletCurrency.currencyId],
  );

  const convertedAmount = useMemo(() => {
    if (!needsConversion || !amount || amount === "0") return null;
    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(numAmount)) return null;
    const result = convert(numAmount, inputCurrency.currencyId, walletCurrency.currencyId);
    if (result === null) return null;
    if (walletCurrency.currencyId === "VND" || walletCurrency.currencyId === "VNĐ") return Math.round(result);
    return Math.round(result * 100) / 100;
  }, [amount, needsConversion, inputCurrency.currencyId, walletCurrency.currencyId, convert]);

  const isValid = useMemo(
    () => selectedWallet && selectedCategoryData && amount.trim() !== "" && amount !== "0",
    [selectedWallet, selectedCategoryData, amount],
  );

  useEffect(() => {
    if (!sourceWalletId && defaultWallet) setSourceWalletId(defaultWallet.walletId);
  }, [defaultWallet, sourceWalletId]);

  useEffect(() => {
    if (prevWalletIdRef.current !== null && sourceWalletId !== prevWalletIdRef.current) {
      setSelectedCategoryData(null);
    }
    prevWalletIdRef.current = sourceWalletId;
  }, [sourceWalletId]);

  useEffect(() => {
    if (selectedWallet && currencies.length > 0 && !hasManuallySelectedCurrencyRef.current) {
      setInputCurrency(walletCurrency);
    }
  }, [selectedWallet?.walletId, walletCurrency.currencyId, currencies.length]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const storedWallet = await StorageService.getItem(STORAGE_KEY.TEMP_WALLET_STORAGE);
          if (storedWallet) {
            const { walletId } = JSON.parse(storedWallet);
            setSourceWalletId(walletId);
            await StorageService.removeItem(STORAGE_KEY.TEMP_WALLET_STORAGE);
          }
          const storedCategory = await StorageService.getItem(STORAGE_KEY.TEMP_CATEGORY_STORAGE);
          if (storedCategory) {
            const categoryData: SelectedCategoryData = JSON.parse(storedCategory);
            if (
              categoryData.category_group === "EXPENSE" ||
              categoryData.category_type === "EXPENSE" ||
              categoryData.category_group === "INCOME" ||
              categoryData.category_type === "INCOME"
            ) {
              setSelectedCategoryData(categoryData);
            }
            await StorageService.removeItem(STORAGE_KEY.TEMP_CATEGORY_STORAGE);
          }
          const storedCurrency = await StorageService.getItem(STORAGE_KEY.TEMP_CURRENCY_STORAGE);
          if (storedCurrency) {
            const currency: SelectedCurrency = JSON.parse(storedCurrency);
            setInputCurrency(currency);
            hasManuallySelectedCurrencyRef.current = true;
            await StorageService.removeItem(STORAGE_KEY.TEMP_CURRENCY_STORAGE);
          }
        } catch (error) {
          console.error("[CreateRecurringInvoice] Load data failed:", error);
        }
      };
      loadData();
    }, []),
  );

  const parseCategoryName = useCallback(
    (nameJson: string) => {
      if (!nameJson) return t("invoice.select_group");
      try {
        const parsed = JSON.parse(nameJson);
        return parsed[i18n.language] || parsed.vi || parsed.en || nameJson;
      } catch {
        return nameJson || t("invoice.select_group");
      }
    },
    [t, i18n.language],
  );

  const formatDate = useCallback(
    (date: Date) =>
      date.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [i18n.language],
  );

  const handleRecurringSelect = useCallback((result: RecurringResult) => {
    setRecurringType(result.type);
    setRecurringCount(result.count);
    setIsForever(result.isForever);
    setSelectedDays(result.selectedDays || [1]);
    setRecurringLabel(result.label);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!isValid || !selectedWallet || !selectedCategoryData || !appInfo) return;
    const primaryAccount =
      selectedWallet.accounts?.find((acc) => acc.isPrimary) || selectedWallet.accounts?.[0];
    const accountNumber = primaryAccount?.accountNumber || "";
    const finalAmount = needsConversion ? convertedAmount : parseFloat(amount.replace(/,/g, ""));
    const payload = {
      wallet_id: selectedWallet.walletId,
      account_number: accountNumber,
      category_id: selectedCategoryData.id,
      payment_transaction_type: selectedCategoryData.category_type === "INCOME" ? "01" : "02",
      bill_name: parseCategoryName(selectedCategoryData.category_name),
      business_type: null,
      recurring: {
        type: (recurringType.charAt(0).toUpperCase() + recurringType.slice(1)) as any,
        count: isForever ? null : recurringCount,
        is_forever: isForever,
        selected_days: recurringType === "weekly" ? selectedDays : null,
      },
      amount: finalAmount || 0,
      currency_code: walletCurrency.currencyId,
      due_at_utc: selectedDate.toISOString(),
      note,
      contract_number: appInfo.contract_number || "",
    };
    if (isEditMode) {
      const success = await updateInvoice({ ...payload, id: parseInt(editId || "0") });
      if (success) { showNotification(t("invoice.success_update"), "success"); router.back(); }
      else showNotification(t("invoice.error_update"), "error");
    } else {
      const success = await createInvoice(payload);
      if (success) { showNotification(t("invoice.success_create"), "success"); router.back(); }
      else showNotification(t("invoice.error_create"), "error");
    }
  }, [
    isValid, isEditMode, editId, selectedWallet, selectedCategoryData, amount, selectedDate,
    note, recurringType, recurringCount, selectedDays, isForever, appInfo,
    createInvoice, updateInvoice, parseCategoryName, needsConversion, convertedAmount,
    walletCurrency.currencyId, showNotification, t,
  ]);

  const handleDelete = useCallback(() => {
    showNotification(
      t("invoice.confirm_delete"),
      "warning",
      undefined,
      undefined,
      async () => {
        const success = await deleteInvoice(parseInt(editId || "0"));
        if (success) router.back();
        else showNotification(t("invoice.error_delete"), "error");
      },
    );
  }, [editId, deleteInvoice, showNotification, t]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    /**
     * CẤU TRÚC LAYOUT CHUẨN CHO EXPO (không cần thư viện thêm):
     *
     * View (flex:1, paddingTop=insets.top)          ← thay SafeAreaView, tránh conflict
     *   AppHeader
     *   KeyboardAvoidingView (flex:1)               ← chỉ bao ScrollView
     *     ScrollView
     *       ...form fields
     *   View bottomBar (paddingBottom=insets.bottom) ← NGOÀI KAV, không nhảy, không bị che
     */
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader
        title={screenTitle}
        rightComponent={
          params.autofillData ? null : (
            <TouchableOpacity
              onPress={() => router.push("/(protected)/invoice/scan")}
              style={styles.scanBtn}
              activeOpacity={0.7}
            >
              <AppIcon name="expand" size={normalize(18)} color={colors.tint} />
            </TouchableOpacity>
          )
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + normalize(56) : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Source Wallet */}
          <View style={styles.section}>
            <CustomText style={styles.label}>
              {t("transaction.source_wallet")}{" "}
              <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={styles.field}
              onPress={() => router.push("/(protected)/wallet/wallet-list?mode=select")}
            >
              <View style={styles.fieldLeft}>
                <AppIcon
                  name={(selectedWallet?.icon as any) || "wallet"}
                  size={normalize(18)}
                  color={selectedWallet?.color || colors.icon}
                />
                <CustomText style={styles.fieldText}>
                  {selectedWallet?.name || t("transaction.select_wallet")}
                </CustomText>
              </View>
              <AppIcon name="chevron-right" size={normalize(16)} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <CustomText style={styles.label}>
              {t("transaction.category")}{" "}
              <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={styles.field}
              onPress={() => {
                if (sourceWalletId === null) {
                  showNotification(
                    t("transaction.please_select_wallet_first", {
                      defaultValue: "Vui lòng chọn ví trước khi chọn hạng mục",
                    }),
                    "warning",
                  );
                  return;
                }
                router.push({
                  pathname: "/(protected)/select-category",
                  params: { selectedType, isInvoice: "true", walletId: sourceWalletId },
                });
              }}
            >
              <View style={styles.fieldLeft}>
                {selectedCategoryData ? (
                  <>
                    <View style={[styles.categoryIcon, { backgroundColor: selectedCategoryData.color }]}>
                      <AppIcon
                        name={selectedCategoryData.icon as any}
                        size={normalize(18)}
                        color="#fff"
                      />
                    </View>
                    <CustomText style={styles.fieldText}>
                      {parseCategoryName(selectedCategoryData.category_name)}
                    </CustomText>
                  </>
                ) : (
                  <>
                    <View style={[styles.categoryIcon, { backgroundColor: colors.border }]} />
                    <CustomText style={[styles.fieldText, { color: colors.icon }]}>
                      {t("transaction.select_category")}
                    </CustomText>
                  </>
                )}
              </View>
              <AppIcon name="chevron-right" size={normalize(16)} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <TransactionAmountInput
            amount={amount}
            onAmountChange={setAmount}
            inputCurrency={inputCurrency}
            walletCurrency={{
              currencyId: appInfo?.currency_code || "VND",
              symbol: appInfo?.currency_code === "USD" ? "$" : "đ",
            }}
            onCurrencyPress={() => {
              hasManuallySelectedCurrencyRef.current = true;
              router.push("/(protected)/select-currency");
            }}
            selectedType={selectedType}
            label={t("transaction.amount")}
          />

          {/* Recurring Period */}
          <View style={styles.section}>
            <CustomText style={styles.label}>{t("invoice.recurring_cycle")}</CustomText>
            <TouchableOpacity style={styles.field} onPress={() => setShowRecurringModal(true)}>
              <View style={styles.fieldLeft}>
                <AppIcon
                  name="rotate"
                  size={normalize(18)}
                  color={recurringType !== "none" ? colors.tint : colors.icon}
                />
                <CustomText
                  style={[styles.fieldText, recurringType === "none" && { color: colors.icon }]}
                >
                  {recurringLabel}
                </CustomText>
              </View>
              <AppIcon name="chevron-right" size={normalize(16)} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Start Date */}
          <View style={styles.section}>
            <CustomText style={styles.label}>
              {t("invoice.start_date", "Ngày bắt đầu")}
            </CustomText>
            <View style={styles.datePicker}>
              <TouchableOpacity
                onPress={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d);
                }}
              >
                <AppIcon name="chevron-left" size={normalize(16)} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <CustomText style={styles.dateText}>{formatDate(selectedDate)}</CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d);
                }}
              >
                <AppIcon name="chevron-right" size={normalize(16)} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <CustomText style={styles.label}>{t("transaction.note")}</CustomText>
            <TextInput
              style={styles.noteInput}
              placeholder={t("transaction.note_placeholder_optional")}
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={3}
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
              onFocus={() => {
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
              }}
            />
          </View>

          {/* Info box */}
          {recurringType !== "none" && (
            <View style={styles.infoBox}>
              <AppIcon name="circle-info" size={normalize(16)} color={colors.tint} />
              <View style={styles.infoTextContainer}>
                <CustomText style={styles.infoText}>{t("invoice.info_auto_create")}</CustomText>
                {recurringType === "weekly" && selectedDays.length > 0 && (
                  <CustomText style={[styles.infoText, { marginTop: normalize(4) }]}>
                    {t("invoice.info_created_on")}{" "}
                    {selectedDays
                      .map((d) => {
                        const days =
                          i18n.language === "vi"
                            ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
                            : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                        return days[d];
                      })
                      .join(", ")}
                  </CustomText>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* bottomBar: NGOÀI KAV, paddingBottom = insets.bottom để không bị nav bar che */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, normalize(16)) + normalize(12) }]}>
        {isEditMode ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={creating}>
            <AppIcon name="trash-can" size={normalize(16)} color="#EF4444" />
            <CustomText style={styles.deleteText}>{t("invoice.delete")}</CustomText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} disabled={creating}>
            <CustomText style={styles.cancelText}>{t("invoice.cancel")}</CustomText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.createBtn, { opacity: isValid && !creating ? 1 : 0.6 }]}
          onPress={handleCreate}
          disabled={!isValid || creating}
        >
          {isValid && !creating ? (
            <LinearGradient
              colors={colors.gradientPrimary || colors.gradianBase}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: normalize(25) }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.border, borderRadius: normalize(25) },
              ]}
            />
          )}
          <CustomText style={styles.createText} type="bold">
            {creating ? t("invoice.processing") : isEditMode ? t("invoice.save") : t("invoice.create")}
          </CustomText>
        </TouchableOpacity>
      </View>

      <BottomRecurringModal
        visible={showRecurringModal}
        title={t("invoice.recurring_cycle")}
        initialRecurringType={recurringType}
        initialRecurringCount={recurringCount || 1}
        initialIsForever={isForever}
        initialSelectedDays={selectedDays}
        onSelect={handleRecurringSelect}
        onClose={() => setShowRecurringModal(false)}
      />

      <DatePicker
        modal
        open={showDatePicker}
        date={selectedDate}
        mode="date"
        theme={isDark ? "dark" : "light"}
        buttonColor={colors.tint}
        dividerColor={colors.tint}
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        title={t("invoice.start_date", "Ngày bắt đầu")}
        onConfirm={(date) => { setShowDatePicker(false); setSelectedDate(date); }}
        onCancel={() => setShowDatePicker(false)}
      />
    </View>
  );
};

export default CreateRecurringInvoiceScreen;