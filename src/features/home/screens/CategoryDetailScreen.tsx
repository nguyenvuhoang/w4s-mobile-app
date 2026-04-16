import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Category data passed from HomeScreen
interface CategoryDetailData {
    category_id: number;
    name: string;
    icon: string;
    color: string;
    transaction_count: number;
    total_amount: number;
    percentage: number;
}

// Mock transaction for the category detail
interface CategoryTransaction {
    id: string;
    name: string;
    icon: string;
    iconColor: string;
    date: string;
    amount: number;
}

import { useTransaction } from '@/features/transaction/hooks/useTransaction';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useEffect, useState } from 'react';

const CategoryDetailScreen: React.FC = () => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const params = useLocalSearchParams();
    const { defaultCurrency } = useDefaultCurrency();
    const { advancedSearchTransactions } = useTransaction();
    const { convertBetween, formatAmount, convertFromVND, isReady: converterReady } = useCurrencyConverter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    // Parse category data from params
    const category = useMemo((): CategoryDetailData | null => {
        if (params.category) {
            try {
                return JSON.parse(params.category as string);
            } catch (e) {
                console.error('Failed to parse category data', e);
            }
        }
        return null;
    }, [params.category]);

    // Parse name from JSON string format: {"vi":"Tên","en":"Name"}
    const parseName = (name: string | null): string | null => {
        if (!name) return null;
        try {
            if (!name.startsWith('{')) return name;
            const parsed = JSON.parse(name);
            return parsed[i18n.language] || parsed.vi || parsed.en || name;
        } catch {
            return name;
        }
    };

    // Format currency using hook
    const formatCurrency = (amount: number, currencyCode?: string) => {
        let finalAmount = amount;
        const targetCurrency = defaultCurrency.currencyId;
        
        if (converterReady && currencyCode && currencyCode !== targetCurrency) {
            const converted = convertBetween(amount, currencyCode, targetCurrency);
            if (converted !== null) finalAmount = converted;
        } else if (converterReady && !currencyCode) {
            // Assume VND if no currency code provided for summary totals
            finalAmount = convertFromVND(amount);
        }
        
        return formatAmount(finalAmount);
    };

    // Format transaction time
    const formatTransactionTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        const timeStr = date.toLocaleTimeString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });

        if (date >= today) {
            return `${t('home.today')}, ${timeStr}`;
        } else if (date >= yesterday) {
            return `${t('home.yesterday')}, ${timeStr}`;
        } else {
            return `${date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })}, ${timeStr}`;
        }
    };

    useEffect(() => {
        if (!category) return;

        const parseTransactionName = (name: string | null): string => {
            if (!name) return t('home.transaction_default_name');
            try {
                if (!name.startsWith('{')) return name;
                const parsed = JSON.parse(name);
                return parsed[i18n.language] || parsed.vi || parsed.en || name;
            } catch {
                return name;
            }
        };

        const fetchTransactions = async () => {
            setLoadingTransactions(true);
            try {
                const currentDate = new Date();
                const currentMonthStartDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
                const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                const currentMonthEndDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

                const data = await advancedSearchTransactions({
                    category_id: category.category_id,
                    from_transaction_date: currentMonthStartDate,
                    to_transaction_date: currentMonthEndDate,
                    page_index: 0,
                    page_size: 100
                });

                console.log("data ===========", JSON.stringify(data));

                let txArray: any[] = [];
                const anyData = data as any;

                if (anyData) {
                    if (Array.isArray(anyData)) {
                        txArray = anyData;
                    } else if (anyData.items && Array.isArray(anyData.items)) {
                        txArray = anyData.items;
                    } else if (anyData.data && Array.isArray(anyData.data)) {
                        txArray = anyData.data;
                    }
                }

                if (Array.isArray(txArray)) {
                    const mappedTransactions = txArray.map((tx: any) => ({
                        id: tx.transaction_id || tx.id,
                        name: parseTransactionName(tx.title || tx.name || ""),
                        category_name: categoryName,
                        description: parseTransactionName(tx.description || tx.transaction_description || ""),
                        icon: tx.icon || category.icon || 'tag',
                        iconColor: tx.color || category.color || '#9E9E9E',
                        date: tx.occurred_at || tx.recorded_at || tx.transaction_date,
                        amount: tx.amount,
                        currency: tx.currency || 'VND',
                    }));
                    setTransactions(mappedTransactions);
                }
            } catch (error) {
                console.error('Failed to fetch category transactions:', error);
            } finally {
                setLoadingTransactions(false);
            }
        };

        fetchTransactions();
    }, [category, i18n.language]);

    // Calculate a precise converted total by summing individually converted transaction amounts
    const { displayTotal, displayBudget } = useMemo(() => {
        if (!converterReady || transactions.length === 0) {
            // Fallback to converting the static total if no transactions are loaded yet
            const fallbackTotal = converterReady ? convertFromVND(category?.total_amount || 0) : (category?.total_amount || 0);
            const fallbackBudget = category?.percentage && category.percentage > 0 
                ? fallbackTotal / category.percentage 
                : fallbackTotal;
            return { displayTotal: fallbackTotal, displayBudget: fallbackBudget };
        }

        let sum = 0;
        transactions.forEach(tx => {
            const converted = convertBetween(tx.amount, tx.currency, defaultCurrency.currencyId);
            sum += (converted !== null ? converted : tx.amount);
        });

        const budget = category?.percentage && category.percentage > 0 
            ? sum / category.percentage 
            : sum;

        return { displayTotal: sum, displayBudget: budget };
    }, [transactions, converterReady, defaultCurrency.currencyId, category?.percentage]);

    if (!category) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <AppHeader title={t('home.category_detail_title')} showBackButton />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <CustomText style={{ color: colors.text }}>
                        {t('home.category_not_found')}
                    </CustomText>
                </View>
            </SafeAreaView>
        );
    }

    const categoryName = parseName(category.name) || t('home.uncategorized');
    const percentDisplay = Math.round(category.percentage * 100);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <AppHeader
                title={t('home.category_detail_title')}
                showBackButton
                showBorder={false}
            />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Category Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                    {/* Category Info Row */}
                    <View style={styles.categoryInfoRow}>
                        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                            <FontAwesome6
                                name={category.icon || 'tag'}
                                size={normalize(22)}
                                color="#fff"
                            />
                        </View>
                        <View style={styles.categoryInfo}>
                            <CustomText style={[styles.categoryName, { color: colors.text }]}>
                                {categoryName}
                            </CustomText>
                            <CustomText style={[styles.categoryMeta, { color: colors.icon }]}>
                                {category.transaction_count} {t('home.transactions_count')} - {t('home.occupied')}{' '}
                                <CustomText style={[styles.categoryMetaBold, { color: colors.text }]}>
                                    {percentDisplay}%
                                </CustomText>
                                {' '}{t('home.total_spending')}
                            </CustomText>
                        </View>
                    </View>

                    {/* Total Amount */}
                    <CustomText style={[styles.totalAmount, { color: colors.text }]}>
                        {formatAmount(displayTotal)}
                    </CustomText>

                    {/* Progress Bar */}
                    <View style={[styles.progressBarContainer, { backgroundColor: colors.background }]}>
                        <View
                            style={[
                                styles.progressBar,
                                {
                                    width: `${Math.min(category.percentage * 100, 100)}%`,
                                    backgroundColor: category.color,
                                },
                            ]}
                        />
                    </View>

                    {/* Budget Text */}
                    <CustomText style={[styles.budgetText, { color: colors.icon }]}>
                        {formatAmount(displayTotal)} / {formatAmount(displayBudget)}
                    </CustomText>
                </View>

                {/* Transaction List Section */}
                <View style={styles.transactionSection}>
                    <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
                        {t('home.category_transactions')}
                    </CustomText>

                    <View style={styles.transactionList}>
                        {loadingTransactions ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <CustomText style={{ color: colors.icon }}>{t('home.loading_transactions')}</CustomText>
                            </View>
                        ) : transactions.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <CustomText style={{ color: colors.icon }}>{t('home.no_transactions')}</CustomText>
                            </View>
                        ) : (
                            transactions.map((transaction) => (
                                <TouchableOpacity
                                    key={transaction.id}
                                    style={[styles.transactionItem, { backgroundColor: colors.card }]}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        const detailData = {
                                            transactionid: transaction.id,
                                            transactiondate: transaction.date,
                                            transactionname: transaction.name,
                                            transactioncode: '02', // Expense
                                            nu_m01: transaction.amount,
                                            nu_m02: 0,
                                            ccyid: defaultCurrency.currencyId,
                                            cha_r01: '',
                                            cha_r02: '',
                                            sourcetranref: '',
                                            sourceid: '',
                                            trandesc: transaction.name,
                                            status: 'Completed',
                                            icon: transaction.icon,
                                            color: transaction.iconColor,
                                        };
                                        router.push({
                                            pathname: '/(protected)/transaction-detail',
                                            params: { transaction: JSON.stringify(detailData) },
                                        });
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.transactionIcon,
                                            { backgroundColor: transaction.iconColor + '1A' },
                                        ]}
                                    >
                                        <FontAwesome6
                                            name={transaction.icon}
                                            size={normalize(20)}
                                            color={transaction.iconColor}
                                        />
                                    </View>
                                    <View style={styles.transactionInfo}>
                                        <CustomText style={[styles.transactionName, { color: colors.text }]} type="semiBold">
                                            {transaction.category_name}
                                        </CustomText>
                                        {transaction.description ? (
                                            <CustomText style={[styles.transactionTime, { color: colors.text, opacity: 0.8 }]} numberOfLines={1}>
                                                {transaction.description}
                                            </CustomText>
                                        ) : (transaction.name && transaction.name !== transaction.category_name) ? (
                                            <CustomText style={[styles.transactionTime, { color: colors.text, opacity: 0.8 }]} numberOfLines={1}>
                                                {transaction.name}
                                            </CustomText>
                                        ) : null}
                                        <CustomText style={[styles.transactionTime, { color: colors.icon }]}>
                                            {formatTransactionTime(transaction.date)}
                                        </CustomText>
                                    </View>
                                    <CustomText style={styles.transactionAmount}>
                                        -{formatCurrency(transaction.amount, transaction.currency)}
                                    </CustomText>
                                </TouchableOpacity>
                            )))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: hp(5),
    },
    // Summary Card
    summaryCard: {
        marginHorizontal: wp(5),
        marginTop: hp(1),
        padding: normalize(20),
        borderRadius: normalize(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    categoryInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(12),
        marginBottom: normalize(16),
    },
    categoryIcon: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: normalize(17),
        fontWeight: '700',
        marginBottom: normalize(3),
    },
    categoryMeta: {
        fontSize: normalize(13),
        lineHeight: normalize(18),
    },
    categoryMetaBold: {
        fontWeight: '700',
        fontSize: normalize(13),
    },
    totalAmount: {
        fontSize: normalize(28),
        fontWeight: '700',
        marginBottom: normalize(12),
    },
    progressBarContainer: {
        height: normalize(8),
        borderRadius: normalize(4),
        overflow: 'hidden',
        marginBottom: normalize(8),
    },
    progressBar: {
        height: '100%',
        borderRadius: normalize(4),
    },
    budgetText: {
        fontSize: normalize(13),
        textAlign: 'center',
    },
    // Transaction Section
    transactionSection: {
        marginTop: hp(3),
        paddingHorizontal: wp(5),
    },
    sectionTitle: {
        fontSize: normalize(18),
        fontWeight: '700',
        marginBottom: normalize(16),
    },
    transactionList: {
        gap: normalize(12),
    },
    transactionItem: {
        borderRadius: normalize(16),
        padding: normalize(16),
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    transactionIcon: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionInfo: {
        flex: 1,
    },
    transactionName: {
        fontSize: normalize(16),
        fontWeight: '600',
    },
    transactionTime: {
        fontSize: normalize(12),
        marginTop: normalize(3),
    },
    transactionAmount: {
        fontSize: normalize(16),
        fontWeight: '600',
        color: '#FF3B30',
    },
});

export default CategoryDetailScreen;
