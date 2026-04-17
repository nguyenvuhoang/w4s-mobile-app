// src/features/budget/screens/CreateBudgetScreen.tsx
import AppHeader from "@/components/base/AppHeader";
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
import { FontAwesome6 } from "@expo/vector-icons";
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
    category_name: string;
    category_type: "EXPENSE" | "INCOME" | "LOAN";
    icon: string;
    color: string;
}

type BudgetType = "income" | "expense" | "inout";

// Preset period shortcuts for autofill
type PeriodPreset =
    | "THIS_MONTH"
    | "THIS_WEEK"
    | "THIS_YEAR"
    | "THIS_QUARTER"

// Interface for autofill data
interface AutofillData {
    type?: BudgetType;
    walletId?: number;
    category?: {
        id?: number;
        category_id?: string | number;
        category_name: string;
        category_type: "EXPENSE" | "INCOME" | "LOAN";
        icon: string;
        color: string;
    };
    amount?: string | number;
    // Option 1: preset period shortcut (tự tính start/end)
    period?: PeriodPreset;
    // Option 2: manual date range
    startDate?: string | Date;
    endDate?: string | Date;
    periodType?: string;
    dateRangeLabel?: string;
    note?: string;
    includeInReport?: boolean;
    autoRepeat?: boolean;
}

const CATEGORY_STORAGE_KEY = "temp_selected_category";
const WALLET_STORAGE_KEY = "temp_selected_wallet";

