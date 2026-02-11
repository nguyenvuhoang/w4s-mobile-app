import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import {
    RecentTransaction,
    useRecentTransactions,
} from "@/features/home/hooks/useRecentTransactions";
import { styles as homeStyles } from "@/features/home/styles/HomeScreen.Style";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { normalize, wp } from "@/utils/layout";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
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

interface TransactionGroup {
    title: string;
    data: RecentTransaction[];
}

const TransactionHistoryScreen: React.FC = () => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const { defaultCurrency } = useDefaultCurrency();

    // Fetch ALL transactions with take = 0
    const {
        transactions,
        loading,
        refresh,
    } = useRecentTransactions(0);

    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    // Format transaction amount with sign
    const formatTransactionAmount = (transaction: RecentTransaction) => {
        const isExpense = transaction.type === "EXPENSE";
        const sign = isExpense ? "-" : "+";
        const formatted = transaction.amount.toLocaleString();
        return `${sign}${formatted} ${defaultCurrency.symbol}`;
    };

    // Format transaction time (time only, since we group by date)
    const formatTransactionTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Format date label for group header
    const formatDateLabel = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        if (date >= today) {
            return t("home.today");
        } else if (date >= yesterday) {
            return t("home.yesterday");
        } else {
            return date.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        }
    };

    // Get category icon
    const getCategoryIcon = (transaction: RecentTransaction): string => {
        if (transaction.icon) return transaction.icon;
        if (transaction.type === "INCOME") return "cash";
        if (transaction.type === "EXPENSE") return "cart";
        return "swap-horizontal";
    };

    // Get category color
    const getCategoryColor = (transaction: RecentTransaction): string => {
        if (transaction.color) return transaction.color;
        if (transaction.type === "INCOME") return "#4CAF50";
        if (transaction.type === "EXPENSE") return "#FF6B6B";
        return "#2196F3";
    };

    // Parse name from JSON string
    const parseName = (name: string | null): string | null => {
        if (!name) return null;
        try {
            const parsed = JSON.parse(name);
            return parsed[i18n.language] || parsed.vi || parsed.en || name;
        } catch {
            return name;
        }
    };

    // Group transactions by date
    const groupedTransactions = useMemo(() => {
        const groups: { [key: string]: RecentTransaction[] } = {};

        transactions.forEach((transaction) => {
            const date = new Date(transaction.occurred_at);
            const dateKey = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            ).toISOString();

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(transaction);
        });

        // Sort groups by date descending
        const sortedKeys = Object.keys(groups).sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );

        return sortedKeys.map((key) => ({
            title: formatDateLabel(key),
            data: groups[key],
        }));
    }, [transactions, i18n.language]);

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

        return (
            <TouchableOpacity
                style={[homeStyles.transactionItem, { backgroundColor: colors.card }]}
                onPress={() => navigateToDetail(item)}
                activeOpacity={0.7}
            >
                <View
                    style={[
                        homeStyles.transactionIcon,
                        { backgroundColor: iconColor + "1A" },
                    ]}
                >
                    <FontAwesome6 name={iconName} size={normalize(24)} color={iconColor} />
                </View>
                <View style={homeStyles.transactionInfo}>
                    <CustomText style={[homeStyles.transactionName, { color: colors.text }]}>
                        {parseName(item.title) || t("home.transaction_default_name")}
                    </CustomText>
                    <CustomText style={[homeStyles.transactionTime, { color: colors.icon }]}>
                        {formatTransactionTime(item.occurred_at)}
                    </CustomText>
                </View>
                <CustomText
                    style={[
                        homeStyles.transactionAmount,
                        isExpense ? homeStyles.expenseText : homeStyles.incomeText,
                    ]}
                >
                    {formatTransactionAmount(item)}
                </CustomText>
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = (title: string) => (
        <View style={localStyles.sectionHeader}>
            <CustomText style={[localStyles.sectionTitle, { color: colors.text }]}>
                {title}
            </CustomText>
        </View>
    );

    const renderContent = () => {
        if (loading && transactions.length === 0) {
            return (
                <View style={localStyles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <CustomText
                        style={[localStyles.emptyText, { color: colors.icon }]}
                    >
                        {t("home.loading_transactions")}
                    </CustomText>
                </View>
            );
        }

        if (transactions.length === 0) {
            return (
                <View style={localStyles.centerContainer}>
                    <Ionicons
                        name="receipt-outline"
                        size={normalize(60)}
                        color={colors.icon}
                    />
                    <CustomText
                        style={[localStyles.emptyText, { color: colors.icon }]}
                    >
                        {t("home.no_transactions")}
                    </CustomText>
                </View>
            );
        }

        return (
            <FlatList
                data={groupedTransactions}
                keyExtractor={(item, index) => `group-${index}`}
                renderItem={({ item: group }) => (
                    <View>
                        {renderSectionHeader(group.title)}
                        {group.data.map((transaction) => (
                            <View key={transaction.transaction_id} style={localStyles.itemWrapper}>
                                {renderTransactionItem({ item: transaction })}
                            </View>
                        ))}
                    </View>
                )}
                contentContainerStyle={localStyles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.tint}
                    />
                }
            />
        );
    };

    return (
        <SafeAreaView
            style={[localStyles.container, { backgroundColor: colors.background }]}
        >
            <AppHeader title={t("transaction_history.title")} />
            {renderContent()}
        </SafeAreaView>
    );
};

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: normalize(100),
    },
    emptyText: {
        marginTop: normalize(12),
        fontSize: normalize(16),
    },
    listContent: {
        paddingBottom: normalize(20),
    },
    sectionHeader: {
        paddingHorizontal: wp(5),
        paddingVertical: normalize(12),
        marginTop: normalize(4),
    },
    sectionTitle: {
        fontSize: normalize(15),
        fontWeight: "600",
        opacity: 0.7,
    },
    itemWrapper: {
        paddingHorizontal: wp(5),
        marginBottom: normalize(8),
    },
});

export default TransactionHistoryScreen;
