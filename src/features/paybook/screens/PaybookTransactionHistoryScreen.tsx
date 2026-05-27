import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { RecentTransaction } from "@/features/home/hooks/useRecentTransactions";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { getValidIconName } from "@/utils/iconMapper";
import { normalize } from "@/utils/layout";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePaybookTransactions } from "../hooks/usePaybookTransactions";
import { styles } from "../styles/PaybookTransactionHistoryScreen.styles";

const PaybookTransactionHistoryScreen: React.FC = () => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const { defaultCurrency } = useDefaultCurrency();
    const { convertBetween, formatAmount, isReady } = useCurrencyConverter();
    const params = useLocalSearchParams();
    const loanId = Number(params.loanId);

    const {
        transactions,
        totalIncome,
        totalExpense,
        loading,
        loadingMore,
        hasMore,
        refresh,
        loadMore,
    } = usePaybookTransactions(loanId);

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

    // Format currency
    const formatCurrency = (amount: number) => {
        const sourceCurrency = "VND"; 
        const converted = convertBetween(amount, sourceCurrency, defaultCurrency.currencyId);
        if (converted !== null) {
            return formatAmount(converted);
        }
        return formatAmount(amount, sourceCurrency);
    };

    // Format transaction amount with sign
    const formatTransactionAmount = (transaction: RecentTransaction) => {
        const isExpense = transaction.type === "EXPENSE";
        const sign = isExpense ? "-" : "+";
        
        const itemCurrency = transaction.currency || "VND";
        const finalAmount = Math.abs(transaction.amount);
        
        const converted = convertBetween(finalAmount, itemCurrency, defaultCurrency.currencyId);
        if (converted !== null) {
            return `${sign}${formatAmount(converted)}`;
        }
        
        return `${sign}${formatAmount(finalAmount, itemCurrency)}`;
    };

    // Format transaction date/time
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

    // Get category icon
    const getCategoryIcon = (transaction: RecentTransaction): string => {
        let iconName = transaction.icon;
        if (!iconName) {
            if (transaction.type === "INCOME") iconName = "cash";
            else if (transaction.type === "EXPENSE") iconName = "cart";
            else iconName = "swap-horizontal";
        }
        return getValidIconName(iconName);
    };

    // Get category color
    const getCategoryColor = (transaction: RecentTransaction): string => {
        if (transaction.color) return transaction.color;
        if (transaction.type === "INCOME") return "#4CAF50";
        if (transaction.type === "EXPENSE") return "#FF6B6B";
        return "#2196F3";
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

    const navigateToDetail = (transaction: RecentTransaction) => {
        const detailData = {
            transactionid: transaction.transaction_id,
            transactiondate: transaction.occurred_at,
            transactionname: transaction.title,
            transactioncode: transaction.type === "INCOME" ? "01" : "02",
            nu_m01: transaction.amount,
            nu_m02: 0,
            ccyid: transaction.currency || defaultCurrency.currencyId,
            cha_r01: "",
            cha_r02: "",
            sourcetranref: "",
            sourceid: "",
            trandesc: transaction.title,
            status: "Completed",
            icon: getCategoryIcon(transaction),
            color: getCategoryColor(transaction),
        };

        router.push({
            pathname: "/(protected)/transaction-detail",
            params: { transaction: JSON.stringify(detailData) },
        });
    };

    const renderTransactionItem = ({ item }: { item: RecentTransaction }) => {
        const iconName = getCategoryIcon(item);
        const iconColor = getCategoryColor(item);
        const isExpense = item.type === "EXPENSE";
        const { day, time } = formatDateTime(item.occurred_at);

        return (
            <TouchableOpacity
                style={[styles.transactionCard, { backgroundColor: colors.card }]}
                onPress={() => navigateToDetail(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardLeft}>
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: iconColor + "1A" },
                        ]}
                    >
                        <AppIcon name={iconName as any} size={normalize(22)} color={iconColor} />
                    </View>
                    <View style={styles.transactionInfo}>
                        <CustomText style={[styles.transactionTitle, { color: colors.text }]} type="bold" numberOfLines={1}>
                            {parseName(item.category_name) || t('paybook.history.other')}
                        </CustomText>
                        {item.description ? (
                            <CustomText style={[styles.transactionCategory, { color: colors.icon }]} numberOfLines={1}>
                                {parseName(item.description)}
                            </CustomText>
                        ) : (item.title && parseName(item.title) !== parseName(item.category_name)) ? (
                            <CustomText style={[styles.transactionCategory, { color: colors.icon }]} numberOfLines={1}>
                                {parseName(item.title)}
                            </CustomText>
                        ) : null}
                    </View>
                </View>
                <View style={styles.cardRight}>
                    <CustomText
                        style={[
                            styles.amountText,
                            { color: isExpense ? "#FF3B30" : "#4CAF50" }
                        ]}
                        type="bold"
                    >
                        {formatTransactionAmount(item)}
                    </CustomText>
                    <CustomText style={[styles.dateText, { color: colors.icon }]}>
                        {day}
                    </CustomText>
                    <CustomText style={[styles.timeText, { color: colors.icon }]}>
                        {time}
                    </CustomText>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSummaryCard = () => {
        const total = totalIncome - totalExpense;
        return (
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                <View style={styles.summaryRow}>
                    <CustomText style={[styles.summaryLabel, { color: colors.text }]}>{t('paybook.history.income')}</CustomText>
                    <CustomText style={[styles.summaryValue, { color: "#4CAF50" }]} type="semiBold">
                        +{formatCurrency(totalIncome)}
                    </CustomText>
                </View>
                <View style={styles.summaryRow}>
                    <CustomText style={[styles.summaryLabel, { color: colors.text }]}>{t('paybook.history.expense')}</CustomText>
                    <CustomText style={[styles.summaryValue, { color: "#FF3B30" }]} type="semiBold">
                        -{formatCurrency(totalExpense)}
                    </CustomText>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                    <CustomText style={[styles.summaryLabel, { color: colors.text }]} type="bold">{t('paybook.history.summary')}</CustomText>
                    <CustomText style={[styles.summaryValue, { color: total >= 0 ? "#4CAF50" : "#FF3B30" }]} type="bold">
                        {total >= 0 ? "+" : ""}{formatCurrency(total)}
                    </CustomText>
                </View>
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
             <AppHeader 
                title={t('paybook.history.title')} 
                showBackButton
                titleStyle={styles.headerTitle as any}
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {renderHeader()}
            
            {loading || !isReady ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.transaction_id.toString()}
                    renderItem={renderTransactionItem}
                    ListHeaderComponent={renderSummaryCard}
                    contentContainerStyle={styles.listContent}
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
                        <View style={styles.emptyContainer}>
                             <AppIcon name="receipt" size={60} color={colors.icon} />
                             <CustomText style={{ color: colors.icon, marginTop: 10 }}>{t('paybook.history.empty')}</CustomText>
                        </View>
                    }
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.tint} />
                        ) : <View style={{ height: 40 }} />
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default PaybookTransactionHistoryScreen;
