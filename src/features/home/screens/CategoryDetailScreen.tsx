import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
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

// Generate mock transactions based on category data
const generateMockTransactions = (category: CategoryDetailData): CategoryTransaction[] => {
    const mockData: CategoryTransaction[] = [
        {
            id: '1',
            name: 'Quần áo',
            icon: 'shirt',
            iconColor: '#4CAF50',
            date: new Date().toISOString(),
            amount: 89000,
        },
        {
            id: '2',
            name: 'Mỹ phẩm',
            icon: 'spray-can-sparkles',
            iconColor: '#FF6B6B',
            date: new Date(Date.now() - 86400000).toISOString(),
            amount: 800000,
        },
        {
            id: '3',
            name: 'Shopee',
            icon: 'bag-shopping',
            iconColor: '#FF9800',
            date: new Date(Date.now() - 86400000).toISOString(),
            amount: 26000,
        },
        {
            id: '4',
            name: 'Nội Thất',
            icon: 'couch',
            iconColor: '#2196F3',
            date: '2025-01-06T14:30:00',
            amount: 333000,
        },
    ];
    return mockData;
};

const CategoryDetailScreen: React.FC = () => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const params = useLocalSearchParams();
    const { defaultCurrency } = useDefaultCurrency();

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

    // Format currency
    const formatCurrency = (amount: number) => {
        return `${amount.toLocaleString()} ${defaultCurrency.symbol}`;
    };

    // Format transaction time
    const formatTransactionTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        const timeStr = date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });

        if (date >= today) {
            return `${t('home.today')}, ${timeStr}`;
        } else if (date >= yesterday) {
            return `${t('home.yesterday')}, ${timeStr}`;
        } else {
            return `${date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })}, ${timeStr}`;
        }
    };

    // Mock transactions
    const transactions = useMemo(() => {
        if (!category) return [];
        return generateMockTransactions(category);
    }, [category]);

    // Calculate total budget (mock: use total_amount / percentage)
    const totalBudget = useMemo(() => {
        if (!category || category.percentage === 0) return category?.total_amount || 0;
        return Math.round(category.total_amount / category.percentage);
    }, [category]);

    if (!category) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <AppHeader title={t('home.category_detail_title') || 'Chi tiết Nhóm'} showBackButton />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <CustomText style={{ color: colors.text }}>
                        {t('home.category_not_found') || 'Không tìm thấy danh mục'}
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
                title={t('home.category_detail_title') || 'Chi tiết Nhóm'}
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
                                {category.transaction_count} {t('home.transactions_count') || 'Giao dịch'} - Chiếm{' '}
                                <CustomText style={[styles.categoryMetaBold, { color: colors.text }]}>
                                    {percentDisplay}%
                                </CustomText>
                                {' '}tổng chi tiêu
                            </CustomText>
                        </View>
                    </View>

                    {/* Total Amount */}
                    <CustomText style={[styles.totalAmount, { color: colors.text }]}>
                        {formatCurrency(category.total_amount)}
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
                        {category.total_amount.toLocaleString()} / {totalBudget.toLocaleString()}
                    </CustomText>
                </View>

                {/* Transaction List Section */}
                <View style={styles.transactionSection}>
                    <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
                        {t('home.category_transactions') || 'Các giao dịch'}
                    </CustomText>

                    <View style={styles.transactionList}>
                        {transactions.map((transaction) => (
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
                                    <CustomText style={[styles.transactionName, { color: colors.text }]}>
                                        {transaction.name}
                                    </CustomText>
                                    <CustomText style={[styles.transactionTime, { color: colors.icon }]}>
                                        {formatTransactionTime(transaction.date)}
                                    </CustomText>
                                </View>
                                <CustomText style={styles.transactionAmount}>
                                    -{formatCurrency(transaction.amount)}
                                </CustomText>
                            </TouchableOpacity>
                        ))}
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
