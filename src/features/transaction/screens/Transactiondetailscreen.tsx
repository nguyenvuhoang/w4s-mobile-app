import { FontAwesome6 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
import { hp, normalize, wp } from '@/utils/layout';
import { useTransaction } from '../hooks/useTransaction';
import { useTransactionDetail } from '../hooks/useTransactionDetail';

// --- Types ---
interface TransactionDetailScreenProps {
    transactionId?: string;
}

interface Visuals {
    type: string;
    color: string;
    bgColor: string;
    icon: string;
}

// --- Helpers ---
const parseName = (name: string | null, language: string): string | null => {
    if (!name) return null;
    try {
        if (!name.trim().startsWith('{')) return name;
        const parsed = JSON.parse(name);
        return parsed[language] || parsed.vi || parsed.en || name;
    } catch {
        return name;
    }
};

// --- Sub-Components ---

const MenuDropdown = ({
    visible,
    onClose,
    onShare,
    onEdit,
    onDelete,
    onDuplicate,
    colors,
    t
}: any) => {
    if (!visible) return null;

    return (
        <View style={[styles.menuDropdown, { backgroundColor: colors.card, shadowColor: colors.text }]}>
            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { onClose(); onShare(); }}
            >
                <FontAwesome6 name="share-nodes" size={normalize(16)} color={colors.text} />
                <CustomText style={[styles.menuItemText, { color: colors.text }]}>
                    {t('Share') || 'Share'}
                </CustomText>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { onClose(); onEdit(); }}
            >
                <FontAwesome6 name="pen-to-square" size={normalize(16)} color={colors.text} />
                <CustomText style={[styles.menuItemText, { color: colors.text }]}>
                    {t('Edit') || 'Edit'}
                </CustomText>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { onClose(); onDuplicate(); }}
            >
                <FontAwesome6 name="copy" size={normalize(16)} color={colors.text} />
                <CustomText style={[styles.menuItemText, { color: colors.text }]}>
                    {t('Duplicate') || 'Duplicate'}
                </CustomText>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { onClose(); onDelete(); }}
            >
                <FontAwesome6 name="trash-can" size={normalize(16)} color="#EF4444" />
                <CustomText style={[styles.menuItemText, { color: "#EF4444" }]}>
                    {t('Delete') || 'Delete'}
                </CustomText>
            </TouchableOpacity>
        </View>
    );
};

const InfoRow = ({ icon, label, value, colors, badge, badgeColor, small }: any) => (
    <View style={[styles.infoRow, small && styles.infoRowSmall]}>
        <View style={styles.infoLeft}>
            <View style={styles.iconWrapper}>
                <FontAwesome6
                    name={icon}
                    size={normalize(small ? 14 : 16)}
                    color={colors.icon}
                />
            </View>
            <CustomText style={[styles.infoLabel, { color: colors.icon }, small && styles.infoLabelSmall]}>
                {label}
            </CustomText>
        </View>
        <View style={styles.infoRight}>
            {badge && (
                <View style={[styles.badgePill, { backgroundColor: badgeColor + '20' }]}>
                    <CustomText style={[styles.badgeText, { color: badgeColor }]}>
                        {badge}
                    </CustomText>
                </View>
            )}
            <CustomText
                style={[
                    styles.infoValue,
                    { color: colors.text },
                    small && styles.infoValueSmall
                ]}
                numberOfLines={1}
            >
                {value}
            </CustomText>
        </View>
    </View>
);

const TransactionHeaderCard = ({ visuals, transaction, currencyFormatted, colors, statusInfo, language }: any) => {
    const categoryName = parseName(transaction.walletcategory?.category_name || null, language) || visuals.type;

    return (
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
            <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: visuals.bgColor }]}>
                    <FontAwesome6
                        name={visuals.icon}
                        size={normalize(28)}
                        color={visuals.color}
                    />
                </View>

                <View style={styles.headerInfo}>
                    <CustomText style={[styles.categoryName, { color: visuals.color }]}>
                        {categoryName}
                    </CustomText>

                    {/* Primary Amount */}
                    <CustomText style={[
                        styles.amountText,
                        { color: currencyFormatted.color }
                    ]}>
                        {currencyFormatted.primary}
                    </CustomText>

                    {/* Secondary Amount */}
                    {currencyFormatted.secondary && (
                        <CustomText style={[styles.secondaryAmountText, { color: colors.icon }]}>
                            {currencyFormatted.secondary}
                        </CustomText>
                    )}

                    {currencyFormatted.fee && (
                        <CustomText style={[styles.feeText, { color: colors.icon }]}>
                            {currencyFormatted.fee}
                        </CustomText>
                    )}

                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                        <CustomText style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </CustomText>
                    </View>
                </View>
            </View>
        </View>
    );
};

