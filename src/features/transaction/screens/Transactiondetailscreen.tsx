import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Transaction data interface (Extended for mockup)
interface TransactionDetail {
    transactionid: string;
    transactiondate: string;
    transactionname: string;
    transactioncode: string;
    sourcetranref: string;
    ccyid: string;
    sourceid: string;
    trandesc: string;
    status: string;
    nu_m01: number; // Amount
    nu_m02: number; // Fee
    cha_r01: string; // Wallet ID
    cha_r02: string; // Category ID
    icon?: string;
    color?: string;
}

// Props interface
interface TransactionDetailScreenProps {
    transaction?: TransactionDetail;
}

const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({ transaction: propTransaction }) => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const params = useLocalSearchParams();

    const transaction = useMemo(() => {
        let derivedTransaction: any = null;
        if (propTransaction) derivedTransaction = propTransaction;
        else if (params.transaction) {
            try {
                derivedTransaction = JSON.parse(params.transaction as string);
            } catch (e) {
                console.error("Failed to parse transaction", e);
            }
        }

        if (derivedTransaction) {
            // FILL MISSING DATA WITH MOCKUP
            return {
                ...derivedTransaction,
                cha_r01: derivedTransaction.cha_r01 || 'Ví Tiền Mặt (Mock)',
                cha_r02: derivedTransaction.cha_r02 || 'Ăn uống & Cafe (Mock)',
                sourcetranref: derivedTransaction.sourcetranref || 'TRX-987654321',
                nu_m02: derivedTransaction.nu_m02 || 0, // Mock fee if needed
                trandesc: derivedTransaction.trandesc || 'Thanh toán dịch vụ',
            } as TransactionDetail;
        }
        return null;
    }, [propTransaction, params.transaction]);

    if (!transaction) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <AppHeader title="Chi tiết giao dịch" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <CustomText style={{ color: colors.text }}>Transaction not found</CustomText>
                </View>
            </SafeAreaView>
        );
    }

    // Parse name from JSON string format: {"vi":"Tên","en":"Name"}
    const parseName = (name: string | null): string | null => {
        if (!name) return null;
        try {
            // If the string doesn't look like JSON, return it as is
            if (!name.startsWith('{')) return name;

            const parsed = JSON.parse(name);
            return parsed[i18n.language] || parsed.vi || parsed.en || name;
        } catch {
            return name;
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    // Format currency
    const formatCurrency = (amount: number, currency: string) => {
        return `${amount.toLocaleString()} ${currency}`;
    };

    // Get visuals (icon, color, type label)
    const getVisuals = () => {
        let visuals = {
            type: 'Giao dịch',
            color: '#6B7280',
            bgColor: '#F3F4F6',
            icon: 'receipt', // Default icon
        };

        if (transaction.transactioncode === '01') {
            visuals = { type: 'Thu nhập', color: '#10B981', bgColor: '#D1FAE5', icon: 'arrow-down' };
        } else if (transaction.transactioncode === '02') {
            visuals = { type: 'Chi tiêu', color: '#EF4444', bgColor: '#FEE2E2', icon: 'arrow-up' };
        }

        // Override if explicit icon/color provided
        if (transaction.icon) {
            visuals.icon = transaction.icon;
        }
        if (transaction.color) {
            visuals.color = transaction.color;
            visuals.bgColor = transaction.color + '20'; // Add transparency
        }

        return visuals;
    };

    const visuals = getVisuals();
    const amount = transaction.nu_m01;
    const fee = transaction.nu_m02 || 0;
    const totalAmount = amount + fee;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <AppHeader
                title="Chi tiết giao dịch"
                showBackButton
                rightComponent={
                    <TouchableOpacity style={{ padding: normalize(4) }}>
                        <FontAwesome6 name="ellipsis-vertical" size={normalize(20)} color={colors.text} />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Transaction Icon & Amount */}
                <View style={styles.amountSection}>
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: visuals.bgColor },
                        ]}
                    >
                        <FontAwesome6
                            name={visuals.icon as any}
                            size={normalize(40)}
                            color={visuals.color}
                        />
                    </View>

                    <CustomText style={[styles.transactionType, { color: visuals.color }]}>
                        {parseName(transaction.transactionname) || transaction.transactionname}
                    </CustomText>

                    <CustomText style={[styles.amountText, { color: colors.text }]}>
                        {formatCurrency(amount, transaction.ccyid)}
                    </CustomText>

                    {fee > 0 && (
                        <CustomText style={[styles.feeText, { color: colors.icon }]}>
                            Fee: {formatCurrency(fee, transaction.ccyid)}
                        </CustomText>
                    )}

                    <View style={[styles.statusBadge, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                        <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                        <CustomText style={[styles.statusText, { color: colors.text }]}>
                            {transaction.status || 'Completed'}
                        </CustomText>
                    </View>
                </View>

                {/* Transaction Information */}
                <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                    <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
                        Details
                    </CustomText>

                    <InfoRow
                        icon="hashtag"
                        label="Transaction ID"
                        value={transaction.transactionid || 'N/A'}
                        colors={colors}
                    />
                    <InfoRow
                        icon="calendar"
                        label="Date & Time"
                        value={formatDate(transaction.transactiondate)}
                        colors={colors}
                    />
                    <InfoRow
                        icon="tag"
                        label="Category"
                        value={transaction.cha_r02 || 'N/A'}
                        colors={colors}
                    />
                    <InfoRow
                        icon="wallet"
                        label="Wallet"
                        value={transaction.cha_r01 || 'N/A'}
                        colors={colors}
                    />
                </View>

                {/* Description */}
                {transaction.trandesc ? (
                    <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                        <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
                            Note
                        </CustomText>
                        <CustomText style={[styles.descriptionText, { color: colors.text }]}>

                        </CustomText>
                    </View>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        <FontAwesome6 name="share-nodes" size={normalize(18)} color={colors.text} />
                        <CustomText style={[styles.actionButtonText, { color: colors.text }]}>
                            Share
                        </CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        <FontAwesome6 name="trash-can" size={normalize(18)} color="#EF4444" />
                        <CustomText style={[styles.actionButtonText, { color: "#EF4444" }]}>
                            Delete
                        </CustomText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Info Row Component
interface InfoRowProps {
    icon: string;
    label: string;
    value: string;
    colors: any;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, colors }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
            <View style={{ width: normalize(24), alignItems: 'center' }}>
                <FontAwesome6 name={icon as any} size={normalize(16)} color={colors.icon} />
            </View>
            <CustomText style={[styles.infoLabel, { color: colors.icon }]}>
                {label}
            </CustomText>
        </View>
        <CustomText style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
            {value}
        </CustomText>
    </View>
);

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
    amountSection: {
        alignItems: 'center',
        paddingVertical: hp(3),
        paddingHorizontal: wp(5),
    },
    iconContainer: {
        width: normalize(72),
        height: normalize(72),
        borderRadius: normalize(36),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: hp(1.5),
    },
    transactionType: {
        fontSize: normalize(14),
        fontWeight: '600',
        marginBottom: hp(0.5),
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    amountText: {
        fontSize: normalize(32),
        fontWeight: '700',
        marginBottom: hp(0.5),
        textAlign: 'center',
    },
    feeText: {
        fontSize: normalize(14),
        marginBottom: hp(1),
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: normalize(12),
        paddingVertical: normalize(6),
        borderRadius: normalize(100),
        gap: normalize(6),
        marginTop: hp(1),
    },
    statusDot: {
        width: normalize(8),
        height: normalize(8),
        borderRadius: normalize(4),
    },
    statusText: {
        fontSize: normalize(13),
        fontWeight: '500',
    },
    infoCard: {
        marginHorizontal: wp(5),
        marginTop: hp(2),
        padding: normalize(20),
        borderRadius: normalize(20),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: normalize(16),
        fontWeight: '700',
        marginBottom: hp(2),
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: normalize(10),
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(10),
        flex: 1,
    },
    infoLabel: {
        fontSize: normalize(14),
    },
    infoValue: {
        fontSize: normalize(14),
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    descriptionText: {
        fontSize: normalize(15),
        lineHeight: normalize(22),
    },
    actionButtons: {
        flexDirection: 'row',
        gap: normalize(12),
        marginHorizontal: wp(5),
        marginTop: hp(4),
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: normalize(14),
        borderRadius: normalize(16),
        borderWidth: 1,
        gap: normalize(8),
    },
    actionButtonText: {
        fontSize: normalize(15),
        fontWeight: '600',
    },
});

export default TransactionDetailScreen;