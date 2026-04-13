import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useTopSpendingCategories } from "@/features/home/hooks/useTopSpendingCategories";
import { styles as homeStyles } from "@/features/home/styles/HomeScreen.Style";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { getValidIconName } from "@/utils/iconMapper";
import { normalize, wp } from "@/utils/layout";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback } from "react";
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

const TopSpendingCategoriesScreen: React.FC = () => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const { defaultCurrency } = useDefaultCurrency();

    // Fetch up to 100 categories (practically covering all typical spending categories)
    const {
        categories,
        loading,
        error,
        refresh,
    } = useTopSpendingCategories("M", 100);

    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    // Format currency for display
    const formatCurrency = useCallback((amount: number | undefined) => {
        if (amount === undefined) return "...";
        const formatted = amount.toLocaleString();
        return `${formatted} ${defaultCurrency.symbol}`;
    }, [defaultCurrency.symbol]);

    // Parse name from JSON string format
    const parseName = useCallback((name: string | null): string | null => {
        if (!name) return null;
        try {
            const parsed = JSON.parse(name);
            return parsed[i18n.language] || parsed.vi || parsed.en || name;
        } catch {
            return name;
        }
    }, [i18n.language]);

    const handleCategoryPress = useCallback((category: any) => {
        router.push({
            pathname: '/(protected)/category-detail',
            params: {
                category: JSON.stringify({
                    category_id: category.category_id,
                    name: category.name,
                    icon: getValidIconName(category.icon || 'pricetag-outline'),
                    color: category.color || '#9E9E9E',
                    transaction_count: category.transaction_count,
                    total_amount: category.total_amount,
                    percentage: category.percentage,
                }),
            },
        });
    }, []);

    const renderCategoryItem = ({ item }: { item: any }) => {
        const iconName = getValidIconName(item.icon || "pricetag-outline");
        const iconColor = item.color || "#9E9E9E";
        const name = parseName(item.name) || t("home.uncategorized");
        const transactionsText = `${item.transaction_count} ${t("home.transactions_count")}`;
        const amountText = formatCurrency(item.total_amount);
        const progress = item.percentage;

        return (
            <TouchableOpacity
                style={[homeStyles.categoryItem, { backgroundColor: colors.card, marginBottom: normalize(12) }]}
                onPress={() => handleCategoryPress(item)}
                activeOpacity={0.7}
            >
                <View style={homeStyles.categoryLeft}>
                    <View style={[homeStyles.categoryIcon, { backgroundColor: iconColor }]}>
                        <FontAwesome6 name={iconName} size={normalize(24)} color="#fff" />
                    </View>
                    <View>
                        <CustomText style={[homeStyles.categoryName, { color: colors.text }]}>
                            {name}
                        </CustomText>
                        <CustomText
                            style={[homeStyles.categoryTransactions, { color: colors.icon }]}
                        >
                            {transactionsText}
                        </CustomText>
                    </View>
                </View>
                <CustomText style={[homeStyles.categoryAmount, { color: colors.text }]}>
                    {amountText}
                </CustomText>
                <View
                    style={[
                        homeStyles.progressBarContainer,
                        { backgroundColor: colors.background },
                    ]}
                >
                    <View
                        style={[
                            homeStyles.progressBar,
                            { width: `${progress * 100}%`, backgroundColor: iconColor },
                        ]}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    const renderContent = () => {
        if (loading && categories.length === 0) {
            return (
                <View style={localStyles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <CustomText style={[localStyles.emptyText, { color: colors.icon }]}>
                        {t("home.loading_categories")}
                    </CustomText>
                </View>
            );
        }

        if (error) {
            return (
                <View style={localStyles.centerContainer}>
                    <CustomText style={[localStyles.emptyText, { color: colors.notification || "red" }]}>
                        {error}
                    </CustomText>
                    <TouchableOpacity
                        onPress={refresh}
                        style={{ marginTop: 16, padding: 12, backgroundColor: colors.card, borderRadius: 8 }}
                    >
                        <CustomText style={{ color: colors.text }}>
                            {t("home.retry")}
                        </CustomText>
                    </TouchableOpacity>
                </View>
            );
        }

        if (categories.length === 0) {
            return (
                <View style={localStyles.centerContainer}>
                    <Ionicons
                        name="folder-outline"
                        size={normalize(60)}
                        color={colors.icon}
                    />
                    <CustomText style={[localStyles.emptyText, { color: colors.icon }]}>
                        {t("home.no_spending")}
                    </CustomText>
                </View>
            );
        }

        return (
            <FlatList
                data={categories}
                keyExtractor={(item, index) => `${item.category_id}-${index}`}
                renderItem={renderCategoryItem}
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
            <AppHeader title={t("home.top_spending")} />
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
        paddingHorizontal: wp(5),
        paddingBottom: normalize(20),
        paddingTop: normalize(16),
    },
});

export default TopSpendingCategoriesScreen;
