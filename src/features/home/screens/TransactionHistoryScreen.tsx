import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import WalletPickerModal from "@/components/modals/WalletPickerModal";
import { GlobalContext } from "@/contexts/GlobalContext";
import { Fonts } from "@/core/theme/font";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useInfiniteTransactions } from "@/features/home/hooks/useInfiniteTransactions";
import { RecentTransaction } from "@/features/home/hooks/useRecentTransactions";
import { styles as homeStyles } from "@/features/home/styles/HomeScreen.Style";
import { useCategory } from "@/hooks/useCategory";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { getValidIconName } from "@/utils/iconMapper";
import { normalize, wp } from "@/utils/layout";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles as localStyles } from "../styles/TransactionHistoryScreen.styles";

interface TransactionGroup {
    title: string;
    data: RecentTransaction[];
}

const TransactionHistoryScreen: React.FC = () => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const { defaultCurrency } = useDefaultCurrency();
    const { convertBetween, formatAmount } = useCurrencyConverter();

    // Ensure categories are fetched to populate the cache
    useCategory({ autoFetch: true });

    const { wallets } = React.useContext(GlobalContext);
    const [selectedWalletId, setSelectedWalletId] = React.useState<number | "all">("all");
    const [isWalletPickerVisible, setIsWalletPickerVisible] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("");
    const [isSearchVisible, setIsSearchVisible] = React.useState(false);

    // Debounce search query
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const currentWallet = React.useMemo(() =>
        wallets.find(w => w.walletId === selectedWalletId),
        [wallets, selectedWalletId]);

    const {
        transactions,
        totalCount,
        loading,
        loadingMore,
        hasMore,
        refresh,
        loadMore,
    } = useInfiniteTransactions(
        10,
        selectedWalletId === "all" ? undefined : selectedWalletId,
        debouncedSearchQuery
    );

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

    // Format transaction amount with sign
    const formatTransactionAmount = (transaction: RecentTransaction) => {
        const isExpense = transaction.type === "EXPENSE";
        const sign = isExpense ? "-" : "+";

        const itemCurrency = transaction.currency || "VND";
        let finalAmount = transaction.amount;

        if (itemCurrency !== defaultCurrency.currencyId) {
            const converted = convertBetween(transaction.amount, itemCurrency, defaultCurrency.currencyId);
            if (converted !== null) finalAmount = converted;
        }

        return `${sign}${formatAmount(finalAmount)}`;
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
                    <AppIcon name={iconName} size={normalize(24)} color={iconColor} />
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

    const renderFooter = () => {
        if (!loadingMore) return null;

        return (
            <View style={localStyles.footerLoader}>
                <ActivityIndicator size="small" color={colors.tint} />
                <CustomText style={[localStyles.footerText, { color: colors.icon }]}>
                    {t("common.loading")}...
                </CustomText>
            </View>
        );
    };

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
                        {group.data.map((transaction, index) => (
                            <View key={`${transaction.transaction_id}-${index}`} style={localStyles.itemWrapper}>
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
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
            />
        );
    };

    return (
        <SafeAreaView
            style={[localStyles.container, { backgroundColor: colors.background }]}
        >
            <AppHeader title={t("transaction_history.title")} />

            <View style={localStyles.topBar}>
                <TouchableOpacity
                    style={[localStyles.walletSelector, { backgroundColor: colors.card }]}
                    onPress={() => setIsWalletPickerVisible(true)}
                    activeOpacity={0.7}
                >
                    <View style={[localStyles.walletIconContainer, { backgroundColor: (currentWallet?.color || colors.tint) + "22" }]}>
                        <AppIcon
                            name={selectedWalletId === "all" ? "layer-group" : (currentWallet?.icon || "wallet")}
                            size={normalize(12)}
                            color={currentWallet?.color || colors.tint}
                        />
                    </View>
                    <CustomText style={[localStyles.walletName, { color: colors.text }]} numberOfLines={1}>
                        {selectedWalletId === "all"
                            ? t("wallet.all_wallets")
                            : currentWallet?.name || t("wallet.all_wallets")
                        }
                    </CustomText>
                    <Ionicons name="chevron-down" size={normalize(16)} color={colors.icon} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[localStyles.searchButton, { backgroundColor: colors.card }]}
                    onPress={() => {
                        if (isSearchVisible) setSearchQuery("");
                        setIsSearchVisible(!isSearchVisible);
                    }}
                >
                    <Ionicons name={isSearchVisible ? "close" : "search"} size={normalize(20)} color={colors.icon} />
                </TouchableOpacity>
            </View>

            {isSearchVisible && (
                <View style={localStyles.searchContainer}>
                    <TextInput
                        style={[localStyles.searchInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                        placeholder={t("common.search")}
                        placeholderTextColor={colors.icon}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                    {searchQuery !== debouncedSearchQuery && (
                        <ActivityIndicator 
                            size="small" 
                            color={colors.tint} 
                            style={{ position: 'absolute', right: wp(7), top: normalize(10) }} 
                        />
                    )}
                </View>
            )}

            {renderContent()}

            <WalletPickerModal
                visible={isWalletPickerVisible}
                wallets={wallets}
                selectedId={selectedWalletId}
                onSelect={(id) => {
                    setSelectedWalletId(id);
                    setIsWalletPickerVisible(false);
                }}
                onClose={() => setIsWalletPickerVisible(false)}
                title={t("wallet.select_wallet")}
            />
        </SafeAreaView>
    );
};



export default TransactionHistoryScreen;
