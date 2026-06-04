import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useCategory } from "@/hooks/useCategory";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { getValidIconName } from "@/utils/iconMapper";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBudgetTransactions } from "../hooks/useBudgetTransactions";

const BudgetTransactionHistoryScreen: React.FC = () => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const { defaultCurrency } = useDefaultCurrency();
    const { convertBetween, formatAmount } = useCurrencyConverter();
    const { categories } = useCategory();
    const params = useLocalSearchParams();

    const budgetId = Number(params.budgetId);
    const walletId = params.walletId ? Number(params.walletId) : undefined;
    const categoryName = params.categoryName as string;
    const fromDate = params.fromDate as string;
    const toDate = params.toDate as string;

    const {
        transactions,
        loading,
        loadingMore,
        hasMore,
        refresh,
        loadMore,
    } = useBudgetTransactions(budgetId, walletId, fromDate, toDate);

    // Create a lookup map for categories
    const categoryMap = React.useMemo(() => {
        const map: Record<number, any> = {};
        categories.forEach(cat => {
            map[cat.id] = cat;
        });
        return map;
    }, [categories]);

    // Calculate totalExpense from transactions by converting them to the default currency if needed
    const totalExpense = React.useMemo(() => {
        let expense = 0;

        transactions.forEach((transaction) => {
            const amount = Number(transaction.amount || 0);
            const isExpense = amount < 0 || transaction.type === "02" || transaction.name === "Expense" || transaction.transaction_type === "EXPENSE";
            
            if (isExpense) {
                const itemCurrency = transaction.currency || "VND";
                let finalAmount = Math.abs(amount);
                
                if (itemCurrency !== defaultCurrency.currencyId) {
                    const converted = convertBetween(finalAmount, itemCurrency, defaultCurrency.currencyId);
                    if (converted !== null) {
                        finalAmount = converted;
                    }
                }
                
                expense += finalAmount;
            }
        });

        return expense;
    }, [transactions, defaultCurrency.currencyId, convertBetween]);

    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const handleEndReached = React.useCallback(() => {
        if (hasMore && !loadingMore && !loading) {
            loadMore();
        }
    }, [hasMore, loadingMore, loading, loadMore]);

    const formatCurrency = (amount: number) => {
        return formatAmount(amount);
    };

    const formatTransactionAmount = (transaction: any) => {
        const amount = Number(transaction.amount || 0);
        const isExpense = amount < 0 || transaction.type === "02" || transaction.name === "Expense" || transaction.transaction_type === "EXPENSE";
        const sign = isExpense ? "-" : "+";

        const itemCurrency = transaction.currency || "VND";
        let finalAmount = Math.abs(amount);

        if (itemCurrency !== defaultCurrency.currencyId) {
            const converted = convertBetween(finalAmount, itemCurrency, defaultCurrency.currencyId);
            if (converted !== null) finalAmount = converted;
        }

        return `${sign}${formatAmount(finalAmount)}`;
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
        const time = date.toLocaleTimeString(i18n.language === "vi" ? "vi-VN" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
        return { day, time };
    };

    const getCategoryIcon = (transaction: any): string => {
        const category = categoryMap[transaction.category_id];
        let iconName = transaction.icon || transaction.category_icon || category?.icon;

        if (!iconName) {
            const amount = Number(transaction.amount || 0);
            const isExpense = amount < 0 || transaction.type === "02" || transaction.name === "Expense" || transaction.transaction_type === "EXPENSE";
            if (!isExpense) iconName = "cash";
            else iconName = "cart";
        }
        return getValidIconName(iconName);
    };

    const getCategoryColor = (transaction: any): string => {
        const category = categoryMap[transaction.category_id];
        if (transaction.color || transaction.category_color || category?.color) {
            return transaction.color || transaction.category_color || category?.color;
        }
        const amount = Number(transaction.amount || 0);
        const isExpense = amount < 0 || transaction.type === "02" || transaction.name === "Expense" || transaction.transaction_type === "EXPENSE";
        if (!isExpense) return "#4CAF50";
        return "#FF6B6B";
    };

    const getCategoryName = (transaction: any): string => {
        const category = categoryMap[transaction.category_id];
        const rawName = transaction.category_name || category?.category_name || transaction.title || transaction.name;
        const parsed = parseName(rawName);

        // Nếu tên lấy ra trùng với "Expense" hoặc "Income" hoặc rỗng, dùng fallback "Chi tiêu"/"Thu nhập"
        const upperName = String(parsed || '').toUpperCase();
        if (!parsed || upperName === 'EXPENSE' || upperName === 'INCOME') {
            return Number(transaction.amount || 0) < 0 ? t('budget.history.expense') : t('budget.history.income');
        }
        return parsed;
    };

    const parseName = (name: string | null): string | null => {
        if (!name) return null;
        try {
            const parsed = JSON.parse(name);
            return parsed[i18n.language] || parsed.vi || parsed.en || name;
        } catch {
            return name;
        }
    };

    const navigateToDetail = (transaction: any) => {
        const amount = Number(transaction.amount || 0);
        const isExpense = amount < 0 || transaction.type === "02" || transaction.name === "Expense" || transaction.transaction_type === "EXPENSE";

        const detailData = {
            transactionid: transaction.transaction_id,
            transactiondate: transaction.transaction_date || transaction.recorded_at,
            transactionname: getCategoryName(transaction),
            transactioncode: isExpense ? "02" : "01",
            nu_m01: Math.abs(transaction.amount || 0),
            ccyid: transaction.currency || defaultCurrency.currencyId,
            trandesc: transaction.description || transaction.title || "",
            status: "Completed",
            icon: getCategoryIcon(transaction),
            color: getCategoryColor(transaction),
        };

        router.push({
            pathname: "/(protected)/transaction-detail",
            params: { transaction: JSON.stringify(detailData) },
        });
    };

    const renderTransactionItem = ({ item }: { item: any }) => {
        const iconName = getCategoryIcon(item);
        const iconColor = getCategoryColor(item);
        const amount = Number(item.amount || 0);
        const isExpense = amount < 0 || item.type === "02" || item.name === "Expense" || item.transaction_type === "EXPENSE";
        const { day, time } = formatDateTime(item.transaction_date || item.recorded_at);

        return (
            <TouchableOpacity
                style={[localStyles.transactionCard, { backgroundColor: colors.card }]}
                onPress={() => navigateToDetail(item)}
                activeOpacity={0.7}
            >
                <View style={localStyles.cardLeft}>
                    <View
                        style={[
                            localStyles.iconContainer,
                            { backgroundColor: iconColor + "1A" },
                        ]}
                    >
                        <AppIcon name={iconName} size={normalize(22)} color={iconColor} />
                    </View>
                    <View style={localStyles.transactionInfo}>
                        <CustomText style={[localStyles.transactionTitle, { color: colors.text }]} type="bold" numberOfLines={1}>
                            {getCategoryName(item)}
                        </CustomText>
                        {item.description ? (
                            <CustomText style={[localStyles.transactionCategory, { color: colors.icon }]} numberOfLines={1}>
                                {item.description}
                            </CustomText>
                        ) : (item.title && parseName(item.title) !== parseName(item.category_name)) ? (
                            <CustomText style={[localStyles.transactionCategory, { color: colors.icon }]} numberOfLines={1}>
                                {parseName(item.title)}
                            </CustomText>
                        ) : null}
                    </View>
                </View>
                <View style={localStyles.cardRight}>
                    <CustomText
                        style={[
                            localStyles.amountText,
                            { color: isExpense ? "#FF3B30" : "#4CAF50" }
                        ]}
                        type="bold"
                    >
                        {formatTransactionAmount(item)}
                    </CustomText>
                    <CustomText style={[localStyles.dateText, { color: colors.icon }]}>
                        {day}
                    </CustomText>
                    <CustomText style={[localStyles.timeText, { color: colors.icon }]}>
                        {time}
                    </CustomText>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSummaryCard = () => {
        return (
            <View style={[localStyles.summaryCard, { backgroundColor: colors.card, alignItems: 'center' }]}>
                <CustomText style={[localStyles.summaryLabel, { color: colors.icon, marginBottom: normalize(8) }]}>
                    {t('budget.history.total_spending')}
                </CustomText>
                <CustomText style={[localStyles.summaryValue, { color: "#FF3B30", fontSize: normalize(24) }]} type="bold">
                    -{formatCurrency(totalExpense)}
                </CustomText>
            </View>
        );
    };

    return (
        <SafeAreaView style={[localStyles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <AppHeader
                title={t('budget.history.title', { category: categoryName || t('budget.detail.default_budget_name') })}
                showBackButton
            />

            <FlatList
                data={transactions}
                keyExtractor={(item, index) => (item.transaction_id || index).toString()}
                renderItem={renderTransactionItem}
                ListHeaderComponent={renderSummaryCard}
                contentContainerStyle={localStyles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.tint}
                    />
                }
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    !loading ? (
                        <View style={localStyles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={60} color={colors.icon} />
                            <CustomText style={{ color: colors.icon, marginTop: 10 }}>{t('budget.history.empty')}</CustomText>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    loadingMore ? (
                        <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.tint} />
                    ) : <View style={{ height: 40 }} />
                }
            />
        </SafeAreaView>
    );
};

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: wp(5),
    },
    summaryCard: {
        borderRadius: normalize(20),
        padding: normalize(20),
        marginBottom: normalize(20),
        marginTop: normalize(10),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: normalize(6),
    },
    summaryLabel: {
        fontSize: normalize(15),
    },
    summaryValue: {
        fontSize: normalize(15),
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: normalize(10),
    },
    transactionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: normalize(16),
        borderRadius: normalize(20),
        marginBottom: normalize(12),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    iconContainer: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(14),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: normalize(12),
    },
    transactionInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    transactionTitle: {
        fontSize: normalize(16),
        marginBottom: normalize(2),
    },
    transactionCategory: {
        fontSize: normalize(13),
        marginBottom: normalize(2),
    },
    cardRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    amountText: {
        fontSize: normalize(16),
        marginBottom: normalize(4),
    },
    dateText: {
        fontSize: normalize(12),
    },
    timeText: {
        fontSize: normalize(12),
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: hp(10),
    },
});

export default BudgetTransactionHistoryScreen;
