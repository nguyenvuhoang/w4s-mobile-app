// src/features/budget/screens/EditBudgetScreen.tsx
import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import BottomDateRangeModal, {
    DateRangeResult,
    PeriodType,
} from "@/components/modals/BottomDateRangeModal";
import { GlobalContext } from "@/contexts/GlobalContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { useBudget } from "@/features/budget/hooks/useBudget";
import TransactionAmountInput from "@/features/transaction/components/TransactionAmountInput";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
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

interface SelectedCategoryData {
    id?: number;
    category_id?: string | number;
    category_code?: string;
    category_name: string;
    category_type: "EXPENSE" | "INCOME" | "LOAN";
    icon: string;
    color: string;
}

type BudgetType = "income" | "expense" | "inout";

interface AutofillData {
    budget_id: number;
    walletId: number;
    category: SelectedCategoryData;
    amount: string | number;
    startDate: string | Date;
    endDate: string | Date;
    periodType: string;
    note?: string;
    includeInReport?: boolean;
    autoRepeat?: boolean;
}

const CATEGORY_STORAGE_KEY = "temp_selected_category";
const WALLET_STORAGE_KEY = "temp_selected_wallet";

const formatDateRange = (start: Date, end: Date) => {
    const fmt = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${day}/${month}`;
    };
    return `${fmt(start)} - ${fmt(end)}`;
};

const EditBudgetScreen = () => {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    const params = useLocalSearchParams();
    const { wallets, defaultWallet } = useWallet();
    const { currencies, parseCurrencyName } = useCurrency({ autoFetch: true });
    const { convert } = useExchangeRate();
    const { defaultCurrency: userDefaultCurrency } = useDefaultCurrency();
    const { updateBudget, creating: updating } = useBudget({ autoFetch: false });
    const { appInfo } = useContext(GlobalContext);
    const { showNotification } = useNotification();

    const initialAutofillData = useMemo(() => {
        if (params.autofillData) {
            try {
                return (typeof params.autofillData === "string"
                    ? JSON.parse(params.autofillData as string)
                    : params.autofillData) as AutofillData;
            } catch (error) {
                console.error("[EditBudget] Initial parse error:", error);
                return null;
            }
        }
        return null;
    }, [params.autofillData]);

    const [selectedType, setSelectedType] = useState<BudgetType>(() => {
        if (initialAutofillData?.category?.category_type) {
            const typeMap = { INCOME: "income", EXPENSE: "expense", LOAN: "inout" } as const;
            const categoryType = initialAutofillData.category.category_type as keyof typeof typeMap;
            return typeMap[categoryType] || "expense";
        }
        return "expense";
    });

    const [sourceWalletId, setSourceWalletId] = useState<number | null>(initialAutofillData?.walletId ?? null);
    const [selectedCategoryData, setSelectedCategoryData] = useState<SelectedCategoryData | null>(initialAutofillData?.category ?? null);
    const [amount, setAmount] = useState(initialAutofillData?.amount ? String(initialAutofillData.amount) : "");
    const [inputCurrency, setInputCurrency] = useState<{ currencyId: string; symbol: string; name: string; }>(userDefaultCurrency);
    const hasManuallySelectedCurrencyRef = useRef(false);
    const prevWalletIdRef = useRef<number | null>(sourceWalletId);

    const [startDate, setStartDate] = useState<Date>(initialAutofillData?.startDate ? new Date(initialAutofillData.startDate) : new Date());
    const [endDate, setEndDate] = useState<Date>(initialAutofillData?.endDate ? new Date(initialAutofillData.endDate) : new Date());
    const [periodType, setPeriodType] = useState<PeriodType>((initialAutofillData?.periodType as any) ?? "MONTH");
    const [dateRangeLabel, setDateRangeLabel] = useState("");
    const [showDateModal, setShowDateModal] = useState(false);

    const [note, setNote] = useState(initialAutofillData?.note ?? "");
    const [includeInReport, setIncludeInReport] = useState(initialAutofillData?.includeInReport ?? true);
    const [autoRepeat, setAutoRepeat] = useState(initialAutofillData?.autoRepeat ?? true);

    const selectedWallet = useMemo(() => {
        if (sourceWalletId === 0) return { walletId: 0, name: t("budget.all_wallets"), icon: "layer-group", color: colors.tint };
        return wallets.find((w) => w.walletId === sourceWalletId);
    }, [wallets, sourceWalletId, colors.tint, t]);

    const walletCurrency = useMemo(() => {
        if (!selectedWallet || selectedWallet.walletId === 0) return userDefaultCurrency;
        const currency = currencies.find((c) => c.currency_id === (selectedWallet as any).currency);
        if (currency) return { currencyId: currency.currency_id, symbol: currency.symbol, name: parseCurrencyName(currency) };
        return { currencyId: (selectedWallet as any).currency || "VND", symbol: (selectedWallet as any).currency === "USD" ? "$" : "đ", name: (selectedWallet as any).currency || "Việt Nam Đồng" };
    }, [selectedWallet, currencies, parseCurrencyName, userDefaultCurrency]);

    useEffect(() => {
        if (startDate && endDate) setDateRangeLabel(formatDateRange(startDate, endDate));
    }, [startDate, endDate]);

    const handleAmountChange = useCallback((text: string) => setAmount(text), []);
    const isValid = selectedWallet && selectedCategoryData && amount.trim() !== "";

    useEffect(() => {
        if (prevWalletIdRef.current !== null && sourceWalletId !== prevWalletIdRef.current) setSelectedCategoryData(null);
        prevWalletIdRef.current = sourceWalletId;
    }, [sourceWalletId]);

    useEffect(() => {
        if (selectedWallet && currencies.length > 0 && !hasManuallySelectedCurrencyRef.current) setInputCurrency(walletCurrency);
    }, [selectedWallet?.walletId, walletCurrency.currencyId, currencies.length]);

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    const storedWallet = await StorageService.getItem(WALLET_STORAGE_KEY);
                    if (storedWallet) { const { walletId } = JSON.parse(storedWallet); setSourceWalletId(walletId); await StorageService.removeItem(WALLET_STORAGE_KEY); }

                    const storedCategory = await StorageService.getItem(CATEGORY_STORAGE_KEY);
                    if (storedCategory) {
                        const categoryData: SelectedCategoryData = JSON.parse(storedCategory);
                        setSelectedCategoryData(categoryData);
                        const typeMap = { INCOME: "income", EXPENSE: "expense", LOAN: "inout" } as const;
                        const categoryType = categoryData.category_type as keyof typeof typeMap;
                        setSelectedType(typeMap[categoryType] || "expense");
                        await StorageService.removeItem(CATEGORY_STORAGE_KEY);
                    }

                    const storedCurrency = await StorageService.getItem("temp_selected_currency");
                    if (storedCurrency) { const currency = JSON.parse(storedCurrency); setInputCurrency(currency); hasManuallySelectedCurrencyRef.current = true; await StorageService.removeItem("temp_selected_currency"); }
                } catch (error) { console.error("[EditBudget] Load data failed:", error); }
            };
            loadData();
        }, [])
    );

    const handleDateRangeSelect = (result: DateRangeResult) => {
        setStartDate(result.startDate); setEndDate(result.endDate); setPeriodType(result.periodType);
        setDateRangeLabel(result.periodType === "CUSTOM" ? result.label : `${result.label} (${formatDateRange(result.startDate, result.endDate)})`);
    };

    const handleUpdate = useCallback(async () => {
        if (!isValid || !selectedCategoryData || sourceWalletId === null || !initialAutofillData) return;
        const formatToISO = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const finalAmount = parseFloat(amount.replace(/,/g, ""));
        const payload = {
            budget_id: initialAutofillData.budget_id,
            amount: finalAmount,
            category_id: sourceWalletId === 0 ? null : (selectedCategoryData.id || selectedCategoryData.category_id || 0),
            category_code: selectedCategoryData.category_code,
            end_date: formatToISO(endDate),
            period_type: periodType,
            source_gudget: "USER_MANUAL",
            source_tracker: sourceWalletId,
            start_date: formatToISO(startDate),
            wallet_id: sourceWalletId,
            note: note.trim() || undefined,
            include_in_report: includeInReport,
            is_auto_repeat: autoRepeat,
            currency_code: inputCurrency.currencyId,
        };
        const response = await updateBudget(payload as any);
        if (response.isSuccess()) { showNotification(t("budget.success_update", { defaultValue: "Cập nhật ngân sách thành công!" }), "success"); router.back(); }
        else { showNotification(response.getError() || t("budget.error_update", { defaultValue: "Cập nhật thất bại" }), "error"); }
    }, [isValid, selectedCategoryData, sourceWalletId, amount, endDate, periodType, startDate, note, includeInReport, autoRepeat, updateBudget, inputCurrency, initialAutofillData, t, showNotification]);

    const parseCategoryName = (nameJson: string) => {
        if (!nameJson) return t("budget.select_group");
        try {
            const parsed = JSON.parse(nameJson);
            return parsed.vi || parsed.en || t("budget.select_group");
        } catch {
            return nameJson; // Return as plain string if not JSON
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
                <AppHeader title={t("budget.edit_budget", { defaultValue: "Sửa ngân sách" })} />
                <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={styles.section}>
                        <CustomText style={[styles.label, { color: colors.text }]}>{t("budget.source_wallet")} <CustomText style={{ color: "red" }}>*</CustomText></CustomText>
                        <TouchableOpacity style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push("/(protected)/wallet/wallet-list?mode=select&allowAllWallets=true")}>
                            <View style={styles.fieldLeft}>
                                <AppIcon name={(selectedWallet?.icon as any) || "wallet"} size={normalize(18)} color={selectedWallet?.color || colors.icon} />
                                <CustomText style={[styles.fieldText, { color: colors.text }]}>{selectedWallet?.name || t("budget.select_wallet")}</CustomText>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.section}>
                        <CustomText style={[styles.label, { color: colors.text }]}>{t("budget.group")} <CustomText style={{ color: "red" }}>*</CustomText></CustomText>
                        <TouchableOpacity style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {
                            if (sourceWalletId === null) { showNotification(t("transaction.please_select_wallet_first"), "warning"); return; }
                            router.push({ pathname: "/(protected)/select-category", params: { selectedType, isBudget: "true", walletId: sourceWalletId } });
                        }}>
                            <View style={styles.fieldLeft}>
                                {selectedCategoryData ? (
                                    <>
                                        <View style={[styles.categoryIcon, { backgroundColor: selectedCategoryData.color }]}>
                                            <AppIcon name={selectedCategoryData.icon as any} size={normalize(18)} color="#fff" />
                                        </View>
                                        <CustomText style={[styles.fieldText, { color: colors.text }]}>{parseCategoryName(selectedCategoryData.category_name)}</CustomText>
                                    </>
                                ) : (
                                    <>
                                        <View style={[styles.categoryIcon, { backgroundColor: colors.border }]} />
                                        <CustomText style={[styles.fieldText, { color: colors.icon }]}>{t("budget.select_group")}</CustomText>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                    <TransactionAmountInput amount={amount} onAmountChange={handleAmountChange} inputCurrency={inputCurrency} walletCurrency={userDefaultCurrency} onCurrencyPress={() => { hasManuallySelectedCurrencyRef.current = true; router.push("/(protected)/select-currency"); }} selectedType={selectedType} />
                    <View style={styles.section}>
                        <CustomText style={[styles.label, { color: colors.text }]}>{t("budget.period")}</CustomText>
                        <TouchableOpacity style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowDateModal(true)}>
                            <CustomText style={[styles.fieldText, { color: colors.text }]}>{dateRangeLabel || t("budget.select_period")}</CustomText>
                            <AppIcon name="chevron-down" size={normalize(14)} color={colors.icon} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.section}>
                        <CustomText style={[styles.label, { color: colors.text }]}>{t("budget.note")}</CustomText>
                        <TextInput style={[styles.noteInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} placeholder={t("budget.note_placeholder")} placeholderTextColor={colors.icon} multiline numberOfLines={4} value={note} onChangeText={setNote} textAlignVertical="top" />
                    </View>
                    <View style={[styles.toggleSection, { backgroundColor: colors.card }]}>
                        <View style={styles.toggleRow}>
                            <CustomText style={[styles.toggleLabel, { color: colors.text }]}>{t("budget.include_in_report")}</CustomText>
                            <Switch value={includeInReport} onValueChange={setIncludeInReport} trackColor={{ false: colors.border, true: colors.tint }} thumbColor="#fff" />
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.toggleRow}>
                            <CustomText style={[styles.toggleLabel, { color: colors.text }]}>{t("budget.auto_repeat")}</CustomText>
                            <Switch value={autoRepeat} onValueChange={setAutoRepeat} trackColor={{ false: colors.border, true: colors.tint }} thumbColor="#fff" />
                        </View>
                    </View>
                    <View style={{ height: hp(12) }} />
                </ScrollView>
                <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.tint }]} onPress={() => router.back()}>
                        <CustomText style={[styles.cancelText, { color: colors.tint }]}>{t("common.cancel")}</CustomText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.createBtn, { backgroundColor: isValid && !updating ? colors.tint : colors.border }]} onPress={handleUpdate} disabled={!isValid || updating}>
                        <CustomText style={styles.createText}>{updating ? t("common.saving") : t("common.save")}</CustomText>
                    </TouchableOpacity>
                </View>
                <BottomDateRangeModal visible={showDateModal} title={t("budget.period")} initialStartDate={startDate} initialEndDate={endDate} initialPeriodType={periodType} onSelect={handleDateRangeSelect} onClose={() => setShowDateModal(false)} allowCustom={false} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    section: { paddingHorizontal: wp(5), marginTop: hp(2) },
    label: { fontSize: normalize(14), fontFamily: Fonts.medium, marginBottom: normalize(8) },
    field: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: normalize(16), paddingVertical: normalize(14), borderRadius: normalize(12), borderWidth: 1 },
    fieldLeft: { flexDirection: "row", alignItems: "center", gap: normalize(12), flex: 1 },
    fieldText: { fontSize: normalize(15), fontFamily: Fonts.regular },
    categoryIcon: { width: normalize(36), height: normalize(36), borderRadius: normalize(10), alignItems: "center", justifyContent: "center" },
    noteInput: { paddingHorizontal: normalize(16), paddingVertical: normalize(12), borderRadius: normalize(12), borderWidth: 1, fontSize: normalize(14), fontFamily: Fonts.regular, minHeight: hp(12) },
    toggleSection: { marginHorizontal: wp(5), marginTop: hp(2), borderRadius: normalize(12), paddingHorizontal: normalize(16) },
    toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: normalize(16) },
    toggleLabel: { fontSize: normalize(15), fontFamily: Fonts.regular },
    divider: { height: 1 },
    bottomBar: { flexDirection: "row", paddingHorizontal: wp(5), paddingVertical: hp(1), gap: normalize(12), borderTopWidth: 1 },
    cancelBtn: { flex: 1, paddingVertical: normalize(14), borderRadius: normalize(12), alignItems: "center", borderWidth: 2 },
    cancelText: { fontSize: normalize(16), fontFamily: Fonts.semiBold },
    createBtn: { flex: 1, paddingVertical: normalize(14), borderRadius: normalize(12), alignItems: "center" },
    createText: { fontSize: normalize(16), fontFamily: Fonts.semiBold, color: "#fff" },
});

export default EditBudgetScreen;
