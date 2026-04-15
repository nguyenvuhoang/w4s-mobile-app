import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { RecentTransaction } from "@/features/home/hooks/useRecentTransactions";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { getValidIconName } from "@/utils/iconMapper";
import { normalize, wp, hp } from "@/utils/layout";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
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
import { useInvoiceTransactions } from "../hooks/useInvoiceTransactions";

const InvoiceTransactionHistoryScreen: React.FC = () => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const { defaultCurrency } = useDefaultCurrency();
    const params = useLocalSearchParams();
    const billId = Number(params.billId);

    const {
        transactions,
        totalIncome,
        totalExpense,
        loading,
        loadingMore,
        hasMore,
        refresh,
        loadMore,
    } = useInvoiceTransactions(billId);

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
        return `${amount.toLocaleString("vi-VN")} ${defaultCurrency.symbol}`;
    };

    // Format transaction amount with sign
    const formatTransactionAmount = (transaction: RecentTransaction) => {
        const isExpense = transaction.type === "EXPENSE";
        const sign = isExpense ? "-" : "+";
        const formatted = Math.abs(transaction.amount).toLocaleString("vi-VN");
        return `${sign}${formatted} ${defaultCurrency.symbol}`;
    };

    // Format transaction date/time
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
        const time = date.toLocaleTimeString("vi-VN", {
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
                        <FontAwesome6 name={iconName} size={normalize(22)} color={iconColor} />
                    </View>
                    <View style={localStyles.transactionInfo}>
                        <CustomText style={[localStyles.transactionTitle, { color: colors.text }]} type="bold" numberOfLines={1}>
                            {parseName(item.category_name) || "Khác"}
                        </CustomText>
                        {item.description ? (
                            <CustomText style={[localStyles.transactionCategory, { color: colors.icon }]} numberOfLines={1}>
                                {parseName(item.description)}
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
        const total = totalIncome - totalExpense;
        return (
            <View style={[localStyles.summaryCard, { backgroundColor: colors.card }]}>
                <View style={localStyles.summaryRow}>
                    <CustomText style={[localStyles.summaryLabel, { color: colors.text }]}>Tổng thu</CustomText>
                    <CustomText style={[localStyles.summaryValue, { color: "#4CAF50" }]} type="semiBold">
                        +{formatCurrency(totalIncome)}
                    </CustomText>
                </View>
                <View style={localStyles.summaryRow}>
                    <CustomText style={[localStyles.summaryLabel, { color: colors.text }]}>Tổng chi</CustomText>
                    <CustomText style={[localStyles.summaryValue, { color: "#FF3B30" }]} type="semiBold">
                        -{formatCurrency(totalExpense)}
                    </CustomText>
                </View>
                <View style={localStyles.summaryDivider} />
                <View style={localStyles.summaryRow}>
                    <CustomText style={[localStyles.summaryLabel, { color: colors.text }]} type="bold">Số dư hóa đơn</CustomText>
                    <CustomText style={[localStyles.summaryValue, { color: total >= 0 ? "#4CAF50" : "#FF3B30" }]} type="bold">
                        {total >= 0 ? "+" : ""}{formatCurrency(total)}
                    </CustomText>
                </View>
            </View>
        );
    };

    const renderHeader = () => (
        <View style={localStyles.headerContainer}>
             <AppHeader 
                title={"Lịch sử giao dịch định kỳ"} 
                showBackButton
                titleStyle={localStyles.headerTitle as any}
            />
        </View>
    );

    return (
        <SafeAreaView style={[localStyles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {renderHeader()}
            
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.transaction_id.toString()}
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
                             <CustomText style={{ color: colors.icon, marginTop: 10 }}>Chưa có giao dịch cho hóa đơn này</CustomText>
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
    headerContainer: {
        paddingBottom: normalize(10),
    },
    headerTitle: {
        fontSize: normalize(18),
        textAlign: 'center',
        lineHeight: normalize(24),
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
    transactionNote: {
        fontSize: normalize(12),
        opacity: 0.7,
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

export default InvoiceTransactionHistoryScreen;
