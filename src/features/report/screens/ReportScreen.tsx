import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import SectionHeader from '@/components/base/SectionHeader';
import PieChartWithLabels from '@/components/chart/PieChartCard';
import STORAGE_KEY from '@/constants/StorageKey';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useCategory } from '@/hooks/useCategory';
import StorageService from '@/services/StorageService';
import { WalletSummary } from '@/types/wallet';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const generateTimePeriods = () => {
  const periods = [];
  const today = new Date();

  // Generate last 3 months + current month
  for (let i = 3; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const isCurrentMonth = i === 0;

    let label = '';
    if (isCurrentMonth) {
      label = 'Tháng này';
    } else {
      const month = d.getMonth() + 1;
      const year = d.getFullYear().toString().slice(-2);
      label = `TH${month.toString().padStart(2, '0')}/${year}`;
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

const TIME_PERIODS = generateTimePeriods();

// Helper: parse category_name JSON {"vi":"...","en":"..."}
const parseCategoryName = (nameJson: string, lang: string = 'vi'): string => {
  try {
    const parsed = JSON.parse(nameJson);
    return parsed[lang] || parsed['en'] || nameJson;
  } catch {
    return nameJson;
  }
};

const MOCK_DEBT_DETAILS = [
  { label: 'Nợ', amount: 0 },
  { label: 'Cho vay', amount: 0 },
  { label: 'Khác', amount: 0 },
];

/* ================= SCREEN ================= */

import { useWalletOpeningClosingBalance } from '@/features/home/hooks/Usefinancesummary';

const ReportScreen = () => {
  const { colors } = useAppTheme();
  const { wallets, defaultWallet, loading } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[TIME_PERIODS.length - 1]);

  const { fetchBalance, data: balanceData, loading: balanceLoading } = useWalletOpeningClosingBalance();
  const { analyzeCategory, categoryAnalysis, analyzing } = useCategory({ autoFetch: false });

  // Initialize selected wallet with default wallet or first wallet
  useEffect(() => {
    if (!selectedWallet && wallets.length > 0) {
      setSelectedWallet(defaultWallet || wallets[0]);
    }
  }, [wallets, defaultWallet, selectedWallet]);

  useEffect(() => {
    if (selectedWallet && selectedPeriod) {
      fetchBalance({
        period_type: 'M',
        anchor_date: selectedPeriod.date,
        type: 'W',
        wallet_id: selectedWallet.walletId
      });
      // Gọi API phân tích category theo ví đang chọn
      analyzeCategory({
        wallet_id: selectedWallet.walletId,
        anchor_date: selectedPeriod.date,
        period_type: 'M',
      });
    }
  }, [selectedWallet, selectedPeriod]);

  // Handle wallet selection from WalletListScreen
  useFocusEffect(
    useCallback(() => {
      const loadSelectedWallet = async () => {
        try {
          const storedWallet = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_WALLET_STORAGE,
          );
          if (storedWallet) {
            const { walletId } = JSON.parse(storedWallet);
            const wallet = wallets.find((w) => w.walletId === walletId);
            if (wallet) {
              setSelectedWallet(wallet);
            }
            await StorageService.removeAsyncItem(
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

  const getBalanceValue = (key: 'opening' | 'closing') => {
    if (balanceData?.net_balance?.details) {
      const detail = balanceData.net_balance.details.find(d =>
        key === 'opening' ? d.label === 'Opening_Balance' : d.label === 'Closing_Balance'
      );
      if (detail) return detail.amount;
    }
    return key === 'opening' ? (balanceData?.opening_balance ?? 0) : (balanceData?.closing_balance ?? 0);
  };

  const totalExpense = balanceData?.expense_amount ?? 0;
  const totalIncome = balanceData?.income_amount ?? 0;
  const netBalance = balanceData?.net_balance?.total ?? ((balanceData?.closing_balance || 0) - (balanceData?.opening_balance || 0));

  const openingBalance = getBalanceValue('opening');
  const closingBalance = getBalanceValue('closing');

  const expenseChange = 0;
  const incomeChange = 0;

  const formatCurrency = (v: number, currency: string = 'đ') => v.toLocaleString('vi-VN') + ' ' + currency;

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

  // Navigate sang màn chi tiết với context ví & kỳ đang chọn
  const handleViewDetail = () => {
    router.push({
      pathname: '/(protected)/report/category-report-detail',
      params: {
        wallet_id: selectedWallet?.walletId?.toString() ?? '',
        anchor_date: selectedPeriod.date,
        period_type: 'M',
        currency: selectedWallet?.currency ?? 'đ',
        wallet_name: selectedWallet?.name ?? '',
        period_label: selectedPeriod.label,
      }
    } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Báo cáo" showBackButton />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ===== HEADER: WALLET SELECTOR ===== */}
        <TouchableOpacity
          style={[styles.headerCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(protected)/wallet/wallet-list?mode=select')}
          activeOpacity={0.7}
        >
          <View style={styles.walletSelector}>
            <FontAwesome6
              name={selectedWallet?.icon ? selectedWallet.icon as any : 'wallet'}
              size={normalize(16)}
              color={selectedWallet?.color || colors.tint}
            />
            <CustomText type="medium" size={15}>
              {selectedWallet?.name || 'Chọn ví'}
            </CustomText>
            <FontAwesome6 name="chevron-down" size={normalize(14)} color={colors.tint} />
          </View>
        </TouchableOpacity>

        {/* ===== TIME PERIOD TABS ===== */}
        <View style={styles.periodTabs}>
          {TIME_PERIODS.map(period => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodTab,
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
                  selectedPeriod.id === period.id && { color: '#fff' },
                ]}
              >
                {period.label}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>

        {/* ===== INCOME/EXPENSE SUMMARY ===== */}
        <SectionHeader title="Thu nhập ròng" />

        <View style={styles.summaryRow}>
          {/* Total Expense */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryIcon, { backgroundColor: '#FFE4E1' }]}>
                <FontAwesome6 name="arrow-trend-down" size={normalize(16)} color="#F44336" />
              </View>
              <CustomText size={14}>Tổng chi tiêu</CustomText>
            </View>
            <CustomText type="bold" size={20} style={{ marginTop: normalize(8) }}>
              {formatCurrency(totalExpense, selectedWallet?.currency)}
            </CustomText>
            <View style={styles.changeIndicator}>
              <FontAwesome6 name="arrow-down" size={normalize(10)} color="#F44336" />
              <CustomText size={12} style={{ color: '#F44336' }}>
                {Math.abs(expenseChange)}% tháng trước
              </CustomText>
            </View>
          </View>

          {/* Total Income */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryIcon, { backgroundColor: '#E8F5E9' }]}>
                <FontAwesome6 name="arrow-trend-up" size={normalize(16)} color="#4CAF50" />
              </View>
              <CustomText size={14}>Tổng thu nhập</CustomText>
            </View>
            <CustomText type="bold" size={20} style={{ marginTop: normalize(8) }}>
              {formatCurrency(totalIncome, selectedWallet?.currency)}
            </CustomText>
            <View style={styles.changeIndicator}>
              <FontAwesome6 name="arrow-up" size={normalize(10)} color="#4CAF50" />
              <CustomText size={12} style={{ color: '#4CAF50' }}>
                +{incomeChange}% tháng trước
              </CustomText>
            </View>
          </View>
        </View>

        {/* ===== NET BALANCE ===== */}
        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <View style={styles.balanceHeader}>
            <View style={[styles.balanceIcon, { backgroundColor: colors.tint + '20' }]}>
              <FontAwesome6 name="shield-halved" size={normalize(16)} color={colors.tint} />
            </View>
            <CustomText size={14}>Tổng số dư ròng</CustomText>
          </View>
          <CustomText type="bold" size={24} style={{ marginTop: normalize(8) }}>
            {balanceLoading ? "Loading..." : formatCurrency(netBalance, selectedWallet?.currency)}
          </CustomText>

          <View style={styles.balanceDetails}>
            <View style={styles.balanceDetailRow}>
              <CustomText size={13}>Số dư đầu</CustomText>
              <CustomText type="medium" size={13}>
                {formatCurrency(openingBalance, selectedWallet?.currency)}
              </CustomText>
            </View>
            <View style={styles.balanceDetailRow}>
              <CustomText size={13}>Số dư cuối</CustomText>
              <CustomText type="medium" size={13}>
                {formatCurrency(closingBalance, selectedWallet?.currency)}
              </CustomText>
            </View>
          </View>
        </View>

        {/* ===== DEBT SECTION ===== */}
        <View style={[styles.debtCard, { backgroundColor: colors.card }]}>
          {MOCK_DEBT_DETAILS.map((item, index) => (
            <View key={index} style={styles.debtRow}>
              <CustomText size={14}>{item.label}</CustomText>
              <CustomText type="medium" size={14}>
                {formatCurrency(item.amount)}
              </CustomText>
            </View>
          ))}
        </View>

        <SectionHeader
          title="Báo cáo theo nhóm"
          showAction={true}
          actionText='Xem chi tiết'
          onPressAction={handleViewDetail}
        />

        {/* ===== PIE CHARTS ===== */}
        <View style={{ marginHorizontal: wp(5) }}>
          {analyzing ? (
            <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
              <CustomText size={14} style={{ color: colors.text, textAlign: 'center' }}>
                Đang tải dữ liệu...
              </CustomText>
            </View>
          ) : (
            <>
              {expensePieData.length > 0 ? (
                <PieChartWithLabels
                  data={expensePieData}
                  title="Khoản chi"
                  backgroundColor={colors.card}
                />
              ) : (
                <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                  <FontAwesome6 name="chart-pie" size={normalize(32)} color={colors.icon} />
                  <CustomText size={14} style={{ color: colors.text, marginTop: normalize(8) }}>
                    Không có dữ liệu chi tiêu
                  </CustomText>
                </View>
              )}
              {incomePieData.length > 0 ? (
                <PieChartWithLabels
                  data={incomePieData}
                  title="Khoản thu"
                  backgroundColor={colors.card}
                />
              ) : (
                <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                  <FontAwesome6 name="chart-pie" size={normalize(32)} color={colors.icon} />
                  <CustomText size={14} style={{ color: colors.text, marginTop: normalize(8) }}>
                    Không có dữ liệu thu nhập
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

  periodTabs: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginVertical: hp(2),
    gap: normalize(8),
  },
  periodTab: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(0,0,0,0.05)',
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

  balanceCard: {
    marginHorizontal: wp(5),
    padding: normalize(16),
    borderRadius: normalize(12),
    marginBottom: normalize(16),
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  balanceIcon: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceDetails: {
    marginTop: normalize(16),
    gap: normalize(8),
  },
  balanceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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