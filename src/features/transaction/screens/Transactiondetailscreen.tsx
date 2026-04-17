import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
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
    } catch { return name; }
};

// --- Menu Dropdown ---
const MenuDropdown = ({ visible, onClose, onShare, onEdit, onDelete, onRefund, onDuplicate, colors, t }: any) => {
    if (!visible) return null;
    return (
        <View style={[styles.menuDropdown, { backgroundColor: colors.card, shadowColor: colors.text }]}>
            {[
                { icon: 'share-nodes', label: t('Share') || 'Share', onPress: onShare, color: colors.text },
                { icon: 'pen-to-square', label: t('Edit') || 'Edit', onPress: onEdit, color: colors.text },
                { icon: 'copy', label: t('Duplicate') || 'Duplicate', onPress: onDuplicate, color: colors.text },
                { icon: 'arrow-rotate-left', label: t('Refund') || 'Refund', onPress: onRefund, color: colors.text },
                { icon: 'trash-can', label: t('Delete') || 'Delete', onPress: onDelete, color: '#EF4444' },
            ].map((item, i, arr) => (
                <React.Fragment key={item.label}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); item.onPress(); }}>
                        <FontAwesome6 name={item.icon} size={normalize(15)} color={item.color} />
                        <CustomText style={[styles.menuItemText, { color: item.color }]}>{item.label}</CustomText>
                    </TouchableOpacity>
                    {i < arr.length - 1 && <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />}
                </React.Fragment>
            ))}
        </View>
    );
};

