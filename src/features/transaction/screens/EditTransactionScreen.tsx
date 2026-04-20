import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import TransactionAmountInput from '@/features/transaction/components/TransactionAmountInput';
import { useCurrency } from '@/hooks/useCurrency';
import { useCurrencyPicker } from '@/hooks/useCurrencyPicker';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransaction } from '../hooks/useTransaction';
import { useTransactionDetail } from '../hooks/useTransactionDetail';

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseName = (name: string | null, lang: string): string => {
    if (!name) return '';
    try {
        if (!name.trim().startsWith('{')) return name;
        const p = JSON.parse(name);
        return p[lang] || p.vi || p.en || name;
    } catch { return name; }
};

const formatDateDisplay = (iso: string, lang: string) => {
    try {
        return new Date(iso).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    } catch { return iso; }
};

const isoToDateInput = (iso: string) => {
    try { return iso.split('T')[0]; } catch { return ''; }
};

const rebuildIso = (dateStr: string, originalIso: string) => {
    try {
        const time = originalIso.split('T')[1] || '00:00:00';
        return `${dateStr}T${time}`;
    } catch { return `${dateStr}T00:00:00`; }
};

// ── Field Label ───────────────────────────────────────────────────────────────

const FieldLabel = ({ icon, label, colors }: { icon: string; label: string; colors: any }) => (
    <View style={fieldStyles.labelRow}>
        <FontAwesome6 name={icon} size={normalize(12)} color={colors.icon} />
        <CustomText style={[fieldStyles.label, { color: colors.icon }]}>{label}</CustomText>
    </View>
);

