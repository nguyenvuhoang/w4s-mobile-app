import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/* ================= MOCK DATA ================= */

const MOCK_WALLETS = [
  { id: '1', name: 'Ngân hàng A', icon: 'building-columns', color: '#2196F3' },
  { id: '2', name: 'Tiền mặt', icon: 'money-bill', color: '#4CAF50' },
  { id: '3', name: 'Ngân hàng B', icon: 'building-columns', color: '#F44336' },
];

const TIME_PERIODS = [
  { id: '1', label: 'TH09/25' },
  { id: '2', label: 'TH10/25' },
  { id: '3', label: 'TH11/25' },
  { id: '4', label: 'Tháng này' },
];

const MOCK_EXPENSE_CATEGORIES = [
  { name: 'Thực phẩm', value: 53, color: '#7B68EE' },
  { name: 'Di chuyển', value: 20, color: '#FF7B89' },
  { name: 'Mua sắm', value: 17, color: '#4DD0E1' },
  { name: 'Khác', value: 6.16, color: '#FFB74D' },
  { name: 'Giải trí', value: 10, color: '#9C27B0' },
];

const MOCK_INCOME_CATEGORIES = [
  { name: 'Lương', value: 79, color: '#7B68EE' },
  { name: 'Bán đồ', value: 12, color: '#FF7B89' },
  { name: 'Được tặng', value: 9, color: '#4DD0E1' },
];

const MOCK_BALANCE_DETAILS = [
  { label: 'Số dư đầu', amount: 3279321 },
  { label: 'Số dư cuối', amount: 5161000 },
];

const MOCK_DEBT_DETAILS = [
  { label: 'Nợ', amount: 0 },
  { label: 'Cho vay', amount: 0 },
  { label: 'Khác', amount: 0 },
];

/* ================= SCREEN ================= */

const ReportScreen = () => {
  const { colors } = useAppTheme();
  const [selectedWallet, setSelectedWallet] = useState(MOCK_WALLETS[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[3]);

  const totalExpense = 6258000;
  const totalIncome = 8420000;
  const netBalance = 5161000;
  const expenseChange = -12.5;
  const incomeChange = 8.2;

  const formatCurrency = (v: number) => v.toLocaleString('vi-VN') + ' đ';

  const renderPieChart = (data: any[], title: string) => {
    const pieData = data.map(item => ({
      value: item.value,
      color: item.color,
      text: `${item.value}%`,
    }));

    return (
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <View style={styles.chartContainer}>
          <PieChart
            data={pieData}
            donut
            radius={normalize(80)}
            innerRadius={normalize(50)}
            centerLabelComponent={() => null}
          />
          <CustomText type="medium" size={14} style={styles.chartTitle}>
            {title}
          </CustomText>
        </View>

        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <CustomText size={13} style={{ flex: 1 }}>
                {item.name}
              </CustomText>
              <CustomText type="medium" size={13}>
                {item.value}%
              </CustomText>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ===== HEADER: WALLET SELECTOR ===== */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View style={styles.walletSelector}>
            <FontAwesome6 name={selectedWallet.icon as any} size={normalize(16)} color={colors.tint} />
            <CustomText type="medium" size={15}>
              {selectedWallet.name}
            </CustomText>
            <FontAwesome6 name="chevron-down" size={normalize(14)} color={colors.tint} />
          </View>
        </View>

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
        <CustomText type="medium" size={16} style={styles.sectionTitle}>
          Thu nhập rồng
        </CustomText>

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
              {formatCurrency(totalExpense)}
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
              {formatCurrency(totalIncome)}
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
            <CustomText size={14}>Tổng số dư rồng</CustomText>
          </View>
          <CustomText type="bold" size={24} style={{ marginTop: normalize(8) }}>
            {formatCurrency(netBalance)}
          </CustomText>

          <View style={styles.balanceDetails}>
            {MOCK_BALANCE_DETAILS.map((item, index) => (
              <View key={index} style={styles.balanceDetailRow}>
                <CustomText size={13}>{item.label}</CustomText>
                <CustomText type="medium" size={13}>
                  {formatCurrency(item.amount)}
                </CustomText>
              </View>
            ))}
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

        {/* ===== CHARTS SECTION ===== */}
        <View style={styles.chartHeader}>
          <CustomText type="medium" size={16}>
            Báo cáo theo nhóm
          </CustomText>
          <TouchableOpacity>
            <CustomText type="medium" size={14} style={{ color: colors.tint }}>
              Xem chi tiết
            </CustomText>
          </TouchableOpacity>
        </View>

        {renderPieChart(MOCK_EXPENSE_CATEGORIES, 'Khoản chi')}
        {renderPieChart(MOCK_INCOME_CATEGORIES, 'Khoản chi')}

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

  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    marginBottom: normalize(12),
  },

  chartCard: {
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    padding: normalize(16),
    borderRadius: normalize(12),
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: normalize(16),
  },
  chartTitle: {
    marginTop: normalize(12),
  },
  legendContainer: {
    gap: normalize(10),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  legendDot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: 5,
  },
});

export default ReportScreen;