// Pure utility - defined outside component to avoid hoisting issues
const formatDateRange = (start: Date, end: Date) => {
    const fmt = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${day}/${month}`;
    };
    return `${fmt(start)} - ${fmt(end)}`;
};

const CreateBudgetScreen = () => {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    const params = useLocalSearchParams();
    const { wallets, defaultWallet } = useWallet();
    const { currencies, parseCurrencyName } = useCurrency({ autoFetch: true });
    const { convert } = useExchangeRate();
    const { defaultCurrency: userDefaultCurrency } = useDefaultCurrency();
    const { createBudget, creating } = useBudget({ autoFetch: false });
    const { appInfo } = useContext(GlobalContext);
    const { showNotification } = useNotification();

    const [selectedType, setSelectedType] = useState<BudgetType>("expense");
    const [sourceWalletId, setSourceWalletId] = useState<number | null>(null);
    const [selectedCategoryData, setSelectedCategoryData] =
        useState<SelectedCategoryData | null>(null);
    const [amount, setAmount] = useState("");

    const [inputCurrency, setInputCurrency] = useState<{
        currencyId: string;
        symbol: string;
        name: string;
    }>(userDefaultCurrency);
    const hasManuallySelectedCurrencyRef = useRef(false);

    // Date range states
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [periodType, setPeriodType] = useState<PeriodType>("MONTH");
    const [dateRangeLabel, setDateRangeLabel] = useState("");
    const [showDateModal, setShowDateModal] = useState(false);

    const [note, setNote] = useState("");
    const [includeInReport, setIncludeInReport] = useState(true);
    const [autoRepeat, setAutoRepeat] = useState(true);

    const selectedWallet = useMemo(() => {
        if (sourceWalletId === 0) {
            return {
                walletId: 0,
                name: t("budget.all_wallets", { defaultValue: "Tất cả các ví" }),
                icon: "layer-group",
                color: colors.tint,
            };
        }
        return wallets.find((w) => w.walletId === sourceWalletId);
    }, [wallets, sourceWalletId, colors.tint]);

    const walletCurrency = useMemo(() => {
        if (!selectedWallet || selectedWallet.walletId === 0) {
            return userDefaultCurrency;
        }
        const currency = currencies.find(
            (c) => c.currency_id === (selectedWallet as any).currency
        );
        if (currency) {
            return {
                currencyId: currency.currency_id,
                symbol: currency.symbol,
                name: parseCurrencyName(currency),
            };
        }
        return {
            currencyId: (selectedWallet as any).currency || "VND",
            symbol: (selectedWallet as any).currency === "USD" ? "$" : "đ",
            name: (selectedWallet as any).currency || "Việt Nam Đồng",
        };
    }, [selectedWallet, currencies, parseCurrencyName]);

    const needsConversion = useMemo(
        () => inputCurrency.currencyId !== walletCurrency.currencyId,
        [inputCurrency.currencyId, walletCurrency.currencyId]
    );

    const exchangeRate = useMemo(() => {
        if (!needsConversion) return null;
        const rate = convert(1, inputCurrency.currencyId, walletCurrency.currencyId);
        if (rate === null) return null;
        return walletCurrency.currencyId === "VND"
            ? Math.round(rate)
            : Math.round(rate * 10000) / 10000;
    }, [needsConversion, inputCurrency.currencyId, walletCurrency.currencyId, convert]);

    const convertedAmount = useMemo(() => {
        if (!needsConversion || !amount || amount === "0") return null;
        const num = parseFloat(amount.replace(/,/g, ""));
        if (isNaN(num)) return null;
        const result = convert(num, inputCurrency.currencyId, walletCurrency.currencyId);
        if (result === null) return null;
        return walletCurrency.currencyId === "VND"
            ? Math.round(result)
            : Math.round(result * 100) / 100;
    }, [amount, needsConversion, inputCurrency.currencyId, walletCurrency.currencyId, convert]);

    const handleAmountChange = useCallback((text: string) => {
        setAmount(text);
    }, []);

    const isValid =
        selectedWallet && selectedCategoryData && amount.trim() !== "";

    // Process autofill data from params
    // NOTE: Also handles default date range init to avoid race condition
    useEffect(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();

        if (params.autofillData) {
            try {
                const autofillData: AutofillData =
                    typeof params.autofillData === "string"
                        ? JSON.parse(params.autofillData as string)
                        : (params.autofillData as unknown as AutofillData);

                console.log("[CreateBudget] Autofill data:", autofillData);

                // Autofill type (explicit type takes priority)
                if (autofillData.type) {
                    setSelectedType(autofillData.type);
                }

                // Autofill wallet
                if (autofillData.walletId !== undefined) {
                    setSourceWalletId(autofillData.walletId);
                }

                // Autofill category + auto-sync type from category if type not explicitly set
                if (autofillData.category) {
                    setSelectedCategoryData(autofillData.category);
                    if (!autofillData.type) {
                        const typeMap = {
                            INCOME: "income",
                            EXPENSE: "expense",
                            LOAN: "inout",
                        } as const;
                        const syncedType = typeMap[autofillData.category.category_type];
                        if (syncedType) {
                            setSelectedType(syncedType);
                        }
                    }
                }

                // Autofill amount
                if (autofillData.amount !== undefined) {
                    setAmount(String(autofillData.amount));
                }

                // --- Date range handling ---
                // Option 1: period shortcut (auto-calculate start/end/label)
                if (autofillData.period) {
                    let s: Date, e: Date, label: string, pType: PeriodType;

                    switch (autofillData.period) {
                        case "THIS_MONTH":
                            s = new Date(y, m, 1);
                            e = new Date(y, m + 1, 0);
                            label = t("budget.label_this_month", { range: formatDateRange(s, e), defaultValue: `Tháng này (${formatDateRange(s, e)})` });
                            pType = "MONTH";
                            break;
                        case "THIS_WEEK": {
                            const dow = now.getDay();
                            s = new Date(now);
                            s.setDate(now.getDate() - dow + (dow === 0 ? -6 : 1));
                            s.setHours(0, 0, 0, 0);
                            e = new Date(s);
                            e.setDate(s.getDate() + 6);
                            label = t("budget.label_this_week", { range: formatDateRange(s, e), defaultValue: `Tuần này (${formatDateRange(s, e)})` });
                            pType = "WEEK";
                            break;
                        }
                        case "THIS_YEAR":
                            s = new Date(y, 0, 1);
                            e = new Date(y, 11, 31);
                            label = t("budget.label_this_year", { year: y, range: formatDateRange(s, e), defaultValue: `Năm ${y} (${formatDateRange(s, e)})` });
                            pType = "YEAR";
                            break;
                        case "THIS_QUARTER": {
                            const q = Math.floor(m / 3);
                            s = new Date(y, q * 3, 1);
                            e = new Date(y, q * 3 + 3, 0);
                            const quarterNum = q + 1;
                            label = t("budget.label_this_quarter", { quarter: quarterNum, year: y, range: formatDateRange(s, e), defaultValue: `Quý ${quarterNum}/${y} (${formatDateRange(s, e)})` });
                            pType = "QUARTER";
                            break;
                        }
                        default:
                            s = new Date(y, m, 1);
                            e = new Date(y, m + 1, 0);
                            label = t("budget.label_this_month", { range: formatDateRange(s, e), defaultValue: `Tháng này (${formatDateRange(s, e)})` });
                            pType = "MONTH";
                    }

                    setStartDate(s);
                    setEndDate(e);
                    setPeriodType(pType);
                    setDateRangeLabel(label);
                } else {
                    // Option 2: manual date range fields
                    if (autofillData.startDate) {
                        const date =
                            typeof autofillData.startDate === "string"
                                ? new Date(autofillData.startDate)
                                : autofillData.startDate;
                        if (date instanceof Date && !isNaN(date.getTime())) {
                            setStartDate(date);
                        }
                    }

                    if (autofillData.endDate) {
                        const date =
                            typeof autofillData.endDate === "string"
                                ? new Date(autofillData.endDate)
                                : autofillData.endDate;
                        if (date instanceof Date && !isNaN(date.getTime())) {
                            setEndDate(date);
                        }
                    }

                    if (autofillData.periodType) {
                        setPeriodType(autofillData.periodType as any);
                    }

                    // dateRangeLabel: use autofill value or fall back to default
                    if (autofillData.dateRangeLabel) {
                        setDateRangeLabel(autofillData.dateRangeLabel);
                    } else if (!autofillData.startDate && !autofillData.endDate) {
                        // No date range info at all -> set default this month
                        const monthStart = new Date(y, m, 1);
                        const monthEnd = new Date(y, m + 1, 0);
                        setStartDate(monthStart);
                        setEndDate(monthEnd);
                        setDateRangeLabel(t("budget.label_this_month", { range: formatDateRange(monthStart, monthEnd), defaultValue: `Tháng này (${formatDateRange(monthStart, monthEnd)})` }));
                        setPeriodType("MONTH");
                    }
                }

                // Autofill note
                if (autofillData.note) {
                    setNote(autofillData.note);
                }

                // Autofill includeInReport
                if (autofillData.includeInReport !== undefined) {
                    setIncludeInReport(autofillData.includeInReport);
                }

                // Autofill autoRepeat
                if (autofillData.autoRepeat !== undefined) {
                    setAutoRepeat(autofillData.autoRepeat);
                }
            } catch (error) {
                console.error("[CreateBudget] Failed to parse autofill data:", error);
                // On parse error, set default date range
                const monthStart = new Date(y, m, 1);
                const monthEnd = new Date(y, m + 1, 0);
                setStartDate(monthStart);
                setEndDate(monthEnd);
                setDateRangeLabel(t("budget.label_this_month", { range: formatDateRange(monthStart, monthEnd), defaultValue: `Tháng này (${formatDateRange(monthStart, monthEnd)})` }));
                setPeriodType("MONTH");
            }
        } else {
            // No autofill data -> set default date range (this month)
            const monthStart = new Date(y, m, 1);
            const monthEnd = new Date(y, m + 1, 0);
            setStartDate(monthStart);
            setEndDate(monthEnd);
            setDateRangeLabel(t("budget.label_this_month", { range: formatDateRange(monthStart, monthEnd), defaultValue: `Tháng này (${formatDateRange(monthStart, monthEnd)})` }));
            setPeriodType("MONTH");
        }
    }, [params.autofillData]);

    useEffect(() => {
        if (sourceWalletId === null && defaultWallet) {
            setSourceWalletId(defaultWallet.walletId);
        }

        if (!hasManuallySelectedCurrencyRef.current && userDefaultCurrency) {
            setInputCurrency(userDefaultCurrency);
        }
    }, [defaultWallet, sourceWalletId, userDefaultCurrency]);

    useEffect(() => {
        if (selectedWallet && currencies.length > 0 && !hasManuallySelectedCurrencyRef.current) {
            setInputCurrency(walletCurrency);
        }
    }, [(selectedWallet as any)?.walletId, walletCurrency.currencyId, currencies.length]);

    // Load selected data from storage
    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    // Load wallet
                    const storedWallet = await StorageService.getAsyncItem(
                        WALLET_STORAGE_KEY
                    );
                    if (storedWallet) {
                        const { walletId } = JSON.parse(storedWallet);
                        setSourceWalletId(walletId);
                        await StorageService.removeAsyncItem(WALLET_STORAGE_KEY);
                    }

                    // Load category
                    const storedCategory = await StorageService.getAsyncItem(
                        CATEGORY_STORAGE_KEY
                    );
                    if (storedCategory) {
                        const categoryData: SelectedCategoryData =
                            JSON.parse(storedCategory);
                        setSelectedCategoryData(categoryData);

                        // Auto sync budget type
                        const typeMap = {
                            INCOME: "income",
                            EXPENSE: "expense",
                            LOAN: "inout",
                        } as const;
                        setSelectedType(typeMap[categoryData.category_type]);

                        await StorageService.removeAsyncItem(CATEGORY_STORAGE_KEY);
                    }

                    // Load currency (shared storage key with AddTransactionScreen)
                    const storedCurrency = await StorageService.getItem("temp_selected_currency");
                    if (storedCurrency) {
                        const currency = JSON.parse(storedCurrency);
                        setInputCurrency(currency);
                        hasManuallySelectedCurrencyRef.current = true;
                        await StorageService.removeItem("temp_selected_currency");
                    }
                } catch (error) {
                    console.error("[CreateBudget] Load data failed:", error);
                }
            };
            loadData();
        }, [])
    );

    const handleTypeChange = (newType: BudgetType) => {
        setSelectedType(newType);

        // Clear category if type mismatch
        if (selectedCategoryData) {
            const typeMap = {
                income: "INCOME",
                expense: "EXPENSE",
                inout: "LOAN",
            } as const;
            if (selectedCategoryData.category_type !== typeMap[newType]) {
                setSelectedCategoryData(null);
            }
        }
    };


    const handleDateRangeSelect = (result: DateRangeResult) => {
        setStartDate(result.startDate);
        setEndDate(result.endDate);
        setPeriodType(result.periodType);

        // Format label based on period type
        if (result.periodType === "CUSTOM") {
            setDateRangeLabel(result.label);
        } else {
            setDateRangeLabel(
                `${result.label} (${formatDateRange(result.startDate, result.endDate)})`
            );
        }
    };

    const handleCreate = useCallback(async () => {
        if (!isValid || !selectedCategoryData || sourceWalletId === null) return;

        const formatToISO = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const d = String(date.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
        };

        const typeToSourceGudget = {
            income: "INCOME",
            expense: "EXPENSE",
            inout: "LOAN",
        } as const;

        const finalCategoryId = selectedCategoryData.id !== undefined
            ? Number(selectedCategoryData.id)
            : Number(selectedCategoryData.category_id);

        const finalAmount = parseFloat(amount.replace(/,/g, ""));

        const contractNumber = appInfo?.contract_number || "";

        const payload = {
            amount: finalAmount,
            category_id: finalCategoryId,
            end_date: formatToISO(endDate),
            period_type: periodType,
            source_gudget: "USER_MANUAL",
            source_tracker: sourceWalletId,
            start_date: formatToISO(startDate),
            wallet_id: sourceWalletId,
            note: note.trim() || undefined,
            include_in_report: includeInReport,
            is_auto_repeat: autoRepeat,
            contract_number: contractNumber.trim() || undefined,
            currency_code: inputCurrency.currencyId,
        };

        console.log("[CreateBudget] Submitting payload:", payload);

        const response = await createBudget(payload);

        if (response.isSuccess()) {
            showNotification(t("budget.success_create", { defaultValue: "Ngân sách đã được tạo thành công!" }), "success");
            router.back();
        } else {
            showNotification(response.getError() || t("budget.error_create", { defaultValue: "Không thể tạo ngân sách. Vui lòng thử lại." }), "error");
        }
    }, [
        isValid,
        selectedCategoryData,
        sourceWalletId,
        amount,
        endDate,
        periodType,
        selectedType,
        startDate,
        note,
        includeInReport,
        autoRepeat,
        createBudget,
        walletCurrency,
    ]);

    const parseCategoryName = (nameJson: string) => {
        try {
            const parsed = JSON.parse(nameJson);
            return parsed.vi || parsed.en || t("budget.select_group", { defaultValue: "Chọn nhóm" });
        } catch {
            return t("budget.select_group", { defaultValue: "Chọn nhóm" });
        }
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.flex}
            >
                <AppHeader title={t("budget.create_budget", { defaultValue: "Tạo ngân sách" })} />

                <ScrollView
                    style={styles.flex}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* Source Wallet - REQUIRED */}
                    <View style={styles.section}>
                        <CustomText style={[styles.label, { color: colors.text }]}>
                            {t("budget.source_wallet", { defaultValue: "Nguồn tiền" })} <CustomText style={{ color: "red" }}>*</CustomText>
                        </CustomText>
                        <TouchableOpacity
                            style={[
                                styles.field,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                            onPress={() =>
                                router.push("/(protected)/wallet/wallet-list?mode=select&allowAllWallets=true")
                            }
                        >
                            <View style={styles.fieldLeft}>
                                <FontAwesome6
                                    name={(selectedWallet?.icon as any) || "wallet"}
                                    size={normalize(18)}
                                    color={selectedWallet?.color || colors.icon}
                                    solid
                                />
                                <CustomText style={[styles.fieldText, { color: colors.text }]}>
                                    {selectedWallet?.name || t("budget.select_wallet", { defaultValue: "Chọn ví" })}
                                </CustomText>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Category - REQUIRED */}
                    <View style={styles.section}>
                        <CustomText style={[styles.label, { color: colors.text }]}>
                            {t("budget.group", { defaultValue: "Nhóm" })} <CustomText style={{ color: "red" }}>*</CustomText>
                        </CustomText>
                        <TouchableOpacity
                            style={[
                                styles.field,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                            onPress={() =>
                                router.push({
                                    pathname: "/(protected)/select-category",
                                    params: { selectedType, isBudget: "true" },
                                })
                            }
                        >
                            <View style={styles.fieldLeft}>
                                {selectedCategoryData ? (
                                    <>
                                        <View
                                            style={[
                                                styles.categoryIcon,
                                                { backgroundColor: selectedCategoryData.color },
                                            ]}
                                        >
                                            <FontAwesome6
                                                name={selectedCategoryData.icon as any}
                                                size={normalize(18)}
                                                color="#fff"
                                            />
                                        </View>
                                        <CustomText
                                            style={[styles.fieldText, { color: colors.text }]}
                                        >
                                            {parseCategoryName(selectedCategoryData.category_name)}
                                        </CustomText>
                                    </>
                                ) : (
                                    <>
                                        <View
                                            style={[
                                                styles.categoryIcon,
                                                { backgroundColor: colors.border },
                                            ]}
                                        />
                                        <CustomText
                                            style={[styles.fieldText, { color: colors.icon }]}
                                        >
                                            {t("budget.select_group", { defaultValue: "Chọn nhóm" })}
                                        </CustomText>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Amount - REQUIRED */}
                    <TransactionAmountInput
                        amount={amount}
                        onAmountChange={handleAmountChange}
                        inputCurrency={inputCurrency}
                        walletCurrency={walletCurrency}
                        onCurrencyPress={() => {
                            hasManuallySelectedCurrencyRef.current = true;
                            router.push("/(protected)/select-currency");
                        }}
                        needsConversion={needsConversion}
                        convertedAmount={convertedAmount}
                        exchangeRate={exchangeRate}
                        selectedType={selectedType}
                    />

                    {/* Time Range */}
                    <View style={styles.section}>
                        <CustomText style={[styles.label, { color: colors.text }]}>
                            {t("budget.period", { defaultValue: "Khoảng thời gian" })}
                        </CustomText>
                        <TouchableOpacity
                            style={[
                                styles.field,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                            onPress={() => setShowDateModal(true)}
                        >
                            <CustomText style={[styles.fieldText, { color: colors.text }]}>
                                {dateRangeLabel || t("budget.select_period", { defaultValue: "Chọn khoảng thời gian" })}
                            </CustomText>
                            <FontAwesome6
                                name="chevron-down"
                                size={normalize(14)}
                                color={colors.icon}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Note - Optional */}
                    <View style={styles.section}>
                        <CustomText style={[styles.label, { color: colors.text }]}>
                            {t("budget.note", { defaultValue: "Ghi chú" })}
                        </CustomText>
                        <TextInput
                            style={[
                                styles.noteInput,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder={t("budget.note_placeholder", { defaultValue: "Thêm ghi chú (tùy chọn)" })}
                            placeholderTextColor={colors.icon}
                            multiline
                            numberOfLines={4}
                            value={note}
                            onChangeText={setNote}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Toggle Options */}
                    <View
                        style={[styles.toggleSection, { backgroundColor: colors.card }]}
                    >
                        <View style={styles.toggleRow}>
                            <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
                                {t("budget.include_in_report", { defaultValue: "Tính vào báo cáo" })}
                            </CustomText>
                            <Switch
                                value={includeInReport}
                                onValueChange={setIncludeInReport}
                                trackColor={{ false: colors.border, true: colors.tint }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View
                            style={[styles.divider, { backgroundColor: colors.border }]}
                        />

                        <View style={styles.toggleRow}>
                            <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
                                {t("budget.auto_repeat", { defaultValue: "Tự động lặp lại" })}
                            </CustomText>
                            <Switch
                                value={autoRepeat}
                                onValueChange={setAutoRepeat}
                                trackColor={{ false: colors.border, true: colors.tint }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>

                    <View style={{ height: hp(12) }} />
                </ScrollView>

                {/* Bottom Buttons */}
                <View
                    style={[
                        styles.bottomBar,
                        {
                            backgroundColor: colors.background,
                            borderTopColor: colors.border,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={[styles.cancelBtn, { borderColor: colors.tint }]}
                        onPress={() => router.back()}
                    >
                        <CustomText style={[styles.cancelText, { color: colors.tint }]}>
                            {t("common.cancel", { defaultValue: "Hủy" })}
                        </CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.createBtn,
                            { backgroundColor: isValid && !creating ? colors.tint : colors.border },
                        ]}
                        onPress={handleCreate}
                        disabled={!isValid || creating}
                    >
                        <CustomText style={styles.createText}>
                            {creating ? t("budget.creating", { defaultValue: "Đang tạo..." }) : t("budget.create", { defaultValue: "Tạo" })}
                        </CustomText>
                    </TouchableOpacity>
                </View>

                {/* Date Range Modal */}
                <BottomDateRangeModal
                    visible={showDateModal}
                    title={t("budget.period", { defaultValue: "Khoảng thời gian" })}
                    initialStartDate={startDate}
                    initialEndDate={endDate}
                    initialPeriodType={periodType}
                    onSelect={handleDateRangeSelect}
                    onClose={() => setShowDateModal(false)}
                    allowCustom={false}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    section: {
        paddingHorizontal: wp(5),
        marginTop: hp(2),
    },
    label: {
        fontSize: normalize(14),
        fontFamily: Fonts.medium,
        marginBottom: normalize(8),
    },
    typeContainer: {
        flexDirection: "row",
        gap: normalize(8),
    },
    typeButton: {
        flex: 1,
        paddingVertical: normalize(10),
        borderRadius: normalize(20),
        alignItems: "center",
        borderWidth: 1,
    },
    typeText: {
        fontSize: normalize(13),
    },
    field: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(14),
        borderRadius: normalize(12),
        borderWidth: 1,
    },
    fieldLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(12),
        flex: 1,
    },
    fieldText: {
        fontSize: normalize(15),
        fontFamily: Fonts.regular,
    },
    categoryIcon: {
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(10),
        alignItems: "center",
        justifyContent: "center",
    },

    noteInput: {
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(12),
        borderRadius: normalize(12),
        borderWidth: 1,
        fontSize: normalize(14),
        fontFamily: Fonts.regular,
        minHeight: hp(12),
    },
    toggleSection: {
        marginHorizontal: wp(5),
        marginTop: hp(2),
        borderRadius: normalize(12),
        paddingHorizontal: normalize(16),
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: normalize(16),
    },
    toggleLabel: {
        fontSize: normalize(15),
        fontFamily: Fonts.regular,
    },
    divider: {
        height: 1,
    },
    bottomBar: {
        flexDirection: "row",
        paddingHorizontal: wp(5),
        paddingVertical: hp(1),
        gap: normalize(12),
        borderTopWidth: 1,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: normalize(14),
        borderRadius: normalize(12),
        alignItems: "center",
        borderWidth: 2,
    },
    cancelText: {
        fontSize: normalize(16),
        fontFamily: Fonts.semiBold,
    },
    createBtn: {
        flex: 1,
        paddingVertical: normalize(14),
        borderRadius: normalize(12),
        alignItems: "center",
    },
    createText: {
        fontSize: normalize(16),
        fontFamily: Fonts.semiBold,
        color: "#fff",
    },
});

export default CreateBudgetScreen;