// --- Gradient Hero Card (first card in scroll) ---
const GradientHeroCard = ({ visuals, currencyFormatted, transactionCode }: any) => {
    const isIncome = transactionCode === '01';
    const arrowIcon = isIncome ? 'arrow-up' : 'arrow-down';
    const arrowColor = isIncome ? '#10B981' : '#EF4444';

    return (
        <LinearGradient
            colors={['#2563EB', '#1DA1F2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroCard}
        >
            <View style={styles.heroRow}>
                {/* Left: white circle icon + type name */}
                <View style={styles.heroLeft}>
                    <View style={styles.heroIconWrap}>
                        <FontAwesome6 name={arrowIcon} size={normalize(18)} color={arrowColor} solid />
                    </View>
                    <CustomText style={styles.heroTypeName}>{visuals.type}</CustomText>
                </View>

                {/* Right: amount */}
                <CustomText style={styles.heroAmount}>{currencyFormatted.primary}</CustomText>
            </View>

            {(currencyFormatted.secondary || currencyFormatted.fee) && (
                <View style={styles.heroSecondRow}>
                    {currencyFormatted.secondary && (
                        <CustomText style={styles.heroSecondary}>{currencyFormatted.secondary}</CustomText>
                    )}
                    {currencyFormatted.fee && (
                        <CustomText style={styles.heroFee}>{currencyFormatted.fee}</CustomText>
                    )}
                </View>
            )}
        </LinearGradient>
    );
};

// --- Section Label ---
const SectionLabel = ({ label }: { label: string }) => (
    <CustomText style={styles.sectionLabel}>{label}</CustomText>
);

// --- Item Card (icon + label) ---
const ItemCard = ({ icon, iconBg, iconColor, label, colors }: any) => (
    <View style={[styles.itemCard, { backgroundColor: colors.card }]}>
        <View style={[styles.itemIconWrap, { backgroundColor: iconBg }]}>
            <FontAwesome6 name={icon} size={normalize(18)} color={iconColor} solid />
        </View>
        <CustomText style={[styles.itemLabel, { color: colors.text }]}>{label}</CustomText>
    </View>
);

// --- Main Screen ---
const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({ transactionId: propTransactionId }) => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const params = useLocalSearchParams();
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const { defaultCurrency } = useDefaultCurrency();
    const { showNotification } = useNotification();

    const transactionId = useMemo(() => {
        if (propTransactionId) return propTransactionId;
        if (typeof params.transactionId === 'string') return params.transactionId;
        if (params.transaction) {
            try {
                const derived = JSON.parse(params.transaction as string);
                return derived.transactionid || derived.id;
            } catch { }
        }
        return null;
    }, [propTransactionId, params.transactionId, params.transaction]);

    const { transaction, loading, error, refetch } = useTransactionDetail(transactionId);
    const { deleteTransaction, refundTransaction } = useTransaction();

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString(
                i18n.language === 'vi' ? 'vi-VN' : 'en-US',
                { year: 'numeric', month: 'long', day: 'numeric' }
            );
        } catch { return dateString; }
    };

    const formatMoney = (amount: number, code: string) => {
        const symbol = code === defaultCurrency.currencyId ? defaultCurrency.symbol : code;
        if (code === 'VND') return `${amount.toLocaleString('vi-VN')} ${symbol}`;
        return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const statusInfo = useMemo(() => {
        const map: Record<string, { label: string; color: string }> = {
            'C': { label: t('Completed') || 'Hoàn thành', color: '#10B981' },
            'N': { label: t('New') || 'Mới', color: '#3B82F6' },
            'R': { label: t('Rejected') || 'Từ chối', color: '#F59E0B' },
            'F': { label: t('Failed') || 'Thất bại', color: '#EF4444' },
        };
        return map[transaction?.status || 'N'] || map['N'];
    }, [transaction?.status, t]);

    const visuals = useMemo((): Visuals => {
        let res: Visuals = { type: t('Transaction') || 'Giao dịch', color: '#6B7280', bgColor: '#F3F4F6', icon: 'receipt' };
        const code = transaction?.transactioncode;
        if (code === '01') res = { type: t('Income') || 'Thu nhập', color: '#10B981', bgColor: '#D1FAE5', icon: 'arrow-trend-up' };
        else if (code === '02') res = { type: t('Expense') || 'Khoản chi', color: '#EF4444', bgColor: '#FEE2E2', icon: 'arrow-trend-down' };
        else if (code === 'WALLET_OPENING') res = { type: t('Wallet Opening') || 'Mở ví', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'wallet' };
        const cat = transaction?.walletcategory;
        if ((code === '01' || code === '02') && cat) {
            if (cat.color) { res.color = cat.color; res.bgColor = cat.color + '20'; }
            if (cat.icon) res.icon = cat.icon;
        }
        return res;
    }, [transaction, t]);

    const currencyInfo = useMemo(() => {
        if (!transaction) return { primary: '0 đ', secondary: null, fee: null, color: '#6B7280' };
        const baseAmount = transaction.amountbase || 0;
        const amount = transaction.amount || 0;
        const fee = transaction.fee || 0;
        const isExpense = transaction.transactioncode === '02';
        const baseCcy = defaultCurrency.currencyId;
        const transCcy = transaction.ccyid || 'VND';
        return {
            primary: formatMoney(baseAmount, baseCcy),
            secondary: transCcy !== baseCcy ? formatMoney(amount, transCcy) : null,
            fee: fee > 0 ? `${t('Fee')}: ${formatMoney(fee, transCcy)}` : null,
            color: isExpense ? '#EF4444' : '#10B981',
        };
    }, [transaction, defaultCurrency, t]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: [
                    t('Transaction Details') || 'Chi tiết giao dịch',
                    `${t('Type')}: ${visuals.type}`,
                    `${t('Amount')}: ${currencyInfo.primary}`,
                    `${t('Date')}: ${formatDate(transaction?.transactiondate || '')}`,
                    `ID: ${transaction?.transactionid}`,
                ].join('\n'),
            });
        } catch { }
    };

    const handleDelete = () => {
        showNotification(
            t('Are you sure you want to delete this transaction? This action cannot be undone.') || 'Bạn có chắc muốn xóa?',
            'warning', undefined, undefined,
            async () => {
                if (!transactionId) return;
                try {
                    await deleteTransaction(transactionId);
                    showNotification(t('Transaction deleted successfully') || 'Đã xóa', 'success');
                    router.back();
                } catch {
                    showNotification(t('Could not delete transaction') || 'Không thể xóa', 'error');
                }
            }
        );
    };

    const handleRefund = () => {
        showNotification(
            t('Are you sure you want to refund this transaction?') || 'Bạn có chắc muốn hoàn tiền?',
            'warning', undefined, undefined,
            async () => {
                if (!transactionId) return;
                try {
                    await refundTransaction(transactionId);
                    showNotification(t('Transaction refunded successfully') || 'Đã hoàn tiền', 'success');
                    router.back();
                } catch {
                    showNotification(t('Could not refund transaction') || 'Không thể hoàn tiền', 'error');
                }
            }
        );
    };

    const handleEdit = () => {
        if (!transactionId) return;
        router.push({
            pathname: '/(protected)/edit-transaction',
            params: { transactionId },
        });
    };
    const handleDuplicate = () => console.log('Duplicate:', transactionId);

    // --- Loading ---
    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#EEF2F7' }]}>
                <AppHeader title={t('Transaction Details') || 'Chi tiết giao dịch'} showBackButton />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <CustomText style={[styles.loadingText, { color: colors.icon }]}>
                        {t('Loading...') || 'Đang tải...'}
                    </CustomText>
                </View>
            </SafeAreaView>
        );
    }

    // --- Error ---
    if (error || !transaction) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#EEF2F7' }]}>
                <AppHeader title={t('Transaction Details') || 'Chi tiết giao dịch'} showBackButton />
                <View style={styles.centerContent}>
                    <View style={[styles.errorIconWrap, { backgroundColor: colors.card }]}>
                        <FontAwesome6 name="circle-exclamation" size={normalize(48)} color="#EF4444" />
                    </View>
                    <CustomText style={[styles.errorTitle, { color: colors.text }]}>
                        {t('Transaction Not Found') || 'Không tìm thấy giao dịch'}
                    </CustomText>
                    <CustomText style={[styles.errorText, { color: colors.icon }]}>
                        {error || t('The transaction you are looking for does not exist or has been deleted.')}
                    </CustomText>
                    <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.tint }]} onPress={refetch}>
                        <FontAwesome6 name="rotate-right" size={normalize(16)} color="#fff" />
                        <CustomText style={styles.retryButtonText}>{t('Retry') || 'Thử lại'}</CustomText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const categoryName = parseName(transaction.walletcategory?.category_name || null, i18n.language) || visuals.type;
    const walletName = transaction.walletprofile?.wallet_name;
    const hasImage = !!transaction.imageurl;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#EEF2F7' }]}>
            {/* Header giữ nguyên như code cũ */}
            <AppHeader
                title={t('Transaction Details') || 'Chi tiết giao dịch'}
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
                onRefund={handleRefund}
                colors={colors}
                t={t}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* === Gradient Hero Card (scrollable) === */}
                <GradientHeroCard
                    visuals={visuals}
                    currencyFormatted={currencyInfo}
                    transactionCode={transaction.transactioncode}
                />

                {/* === Nhóm === */}
                {transaction.walletcategory && (
                    <>
                        <SectionLabel label={t('Category') || 'Nhóm'} />
                        <ItemCard
                            icon={transaction.walletcategory.icon || 'tag'}
                            iconBg={transaction.walletcategory.color ? transaction.walletcategory.color + '25' : '#FEE2E2'}
                            iconColor={transaction.walletcategory.color || '#EF4444'}
                            label={categoryName}
                            colors={colors}
                        />
                        {(transaction as any).subcategory && (
                            <ItemCard
                                icon={(transaction as any).subcategory.icon || 'tag'}
                                iconBg={(transaction as any).subcategory.color
                                    ? (transaction as any).subcategory.color + '25'
                                    : '#FEE2E2'}
                                iconColor={(transaction as any).subcategory.color || '#EF4444'}
                                label={parseName((transaction as any).subcategory.category_name, i18n.language) || ''}
                                colors={colors}
                            />
                        )}
                    </>
                )}

                {/* === Nguồn tiền === */}
                {walletName && (
                    <>
                        <SectionLabel label={t('Wallet') || 'Nguồn tiền'} />
                        <ItemCard
                            icon="wallet"
                            iconBg="#D1FAE520"
                            iconColor="#10B981"
                            label={walletName}
                            colors={colors}
                        />
                    </>
                )}

                {/* === Sự kiện === */}
                {transaction.walletevent && transaction.walletevent.id !== 0 && (
                    <>
                        <SectionLabel label={t('Event') || 'Sự kiện'} />
                        <ItemCard
                            icon={transaction.walletevent.icon || 'calendar-day'}
                            iconBg={transaction.walletevent.color ? transaction.walletevent.color + '25' : '#DBEAFE'}
                            iconColor={transaction.walletevent.color || '#3B82F6'}
                            label={transaction.walletevent.title}
                            colors={colors}
                        />
                    </>
                )}

                {/* === Ghi chú === */}
                <SectionLabel label={t('Note') || 'Ghi chú'} />
                <View style={[styles.noteCard, { backgroundColor: colors.card }]}>
                    <CustomText style={[
                        styles.noteText,
                        { color: transaction.trandesc ? colors.text : '#9CA3AF' }
                    ]}>
                        {transaction.trandesc || (t('No note') || 'Không có ghi chú')}
                    </CustomText>
                </View>

                {/* === Ngày === */}
                <SectionLabel label={t('Date') || 'Ngày'} />
                <View style={[styles.dateCard, { backgroundColor: colors.card }]}>
                    <CustomText style={[styles.dateText, { color: colors.text }]}>
                        {formatDate(transaction.transactiondate)}
                    </CustomText>
                </View>

                {/* === Hình ảnh === */}
                <SectionLabel label={t('Image') || 'Hình ảnh'} />
                <View style={[styles.imageCard, { backgroundColor: colors.card }]}>
                    {hasImage ? (
                        <Image
                            source={{ uri: transaction.imageurl }}
                            style={styles.transactionImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <FontAwesome6 name="image" size={normalize(32)} color="#D1D5DB" />
                            <CustomText style={styles.imagePlaceholderText}>
                                {t('No image') || 'Chưa có hình ảnh'}
                            </CustomText>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContent: {
        flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp(10),
    },
    loadingText: {
        marginTop: hp(2), fontSize: normalize(14), fontFamily: Fonts.regular,
    },
    errorIconWrap: {
        width: normalize(96), height: normalize(96), borderRadius: normalize(48),
        alignItems: 'center', justifyContent: 'center', marginBottom: hp(2),
    },
    errorTitle: {
        fontSize: normalize(20), fontFamily: Fonts.bold, marginBottom: hp(1), textAlign: 'center',
    },
    errorText: {
        fontSize: normalize(14), fontFamily: Fonts.regular, textAlign: 'center',
        lineHeight: normalize(20), marginBottom: hp(3),
    },
    retryButton: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: normalize(24), paddingVertical: normalize(12),
        borderRadius: normalize(12), gap: normalize(8),
    },
    retryButtonText: { color: '#fff', fontSize: normalize(15), fontFamily: Fonts.semiBold },

    // AppHeader menu button
    menuButton: { padding: normalize(8), borderRadius: normalize(8) },

    // Menu dropdown
    menuDropdown: {
        position: 'absolute', top: hp(8), right: wp(5),
        borderRadius: normalize(14), paddingVertical: normalize(6),
        minWidth: normalize(160),
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12,
        elevation: 8, zIndex: 1000,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: normalize(16), paddingVertical: normalize(12), gap: normalize(12),
    },
    menuItemText: { fontSize: normalize(14), fontFamily: Fonts.medium },
    menuDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: normalize(12) },

    // Scroll
    scrollContent: {
        paddingHorizontal: wp(4),
        paddingTop: hp(1.5),
        paddingBottom: hp(5),
    },

    // Gradient Hero Card
    heroCard: {
        borderRadius: normalize(16),
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(18),
        marginBottom: normalize(4),
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(10),
        flex: 1,
    },
    heroIconWrap: {
        width: normalize(38),
        height: normalize(38),
        borderRadius: normalize(19),
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTypeName: {
        fontSize: normalize(15),
        fontFamily: Fonts.semiBold,
        color: '#fff',
    },
    heroAmount: {
        fontSize: normalize(22),
        fontFamily: Fonts.bold,
        color: '#fff',
        letterSpacing: -0.5,
    },
    heroSecondRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: normalize(6),
        gap: normalize(12),
    },
    heroSecondary: {
        fontSize: normalize(13),
        fontFamily: Fonts.regular,
        color: 'rgba(255,255,255,0.75)',
    },
    heroFee: {
        fontSize: normalize(13),
        fontFamily: Fonts.regular,
        color: 'rgba(255,255,255,0.75)',
    },

    // Section label
    sectionLabel: {
        fontSize: normalize(13),
        fontFamily: Fonts.medium,
        color: '#6B7280',
        marginTop: normalize(16),
        marginBottom: normalize(6),
        marginLeft: normalize(2),
    },

    // Item card
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: normalize(14),
        paddingVertical: normalize(13),
        paddingHorizontal: normalize(14),
        marginBottom: normalize(6),
        gap: normalize(12),
    },
    itemIconWrap: {
        width: normalize(42),
        height: normalize(42),
        borderRadius: normalize(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemLabel: {
        fontSize: normalize(15),
        fontFamily: Fonts.medium,
    },

    // Note
    noteCard: {
        borderRadius: normalize(14),
        paddingVertical: normalize(14),
        paddingHorizontal: normalize(14),
        minHeight: normalize(72),
        justifyContent: 'center',
    },
    noteText: {
        fontSize: normalize(14),
        fontFamily: Fonts.regular,
        lineHeight: normalize(22),
    },

    // Date
    dateCard: {
        borderRadius: normalize(14),
        paddingVertical: normalize(14),
        paddingHorizontal: normalize(14),
        alignItems: 'center',
    },
    dateText: {
        fontSize: normalize(15),
        fontFamily: Fonts.medium,
    },

    // Image
    imageCard: {
        borderRadius: normalize(14),
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#D1D5DB',
        overflow: 'hidden',
        minHeight: normalize(160),
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionImage: {
        width: '100%',
        height: normalize(200),
    },
    imagePlaceholder: {
        alignItems: 'center',
        gap: normalize(8),
        paddingVertical: normalize(36),
    },
    imagePlaceholderText: {
        fontSize: normalize(13),
        fontFamily: Fonts.regular,
        color: '#9CA3AF',
    },
});

export default TransactionDetailScreen;