import AppHeader from '@/components/base/AppHeader';
import AppIcon from '@/components/base/AppIcon';
import CustomText from '@/components/base/CustomText';
import SectionHeader from '@/components/base/SectionHeader';
import PieChartWithLabels from '@/components/chart/PieChartCard';
import STORAGE_KEY from '@/constants/StorageKey';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useCategory } from '@/hooks/useCategory';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
import StorageService from '@/services/StorageService';
import { WalletSummary } from '@/types/wallet';
import { hp, normalize, wp } from '@/utils/layout';
import { useReport } from '../hooks/useReport';

import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const generateTimePeriods = (t: any) => {
  const periods = [];
  const today = new Date();

  // Generate last 3 months + current month
  for (let i = 3; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const isCurrentMonth = i === 0;

    let label = '';
    if (isCurrentMonth) {
      label = t('report.this_month');
    } else {
      const month = d.getMonth() + 1;
      const year = d.getFullYear().toString().slice(-2);
      label = `${t('report.month_short')} ${month.toString().padStart(2, '0')}/${year}`;
    }
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    periods.push({
      id: i.toString(),
      label,
      date: dateStr
    });
  }
  return periods;
};

// Removed static TIME_PERIODS to generate it inside component with 't'

// Helper: parse category_name JSON {"vi":"...","en":"..."}
const parseCategoryName = (nameJson: string, lang: string = 'vi'): string => {
  try {
    const parsed = JSON.parse(nameJson);
    return parsed[lang] || parsed['en'] || nameJson;
  } catch {
    return nameJson;
  }
};


/* ================= SCREEN ================= */


import { useWalletIncomeExpenseSummary, useWalletOpeningClosingBalance } from '@/features/home/hooks/Usefinancesummary';