// --- Main Screen ---

const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({ transactionId: propTransactionId }) => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const params = useLocalSearchParams();
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const { defaultCurrency } = useDefaultCurrency();

    // --- ID Resolution ---
    const transactionId = useMemo(() => {
        if (propTransactionId) return propTransactionId;
        if (typeof params.transactionId === 'string') return params.transactionId;

        if (params.transaction) {
            try {
                const derived = JSON.parse(params.transaction as string);
                return derived.transactionid || derived.id;
            } catch (e) {
                console.error("Failed to parse transaction param", e);
            }
        }
        return null;
    }, [propTransactionId, params.transactionId, params.transaction]);

    const { transaction, loading, error, refetch } = useTransactionDetail(transactionId);
    const { deleteTransaction } = useTransaction();

    // --- Formatters ---
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    const formatMoney = (amount: number, code: string) => {
        const symbol = code === defaultCurrency.currencyId ? defaultCurrency.symbol : code;
        if (code === 'VND') return `${amount.toLocaleString('vi-VN')} ${symbol}`;
        return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // --- Logic & Memos ---

    const statusInfo = useMemo(() => {
        const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
            'C': { label: t('Completed') || 'Completed', color: '#10B981', bgColor: colors.background },
            'N': { label: t('New') || 'New', color: '#3B82F6', bgColor: colors.background },
            'R': { label: t('Rejected') || 'Rejected', color: '#F59E0B', bgColor: colors.background },
            'F': { label: t('Failed') || 'Failed', color: '#EF4444', bgColor: colors.background },
        };
        return statusMap[transaction?.status || 'N'] || statusMap['N'];
    }, [transaction?.status, t, colors.background]);

    const visuals = useMemo((): Visuals => {
        let res = {
            type: t('Transaction') || 'Transaction',
            color: '#6B7280',
            bgColor: '#F3F4F6',
            icon: 'receipt',
        };

        const code = transaction?.transactioncode;
        if (code === '01') {
            res = { type: t('Income') || 'Income', color: '#10B981', bgColor: '#D1FAE5', icon: 'arrow-trend-up' };
        } else if (code === '02') {
            res = { type: t('Expense') || 'Expense', color: '#EF4444', bgColor: '#FEE2E2', icon: 'arrow-trend-down' };
        } else if (code === 'WALLET_OPENING') {
            res = { type: t('Wallet Opening') || 'Wallet Opening', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'wallet' };
        }

        const cat = transaction?.walletcategory;
        if ((code === '01' || code === '02') && cat) {
            if (cat.color) {
                res.color = cat.color;
                res.bgColor = cat.color + '20';
            }
            if (cat.icon) res.icon = cat.icon;
        }
        return res;
    }, [transaction, t]);

    const currencyInfo = useMemo(() => {
        if (!transaction) return {};
        const baseAmount = transaction.amountbase || 0;
        const amount = transaction.amount || 0;
        const fee = transaction.fee || 0;
        const isExpense = transaction.transactioncode === '02';
        const baseCcy = defaultCurrency.currencyId;
        const transCcy = transaction.ccyid || 'VND';

        const primaryPrefix = (transCcy !== baseCcy ? '≈ ' : '') + (isExpense ? '- ' : '');

        return {
            primary: `${primaryPrefix}${formatMoney(baseAmount, baseCcy)}`,
            secondary: transCcy !== baseCcy ? formatMoney(amount, transCcy) : null,
            fee: fee > 0 ? `${t('Fee')}: ${formatMoney(fee, transCcy)}` : null,
            color: isExpense ? '#EF4444' : '#10B981',
            baseAmount,
            amount,
            transCcy
        };
    }, [transaction, defaultCurrency, t]);

    // --- Actions ---

    const handleShare = async () => {
        try {
            const shareAmount = formatMoney(transaction?.amount || 0, transaction?.ccyid || 'VND');
            const category = parseName(transaction?.walletcategory?.category_name || null, i18n.language) || 'N/A';
            const date = formatDate(transaction?.transactiondate || '');

            const message = [
                `${t('Transaction Details') || 'Transaction Details'}`,
                ``,
                `${t('Type')}: ${visuals.type}`,
                `${t('Amount')}: ${shareAmount}`,
                `${t('Category')}: ${category}`,
                `${t('Date')}: ${date}`,
                `${t('ID')}: ${transaction?.transactionid}`
            ].join('\n');

            await Share.share({ message });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            t('Delete Transaction') || 'Delete Transaction',
            t('Are you sure you want to delete this transaction? This action cannot be undone.') || 'Are you sure?',
            [
                { text: t('Cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('Delete') || 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (transactionId) {
                            try {
                                await deleteTransaction(transactionId);
                                Alert.alert(t('Success') || 'Thành công', t('Transaction deleted successfully') || 'Đã xóa giao dịch');
                                router.back();
                            } catch (err) {
                                console.error('Delete transaction failed:', err);
                                Alert.alert(t('Error') || 'Lỗi', t('Could not delete transaction') || 'Không thể xóa giao dịch');
                            }
                        }
                    }
                },
            ]
        );
    };

    const handleEdit = () => console.log('Edit transaction:', transactionId);
    const handleDuplicate = () => console.log('Duplicate transaction:', transactionId);


    // --- Render States ---

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <AppHeader title={t('Transaction Details') || 'Transaction Details'} showBackButton />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <CustomText style={[styles.loadingText, { color: colors.icon }]}>
                        {t('Loading transaction details...') || 'Loading...'}
                    </CustomText>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !transaction) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <AppHeader title={t('Transaction Details') || 'Transaction Details'} showBackButton />
                <View style={styles.centerContent}>
                    <View style={[styles.errorIcon, { backgroundColor: colors.card }]}>
                        <FontAwesome6 name="circle-exclamation" size={normalize(48)} color="#EF4444" />
                    </View>
                    <CustomText style={[styles.errorTitle, { color: colors.text }]}>
                        {t('Transaction Not Found') || 'Transaction Not Found'}
                    </CustomText>
                    <CustomText style={[styles.errorText, { color: colors.icon }]}>
                        {error || t('The transaction you are looking for does not exist or has been deleted.')}
                    </CustomText>
                    <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.tint }]} onPress={refetch}>
                        <FontAwesome6 name="rotate-right" size={normalize(16)} color="#FFFFFF" />
                        <CustomText style={styles.retryButtonText}>{t('Retry') || 'Retry'}</CustomText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Badge Logic for Info Section
    const typeBadge = (() => {
        const type = transaction.walletcategory?.category_type;
        if (!type) return null;
        const badges: Record<string, { label: string, color: string }> = {
            'INCOME': { label: t('Income') || 'Income', color: '#10B981' },
            'EXPENSE': { label: t('Expense') || 'Expense', color: '#EF4444' },
            'LOAN': { label: t('Loan') || 'Loan', color: '#F59E0B' }
        };
        return badges[type];
    })();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <AppHeader
                title={t('Transaction Details') || 'Transaction Details'}
                showBackButton
                rightComponent={
                    <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(!showMenu)}>
                        <FontAwesome6 name="ellipsis-vertical" size={normalize(20)} color={colors.text} />
                    </TouchableOpacity>
                }
            />

            <MenuDropdown
                visible={showMenu}
                onClose={() => setShowMenu(false)}
                onShare={handleShare}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                colors={colors}
                t={t}
            />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TransactionHeaderCard
                    visuals={visuals}
                    transaction={transaction}
                    currencyFormatted={currencyInfo}
                    colors={colors}
                    statusInfo={statusInfo}
                    language={i18n.language}
                />

                <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                    <View style={styles.cardHeader}>
                        <FontAwesome6 name="circle-info" size={normalize(18)} color={colors.tint} />
                        <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
                            {t('Transaction Information') || 'Transaction Information'}
                        </CustomText>
                    </View>

                    <InfoRow
                        icon="hashtag"
                        label={t('Transaction ID') || 'Transaction ID'}
                        value={transaction.transactionid || 'N/A'}
                        colors={colors}
                    />
                    <InfoRow
                        icon="calendar-days"
                        label={t('Date & Time') || 'Date & Time'}
                        value={formatDate(transaction.transactiondate)}
                        colors={colors}
                    />
                    <InfoRow
                        icon="layer-group"
                        label={t('Category') || 'Category'}
                        value={parseName(transaction.walletcategory?.category_name || null, i18n.language) || 'N/A'}
                        colors={colors}
                        badge={typeBadge?.label}
                        badgeColor={typeBadge?.color}
                    />
                    <InfoRow
                        icon="wallet"
                        label={t('Wallet') || 'Wallet'}
                        value={transaction.walletprofile?.wallet_name || 'N/A'}
                        colors={colors}
                    />
                    <InfoRow
                        icon="coins"
                        label={t('Amount') || 'Amount'}
                        value={currencyInfo.secondary || currencyInfo.primary?.replace(/[≈-]/g, '').trim()} // Show raw amount
                        colors={colors}
                    />
                </View>

                {transaction.trandesc ? (
                    <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                        <View style={styles.cardHeader}>
                            <FontAwesome6 name="note-sticky" size={normalize(18)} color={colors.tint} />
                            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
                                {t('Note') || 'Note'}
                            </CustomText>
                        </View>
                        <CustomText style={[styles.descriptionText, { color: colors.text }]}>
                            {transaction.trandesc}
                        </CustomText>
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp(10) },
    loadingText: { marginTop: hp(2), fontSize: normalize(14) },
    errorIcon: { width: normalize(96), height: normalize(96), borderRadius: normalize(48), alignItems: 'center', justifyContent: 'center', marginBottom: hp(2) },
    errorTitle: { fontSize: normalize(20), fontWeight: '700', marginBottom: hp(1), textAlign: 'center' },
    errorText: { fontSize: normalize(14), textAlign: 'center', lineHeight: normalize(20), marginBottom: hp(3) },
    retryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: normalize(24), paddingVertical: normalize(12), borderRadius: normalize(12), gap: normalize(8) },
    retryButtonText: { color: '#FFFFFF', fontSize: normalize(15), fontWeight: '600' },

    // Header
    menuButton: { padding: normalize(8), borderRadius: normalize(8) },
    menuDropdown: { position: 'absolute', top: hp(8), right: wp(5), borderRadius: normalize(12), paddingVertical: normalize(8), minWidth: normalize(160), shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, zIndex: 1000 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: normalize(16), paddingVertical: normalize(12), gap: normalize(12) },
    menuItemText: { fontSize: normalize(15), fontWeight: '500' },
    menuDivider: { height: 1, marginVertical: normalize(4) },

    // Scroll
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: hp(5) },

    // Header Card
    headerCard: { marginHorizontal: wp(5), marginTop: hp(2), padding: normalize(20), borderRadius: normalize(20), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    headerContent: { flexDirection: 'row', alignItems: 'flex-start', gap: normalize(16) },
    iconContainer: { width: normalize(56), height: normalize(56), borderRadius: normalize(28), alignItems: 'center', justifyContent: 'center' },
    headerInfo: { flex: 1, gap: normalize(6) },
    categoryName: { fontSize: normalize(14), fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    amountText: { fontSize: normalize(28), fontWeight: '800', letterSpacing: -0.5 },
    secondaryAmountText: { fontSize: normalize(14), fontWeight: '500' },
    feeText: { fontSize: normalize(13) },
    statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: normalize(12), paddingVertical: normalize(6), borderRadius: normalize(100), gap: normalize(6), marginTop: normalize(4) },
    statusDot: { width: normalize(8), height: normalize(8), borderRadius: normalize(4) },
    statusText: { fontSize: normalize(13), fontWeight: '700' },

    // Info Card
    infoCard: { marginHorizontal: wp(5), marginTop: hp(2), padding: normalize(20), borderRadius: normalize(20), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: normalize(8), marginBottom: hp(2) },
    sectionTitle: { fontSize: normalize(17), fontWeight: '700' },
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: normalize(12), borderBottomWidth: 0.5, borderBottomColor: 'rgba(128, 128, 128, 0.1)' },
    infoRowSmall: { paddingVertical: normalize(10) },
    infoLeft: { flexDirection: 'row', alignItems: 'center', gap: normalize(12), flex: 1 },
    iconWrapper: { width: normalize(28), alignItems: 'center' },
    infoLabel: { fontSize: normalize(14), fontWeight: '500' },
    infoLabelSmall: { fontSize: normalize(13) },
    infoRight: { flexDirection: 'row', alignItems: 'center', gap: normalize(8), flex: 1.2, justifyContent: 'flex-end' },
    infoValue: { fontSize: normalize(14), fontWeight: '600', textAlign: 'right', flexShrink: 1 },
    infoValueSmall: { fontSize: normalize(12) },
    badgePill: { paddingHorizontal: normalize(8), paddingVertical: normalize(4), borderRadius: normalize(6) },
    badgeText: { fontSize: normalize(10), fontWeight: '700', textTransform: 'uppercase' },
    descriptionText: { fontSize: normalize(15), lineHeight: normalize(24) },
});

export default TransactionDetailScreen;