const fieldStyles = StyleSheet.create({
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: normalize(6), marginBottom: normalize(6) },
    label: { fontSize: normalize(12), fontFamily: Fonts.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

const EditTransactionScreen: React.FC = () => {
    const { colors } = useAppTheme();
    const { t, i18n } = useTranslation();
    const params = useLocalSearchParams();
    const { showNotification } = useNotification();
    const { updateTransaction, loading: updating } = useTransaction();

    const transactionId = useMemo(() => {
        if (typeof params.transactionId === 'string') return params.transactionId;
        if (params.transaction) {
            try {
                const d = JSON.parse(params.transaction as string);
                return d.transactionid || d.id || null;
            } catch { }
        }
        return null;
    }, [params]);

    const { transaction, loading: fetching } = useTransactionDetail(transactionId);

    // ── Form state ─────────────────────────────────────────────────────────────
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [isCalculateReport, setIsCalculateReport] = useState(true);

    const [walletCurrency, setWalletCurrency] = useState({ currencyId: 'VND', symbol: 'đ' });

    const { currencies } = useCurrency();

    // ── Currency picker (shared hook) ───────────────────────────────────────────
    // walletCurrency = walletCurrency state (fixed from transaction)
    const {
        inputCurrency,
        onCurrencyPress,
        needsConversion,
        exchangeRate,
        convertedAmount,
    } = useCurrencyPicker({
        baseCurrency: walletCurrency,
        amount,
    });

    const amountNum = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;

    const initialized = useRef(false);

    useEffect(() => {
        if (transaction && !initialized.current) {
            initialized.current = true;

            // Format initial amount with commas
            const rawAmount = String(transaction.amount || '0');
            const parts = rawAmount.split('.');
            const formattedInt = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            const formattedAmount = formattedInt + (parts.length > 1 ? "." + parts[1].substring(0, 2) : "");

            setAmount(formattedAmount);
            setDescription(transaction.trandesc || '');
            setLocation((transaction as any).location || '');
            setDateStr(isoToDateInput(transaction.transactiondate || ''));
            setIsCalculateReport(true);

            // Set initial currency
            if (transaction.ccyid) {
                const ccy = { currencyId: transaction.ccyid, symbol: transaction.ccyid === 'VND' ? 'đ' : '$' };
                setWalletCurrency(ccy); // walletCurrency fixed from transaction; inputCurrency managed by hook
            }
        }
    }, [transaction]);

    // Handle currency selection is now managed by useCurrencyPicker hook

    // ── Computed data ──────────────────────────────────────────────────────────
    const categoryName = useMemo(() =>
        parseName(transaction?.walletcategory?.category_name || null, i18n.language),
        [transaction, i18n.language]
    );

    const isIncome = transaction?.transactioncode === '01';
    const typeColor = isIncome ? '#10B981' : '#EF4444';
    const typeLabel = isIncome ? (t('Income') || 'Thu nhập') : (t('Expense') || 'Khoản chi');

    const isValid = amountNum > 0 && dateStr.length === 10;

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!transactionId || !transaction) return;
        try {
            const finalAmount = needsConversion && convertedAmount !== null
                ? convertedAmount
                : amountNum;

            const isoDate = rebuildIso(dateStr, transaction.transactiondate);
            await updateTransaction({
                transactionId,
                amount: finalAmount,
                currency: inputCurrency.currencyId,
                categoryId: (transaction.walletcategory as any)?.id || 0,
                description,
                location,
                transactionDate: isoDate,
                isCalculateReport,
            });
            showNotification(
                t('Transaction updated successfully') || 'Đã cập nhật giao dịch',
                'success',
            );
            router.back();
        } catch (err: any) {
            showNotification(
                err?.message || t('Could not update transaction') || 'Không thể cập nhật',
                'error',
            );
        }
    }, [
        transactionId,
        transaction,
        amountNum,
        description,
        location,
        dateStr,
        isCalculateReport,
        updateTransaction,
        inputCurrency,
        needsConversion,
        convertedAmount,
        showNotification,
        t
    ]);

    // ── Loading / Error states ─────────────────────────────────────────────────
    if (fetching) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <AppHeader title={t('Edit Transaction') || 'Sửa giao dịch'} showBackButton />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            </SafeAreaView>
        );
    }

    if (!transaction) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <AppHeader title={t('Edit Transaction') || 'Sửa giao dịch'} showBackButton />
                <View style={styles.center}>
                    <FontAwesome6 name="circle-exclamation" size={normalize(40)} color="#EF4444" />
                    <CustomText style={{ color: colors.icon, marginTop: normalize(12) }}>
                        {t('Transaction not found') || 'Không tìm thấy giao dịch'}
                    </CustomText>
                </View>
            </SafeAreaView>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <AppHeader title={t('Edit Transaction') || 'Sửa giao dịch'} showBackButton />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={normalize(70)}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <TransactionAmountInput
                        amount={amount}
                        onAmountChange={setAmount}
                        inputCurrency={inputCurrency}
                        walletCurrency={walletCurrency}
                        onCurrencyPress={onCurrencyPress}
                        needsConversion={needsConversion}
                        convertedAmount={convertedAmount}
                        exchangeRate={exchangeRate}
                        selectedType={isIncome ? 'income' : 'expense'}
                        label={t('Amount') || 'Số tiền'}
                    />

                    {/* ── Nhóm (readonly) ── */}
                    {transaction.walletcategory && (
                        <View style={styles.section}>
                            <FieldLabel icon="tag" label={t('Category') || 'Nhóm'} colors={colors} />
                            <View style={[styles.readonlyRow, { backgroundColor: colors.card }]}>
                                <View style={[
                                    styles.catIcon,
                                    { backgroundColor: (transaction.walletcategory.color || '#6B7280') + '25' },
                                ]}>
                                    <FontAwesome6
                                        name={transaction.walletcategory.icon || 'tag'}
                                        size={normalize(16)}
                                        color={transaction.walletcategory.color || '#6B7280'}
                                        solid
                                    />
                                </View>
                                <CustomText style={[styles.readonlyText, { color: colors.text }]}>
                                    {categoryName || t('Unknown') || 'Không xác định'}
                                </CustomText>
                                <FontAwesome6
                                    name="lock"
                                    size={normalize(12)}
                                    color={colors.icon}
                                    style={{ marginLeft: 'auto' as any }}
                                />
                            </View>
                        </View>
                    )}

                    {/* ── Ghi chú ── */}
                    <View style={styles.section}>
                        <FieldLabel icon="note-sticky" label={t('Note') || 'Ghi chú'} colors={colors} />
                        <TextInput
                            style={[
                                styles.textArea,
                                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                            ]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder={t('Add a note...') || 'Thêm ghi chú...'}
                            placeholderTextColor={colors.icon}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* ── Vị trí ── */}
                    <View style={styles.section}>
                        <FieldLabel icon="location-dot" label={t('Location') || 'Vị trí'} colors={colors} />
                        <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <FontAwesome6 name="location-dot" size={normalize(14)} color={colors.icon} />
                            <TextInput
                                style={[styles.inputInline, { color: colors.text }]}
                                value={location}
                                onChangeText={setLocation}
                                placeholder={t('Enter location') || 'Nhập vị trí'}
                                placeholderTextColor={colors.icon}
                            />
                        </View>
                    </View>

                    {/* ── Ngày giao dịch ── */}
                    <View style={styles.section}>
                        <FieldLabel icon="calendar-days" label={t('Date') || 'Ngày'} colors={colors} />
                        <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <FontAwesome6 name="calendar-days" size={normalize(14)} color={colors.icon} />
                            <TextInput
                                style={[styles.inputInline, { color: colors.text }]}
                                value={dateStr}
                                onChangeText={(v) => setDateStr(v.replace(/[^0-9-]/g, '').slice(0, 10))}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.icon}
                                keyboardType="numbers-and-punctuation"
                                maxLength={10}
                            />
                            {dateStr.length === 10 && (
                                <CustomText style={{ color: colors.icon, fontSize: normalize(12), fontFamily: Fonts.regular }}>
                                    {formatDateDisplay(dateStr, i18n.language)}
                                </CustomText>
                            )}
                        </View>
                    </View>

                    {/* ── Tính vào báo cáo ── */}
                    <View style={[styles.toggleRow, { backgroundColor: colors.card }]}>
                        <View style={styles.toggleLeft}>
                            <View style={[styles.toggleIcon, { backgroundColor: colors.tint + '20' }]}>
                                <FontAwesome6 name="chart-pie" size={normalize(14)} color={colors.tint} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <CustomText style={[styles.toggleTitle, { color: colors.text }]}>
                                    {t('Include in report') || 'Tính vào báo cáo'}
                                </CustomText>
                                <CustomText style={[styles.toggleSub, { color: colors.icon }]}>
                                    {t('Count this transaction in statistics') || 'Tính giao dịch này vào thống kê'}
                                </CustomText>
                            </View>
                        </View>
                        <Switch
                            value={isCalculateReport}
                            onValueChange={setIsCalculateReport}
                            trackColor={{ false: colors.border, true: colors.tint + '80' }}
                            thumbColor={isCalculateReport ? colors.tint : '#f4f3f4'}
                        />
                    </View>

                    {/* ── Nút lưu ── */}
                    <TouchableOpacity onPress={handleSave} disabled={!isValid || updating} activeOpacity={0.85}>
                        <LinearGradient
                            colors={isValid && !updating ? ['#2563EB', '#1DA1F2'] : [colors.border, colors.border]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveBtn}
                        >
                            {updating ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <FontAwesome6 name="floppy-disk" size={normalize(16)} color="#fff" />
                                    <CustomText style={styles.saveBtnText}>
                                        {t('Save changes') || 'Lưu thay đổi'}
                                    </CustomText>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: normalize(12) },
    scrollContent: {
        paddingHorizontal: wp(4),
        paddingTop: hp(1.5),
        paddingBottom: hp(6),
    },

    // Section
    section: { marginTop: normalize(20) },

    // Readonly row
    readonlyRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: normalize(14),
        paddingVertical: normalize(13), paddingHorizontal: normalize(14),
        gap: normalize(12),
    },
    catIcon: {
        width: normalize(38), height: normalize(38), borderRadius: normalize(10),
        alignItems: 'center', justifyContent: 'center',
    },
    readonlyText: { fontSize: normalize(15), fontFamily: Fonts.medium, flex: 1 },

    // Text area
    textArea: {
        borderRadius: normalize(14), borderWidth: 1,
        paddingVertical: normalize(12), paddingHorizontal: normalize(14),
        fontSize: normalize(15), fontFamily: Fonts.regular,
        minHeight: normalize(90), lineHeight: normalize(22),
    },

    // Input row
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: normalize(14), borderWidth: 1,
        paddingHorizontal: normalize(14),
        gap: normalize(10), minHeight: normalize(50),
    },
    inputInline: {
        flex: 1, fontSize: normalize(15), fontFamily: Fonts.regular,
        paddingVertical: normalize(8),
    },

    // Toggle
    toggleRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: normalize(14),
        paddingHorizontal: normalize(14), paddingVertical: normalize(14),
        marginTop: normalize(20), gap: normalize(12),
    },
    toggleLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: normalize(12) },
    toggleIcon: {
        width: normalize(38), height: normalize(38), borderRadius: normalize(10),
        alignItems: 'center', justifyContent: 'center',
    },
    toggleTitle: { fontSize: normalize(14), fontFamily: Fonts.medium },
    toggleSub: { fontSize: normalize(12), fontFamily: Fonts.regular, marginTop: normalize(2) },

    // Save button
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: normalize(10), borderRadius: normalize(16),
        paddingVertical: normalize(16), marginTop: normalize(28),
    },
    saveBtnText: { fontSize: normalize(16), fontFamily: Fonts.semiBold, color: '#fff' },
});

export default EditTransactionScreen;