const ReportScreen = () => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { wallets, defaultWallet, loading } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(null);
  const [isNetBalanceVisible, setIsNetBalanceVisible] = useState(true);
  const { defaultCurrency } = useDefaultCurrency();

  const timePeriods = React.useMemo(() => generateTimePeriods(t), [t]);
  const [selectedPeriod, setSelectedPeriod] = useState(timePeriods[timePeriods.length - 1]);

  const { fetchBalance, data: balanceData, loading: balanceLoading } = useWalletOpeningClosingBalance();
  const { fetchWalletSummary, data: walletSummaryData, loading: walletSummaryLoading } = useWalletIncomeExpenseSummary();
  const { analyzeCategory, categoryAnalysis, analyzing } = useCategory({ autoFetch: false });
  const { fetchMonthlyDebitSummary, debitSummary, loading: debitLoading } = useReport();

  useEffect(() => {
    if (!loading && wallets.length > 0 && !selectedWallet) {
      const initialWallet = defaultWallet || wallets[0];
      setSelectedWallet(initialWallet);
    }
  }, [loading, wallets, defaultWallet, selectedWallet]);

  useEffect(() => {
    if (selectedWallet?.walletId && selectedPeriod?.date) {
      console.log('[ReportScreen] Fetching data for wallet:', selectedWallet.walletId, 'period:', selectedPeriod.date);

      fetchBalance({
        period_type: 'M',
        anchor_date: selectedPeriod.date,
        type: 'W',
        wallet_id: selectedWallet.walletId
      });

      fetchWalletSummary({
        wallet_id: selectedWallet.walletId,
        anchor_date: selectedPeriod.date,
        period_type: 'M',
      });

      analyzeCategory({
        wallet_id: selectedWallet.walletId,
        anchor_date: selectedPeriod.date,
        period_type: 'M',
      });

      fetchMonthlyDebitSummary({
        wallet_id: selectedWallet.walletId,
        anchor_date: selectedPeriod.date.slice(0, 7),
      });
    }
  }, [selectedWallet?.walletId, selectedPeriod?.id, fetchBalance, fetchWalletSummary, analyzeCategory, fetchMonthlyDebitSummary]);

  useFocusEffect(
    useCallback(() => {
      const loadSelectedWallet = async () => {
        try {
          const storedWallet = await StorageService.getItem(
            STORAGE_KEY.TEMP_WALLET_STORAGE,
          );
          if (storedWallet) {
            const { walletId } = JSON.parse(storedWallet);
            const wallet = wallets.find((w) => w.walletId === walletId);
            if (wallet) {
              setSelectedWallet(wallet);
            }
            await StorageService.removeItem(
              STORAGE_KEY.TEMP_WALLET_STORAGE,
            );
          }
        } catch (error) {
          console.error('[ReportScreen] Failed to load selected wallet:', error);
        }
      };
      loadSelectedWallet();
    }, [wallets]),
  );

  const scrollRef = useRef<ScrollView>(null);

  // Tự động cuộn đến phần tử đang chọn
  useEffect(() => {
    if (selectedPeriod && scrollRef.current) {
      const index = timePeriods.findIndex(p => p.id === selectedPeriod.id);
      if (index !== -1) {
        // Một cách đơn giản để cuộn đến vị trí gần đúng (với 4-5 phần tử)
        // Nếu cần chính xác hơn có thể dùng onLayout của từng item
        scrollRef.current.scrollTo({
          x: index * normalize(100), // xấp xỉ chiều rộng mỗi tab
          animated: true
        });
      }
    }
  }, [selectedPeriod?.id, timePeriods]);

  const getBalanceValue = (key: 'opening' | 'closing') => {
    if (balanceData?.net_balance?.details) {
      const detail = balanceData.net_balance.details.find(d =>
        key === 'opening' ? d.label === 'Opening_Balance' : d.label === 'Closing_Balance'
      );
      if (detail) return detail.amount;
    }
    return key === 'opening' ? (balanceData?.opening_balance ?? 0) : (balanceData?.closing_balance ?? 0);
  };

  const totalExpense = walletSummaryData?.expense?.total ?? 0;
  const totalIncome = walletSummaryData?.income?.total ?? 0;
  const netBalance = balanceData?.net_balance?.total ?? ((balanceData?.closing_balance || 0) - (balanceData?.opening_balance || 0));

  const openingBalance = getBalanceValue('opening');
  const closingBalance = getBalanceValue('closing');

  const expenseChange = walletSummaryData?.expense?.change_percent ?? 0;
  const incomeChange = walletSummaryData?.income?.change_percent ?? 0;

  const formatCurrency = (v: number) => v.toLocaleString('vi-VN') + ' ' + defaultCurrency.symbol;

  // Tách EXPENSE / INCOME từ real data
  const expensePieData = categoryAnalysis
    .filter(c => c.category_group === 'EXPENSE')
    .map(c => ({
      name: parseCategoryName(c.category_name),
      value: c.total_amount,
      color: c.color,
    }));

  const incomePieData = categoryAnalysis
    .filter(c => c.category_group === 'INCOME')
    .map(c => ({
      name: parseCategoryName(c.category_name),
      value: c.total_amount,
      color: c.color,
    }));

  // Navigate sang màn chi tiết tổng hợp (Trend + Transactions)
  const handleViewGroupDetail = (type: 'EXPENSE' | 'INCOME') => {
    router.push({
      pathname: '/(protected)/report/group-detail',
      params: {
        wallet_id: selectedWallet?.walletId?.toString() ?? '',
        anchor_date: selectedPeriod.date,
        period_type: 'M',
        currency: defaultCurrency.symbol,
        wallet_name: selectedWallet?.name ?? '',
        period_label: selectedPeriod.label,
        type: type,
      }
    } as any);
  };

  // Navigate sang màn chi tiết theo Category (Màn hình cũ)
  const handleViewCategoryDetail = (type: 'EXPENSE' | 'INCOME') => {
    router.push({
      pathname: '/(protected)/report/category-report-detail',
      params: {
        wallet_id: selectedWallet?.walletId?.toString() ?? '',
        anchor_date: selectedPeriod.date,
        period_type: 'M',
        currency: defaultCurrency.symbol,
        wallet_name: selectedWallet?.name ?? '',
        period_label: selectedPeriod.label,
        active_tab: type,
      }
    } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('report.title')} showBackButton />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ===== HEADER: WALLET SELECTOR ===== */}
        <TouchableOpacity
          style={[styles.headerCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(protected)/wallet/wallet-list?mode=select')}
          activeOpacity={0.7}
        >
          <View style={styles.walletSelector}>
            <AppIcon
              name={selectedWallet?.icon || 'wallet'}
              size={normalize(16)}
              color={selectedWallet?.color || colors.tint}
            />
            <CustomText type="medium" size={15}>
              {selectedWallet?.name || t('report.select_wallet')}
            </CustomText>
            <FontAwesome6 name="chevron-down" size={normalize(14)} color={colors.tint} />
          </View>
        </TouchableOpacity>

        {/* ===== TIME PERIOD TABS ===== */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodTabsContainer}
          style={styles.periodTabsScroll}
        >
          {timePeriods.map(period => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodTab,
                { backgroundColor: colors.card },
                selectedPeriod.id === period.id && [
                  styles.periodTabActive,
                  { backgroundColor: colors.tint },
                ],
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <CustomText
                type="medium"
                size={13}
                style={[
                  selectedPeriod.id === period.id ? { color: '#fff' } : { color: colors.text },
                ]}
              >
                {period.label}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ===== INCOME/EXPENSE SUMMARY ===== */}
        <SectionHeader title={t('report.net_income_title')} />

        <View style={styles.summaryRow}>
          {/* Total Expense */}
          <TouchableOpacity 
            style={[styles.summaryCard, { backgroundColor: colors.card }]}
            onPress={() => handleViewGroupDetail('EXPENSE')}
            activeOpacity={0.7}
          >
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryIcon, { backgroundColor: '#FFE4E1' }]}>
                <FontAwesome6 name="arrow-trend-down" size={normalize(16)} color="#F44336" />
              </View>
              <CustomText size={14}>{t('report.total_expense')}</CustomText>
            </View>
            <CustomText type="bold" size={20} style={{ marginTop: normalize(8) }} numberOfLines={1} adjustsFontSizeToFit>
              {walletSummaryLoading ? t('common.loading') : formatCurrency(totalExpense)}
            </CustomText>
            <View style={styles.changeIndicator}>
              <FontAwesome6
                name={expenseChange === 0 ? 'minus' : (expenseChange > 0 ? 'arrow-up' : 'arrow-down')}
                size={normalize(10)}
                color={expenseChange === 0 ? colors.icon : (expenseChange > 0 ? '#F44336' : '#4CAF50')}
              />
              <CustomText size={12} style={{ color: expenseChange === 0 ? colors.icon : (expenseChange > 0 ? '#F44336' : '#4CAF50') }}>
                {Math.abs(expenseChange)}% {t('report.previous_month')}
              </CustomText>
            </View>
          </TouchableOpacity>

          {/* Total Income */}
          <TouchableOpacity 
            style={[styles.summaryCard, { backgroundColor: colors.card }]}
            onPress={() => handleViewGroupDetail('INCOME')}
            activeOpacity={0.7}
          >
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryIcon, { backgroundColor: '#E8F5E9' }]}>
                <FontAwesome6 name="arrow-trend-up" size={normalize(16)} color="#4CAF50" />
              </View>
              <CustomText size={14}>{t('report.total_income')}</CustomText>
            </View>
            <CustomText type="bold" size={20} style={{ marginTop: normalize(8) }} numberOfLines={1} adjustsFontSizeToFit>
              {walletSummaryLoading ? t('common.loading') : formatCurrency(totalIncome)}
            </CustomText>
            <View style={styles.changeIndicator}>
              <FontAwesome6
                name={incomeChange === 0 ? 'minus' : (incomeChange > 0 ? 'arrow-up' : 'arrow-down')}
                size={normalize(10)}
                color={incomeChange === 0 ? colors.icon : (incomeChange > 0 ? '#4CAF50' : '#F44336')}
              />
              <CustomText size={12} style={{ color: incomeChange === 0 ? colors.icon : (incomeChange > 0 ? '#4CAF50' : '#F44336') }}>
                {incomeChange > 0 ? '+' : ''}{incomeChange}% {t('report.previous_month')}
              </CustomText>
            </View>
          </TouchableOpacity>
        </View>

        {/* ===== NET BALANCE ===== */}
        <LinearGradient
          colors={['#0091FF', '#00C2FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.netBalanceGradient}
        >
          <View style={styles.netBalanceHeader}>
            <View style={styles.netBalanceIconContainer}>
              <FontAwesome6 name="dollar-sign" size={normalize(16)} color="#0091FF" />
            </View>
            <CustomText size={15} style={{ color: '#FFFFFF', flex: 1 }}>{t('report.total_net_balance')}</CustomText>
            <Pressable onPress={() => setIsNetBalanceVisible(!isNetBalanceVisible)}>
              <FontAwesome6
                name={isNetBalanceVisible ? 'eye' : 'eye-slash'}
                size={normalize(18)}
                color="#FFFFFF"
                style={{ opacity: 0.8 }}
              />
            </Pressable>
          </View>

          <View style={styles.netBalanceValueContainer}>
            <CustomText type="bold" size={28} style={{ color: '#FFFFFF' }}>
              {balanceLoading ? '...' : (isNetBalanceVisible ? formatCurrency(netBalance) : '******')}
            </CustomText>
          </View>
        </LinearGradient>

        {/* ===== BALANCE DETAILS CARD ===== */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <CustomText size={14} style={{ color: colors.text }}>{t('report.opening_balance')}</CustomText>
            <CustomText type="medium" size={14} style={{ color: colors.tint }}>
              {formatCurrency(openingBalance)}
            </CustomText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <CustomText size={14} style={{ color: colors.text }}>{t('report.closing_balance')}</CustomText>
            <CustomText type="medium" size={14} style={{ color: colors.tint }}>
              {formatCurrency(closingBalance)}
            </CustomText>
          </View>
        </View>

        {/* ===== DEBT SECTION ===== */}
        <View style={[styles.debtCard, { backgroundColor: colors.card }]}>
          {debitLoading ? (
            <CustomText size={14} style={{ textAlign: 'center' }}>{t('common.loading')}</CustomText>
          ) : (
            debitSummary.length > 0 ? (
              debitSummary.map((item, index) => {
                let displayLabel = item.label;
                if (item.label === 'Borrow') displayLabel = t('report.debit_borrow');
                else if (item.label === 'Lend') displayLabel = t('report.debit_lend');
                else if (item.label === 'Other') displayLabel = t('report.debit_other');

                return (
                  <View key={index} style={styles.debtRow}>
                    <CustomText size={14}>{displayLabel}</CustomText>
                    <CustomText type="medium" size={14}>
                      {formatCurrency(item.amount)}
                    </CustomText>
                  </View>
                );
              })
            ) : (
              <CustomText size={14} style={{ textAlign: 'center', opacity: 0.5 }}>{t('report.no_debt_data')}</CustomText>
            )
          )}
        </View>

        <SectionHeader
          title={t('report.group_report')}
          showAction={true}
          actionText={t('report.view_detail')}
          onPressAction={() => handleViewCategoryDetail('EXPENSE')}
        />

        {/* ===== PIE CHARTS ===== */}
        <View style={{ marginHorizontal: wp(5) }}>
          {analyzing ? (
            <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
              <CustomText size={14} style={{ color: colors.text, textAlign: 'center' }}>
                {t('common.loading')}
              </CustomText>
            </View>
          ) : (
            <>
              {expensePieData.length > 0 ? (
                <PieChartWithLabels
                  data={expensePieData}
                  title={t('report.expense_items')}
                  backgroundColor={colors.card}
                />
              ) : (
                <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                  <FontAwesome6 name="chart-pie" size={normalize(32)} color={colors.icon} />
                  <CustomText size={14} style={{ color: colors.text, marginTop: normalize(8) }}>
                    {t('report.no_expense_data')}
                  </CustomText>
                </View>
              )}
              {incomePieData.length > 0 ? (
                <PieChartWithLabels
                  data={incomePieData}
                  title={t('report.income_items')}
                  backgroundColor={colors.card}
                />
              ) : (
                <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                  <FontAwesome6 name="chart-pie" size={normalize(32)} color={colors.icon} />
                  <CustomText size={14} style={{ color: colors.text, marginTop: normalize(8) }}>
                    {t('report.no_income_data')}
                  </CustomText>
                </View>
              )}
            </>
          )}
        </View>

        <View style={{ height: hp(8) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerCard: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    padding: normalize(12),
    borderRadius: normalize(12),
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },

  periodTabsScroll: {
    marginVertical: hp(2),
  },
  periodTabsContainer: {
    paddingHorizontal: wp(5),
    gap: normalize(8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodTab: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
  },
  periodTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  sectionTitle: {
    paddingHorizontal: wp(5),
    marginBottom: normalize(12),
  },

  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    gap: normalize(12),
    marginBottom: normalize(16),
  },
  summaryCard: {
    flex: 1,
    padding: normalize(16),
    borderRadius: normalize(12),
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  summaryIcon: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    marginTop: normalize(6),
  },

  netBalanceGradient: {
    marginHorizontal: wp(5),
    padding: normalize(18),
    borderRadius: normalize(20),
    marginBottom: normalize(12),
    minHeight: normalize(120),
  },
  netBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
  },
  netBalanceIconContainer: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  netBalanceValueContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: normalize(10),
  },

  infoCard: {
    marginHorizontal: wp(5),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(4),
    borderRadius: normalize(16),
    marginBottom: normalize(16),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: normalize(12),
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.5,
  },

  debtCard: {
    marginHorizontal: wp(5),
    padding: normalize(16),
    borderRadius: normalize(12),
    marginBottom: normalize(16),
    gap: normalize(12),
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingCard: {
    padding: normalize(32),
    borderRadius: normalize(12),
    marginBottom: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: normalize(32),
    borderRadius: normalize(12),
    marginBottom: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ReportScreen;
