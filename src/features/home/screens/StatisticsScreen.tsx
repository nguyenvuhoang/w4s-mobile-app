import CustomText from '@/components/base/CustomText';
import SectionHeader from '@/components/base/SectionHeader';
import LineChartCard from '@/components/chart/LineChartCard';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/* ================= MOCK DATA ================= */

const MOCK_WALLETS = [
  { id: '1', name: 'Tiền mặt', icon: 'money-bill', color: '#4CAF50', balance: 2547000 },
  { id: '2', name: 'Ngân hàng A', icon: 'building-columns', color: '#2196F3', balance: 5892000 },
  { id: '3', name: 'Ngân hàng B', icon: 'building-columns', color: '#F44336', balance: 8234000 },
];

const MOCK_CATEGORIES = [
  { id: '1', name: 'Mua sắm', icon: 'bag-shopping', color: '#FF6B35', amount: 1248000, percentage: 38 },
  { id: '2', name: 'Thực phẩm', icon: 'utensils', color: '#4CAF50', amount: 842000, percentage: 26 },
  { id: '3', name: 'Giải trí', icon: 'film', color: '#9C27B0', amount: 425000, percentage: 42 },
  { id: '4', name: 'Di chuyển', icon: 'car', color: '#00BCD4', amount: 385000, percentage: 10 },
  { id: '5', name: 'Tiện ích', icon: 'bolt', color: '#FF9800', amount: 356000, percentage: 13 },
];

// const MOCK_MONTHLY_EXPENSES = [
//   { value: 450000, label: '1' },
//   { value: 380000, label: '2' },
//   { value: 520000, label: '3' },
// ];

const MOCK_MONTHLY_EXPENSES = Array.from({ length: 31 }, (_, i) => ({
  value: Math.floor(Math.random() * 100000000) + 200000,
  label: `${i + 1}`,
}));


// const MOCK_MONTHLY_INCOME = [
//   { value: 50000, label: '1' },
//   { value: 120000, label: '5' },
// ];

const MOCK_MONTHLY_INCOME = Array.from({ length: 31 }, (_, i) => ({
  value: Math.floor(Math.random() * 50000) + 50000,
  label: `${i + 1}`,
}));

const MOCK_FREQUENT_EXPENSES = [
  { id: '1', name: 'Shoppe', category: 'Mua sắm', icon: 'bag-shopping', color: '#EE4D2D', amount: 89000 },
  { id: '2', name: 'Starbucks', category: 'Thực phẩm', icon: 'mug-hot', color: '#00704A', amount: 45000 },
];

/* ================= SCREEN ================= */

const StatisticsScreen = () => {
  const { colors } = useAppTheme();

  const totalBalance = useMemo(
    () => MOCK_WALLETS.reduce((sum, w) => sum + w.balance, 0),
    []
  );

  const formatCurrency = (v: number) =>
    v.toLocaleString('vi-VN') + ' đ';

  const formatYLabel = (value: string) => {
    const num = Number(value);
    if (num >= 1_000_000) return `${Math.round(num / 1_000_000)}tr`;
    if (num >= 1_000) return `${Math.round(num / 1_000)}k`;
    return '0';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ===== TOTAL BALANCE ===== */}
        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <View style={styles.balanceHeader}>
            <View style={[styles.balanceIcon, { backgroundColor: colors.tint + '20' }]}>
              <FontAwesome6 name="shield-halved" size={normalize(18)} color={colors.tint} />
            </View>
            <CustomText type="medium" size={14}>
              Tổng số dư
            </CustomText>
          </View>
          <CustomText type="bold" size={32}>
            {formatCurrency(totalBalance)}
          </CustomText>
        </View>

        {/* ===== WALLETS ===== */}
        <SectionHeader title="Ví của tôi" showAction={true} onPressAction={() => router.push('/(protected)/wallet-list')} />

        <View style={styles.walletList}>
          {MOCK_WALLETS.map(w => (
            <View key={w.id} style={[styles.walletItem, { backgroundColor: colors.card }]}>
              <View style={[styles.walletIcon, { backgroundColor: w.color }]}>
                <FontAwesome6 name={w.icon as any} size={normalize(16)} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText type="medium" size={15}>{w.name}</CustomText>
                <CustomText size={13}>{formatCurrency(w.balance)}</CustomText>
              </View>
            </View>
          ))}
        </View>

        {/* ===== CHARTS ===== */}
        <SectionHeader title="Báo cáo tháng này" showAction={true} actionText='Xem báo cáo' onPressAction={() => router.push('../report')} />

        <LineChartCard
          label="Khoản chi"
          color="#F44336"
          data={MOCK_MONTHLY_EXPENSES}
          formatYLabel={formatYLabel}
        />

        <LineChartCard
          label="Khoản thu"
          color="#2196F3"
          data={MOCK_MONTHLY_INCOME}
          formatYLabel={formatYLabel}
        />

        {/* ===== CATEGORY ===== */}
        <SectionHeader title="Phân tích danh mục" />

        <View style={styles.categoryList}>
          {MOCK_CATEGORIES.map(c => (
            <View key={c.id} style={[styles.categoryItem, { backgroundColor: colors.card }]}>
              <View style={styles.categoryRow}>
                <View style={[styles.categoryIcon, { backgroundColor: c.color }]}>
                  <FontAwesome6 name={c.icon as any} size={normalize(18)} color="#fff" />
                </View>
                <CustomText type="medium" size={15}>{c.name}</CustomText>
              </View>

              <View style={styles.categoryRight}>
                <CustomText type="medium" size={13}>{c.percentage}%</CustomText>
                <CustomText type="bold" size={15}>{formatCurrency(c.amount)}</CustomText>
              </View>

              <View style={[styles.progressBg, { backgroundColor: colors.background }]}>
                <View style={[styles.progressFill, { width: `${c.percentage}%`, backgroundColor: c.color }]} />
              </View>
            </View>
          ))}
        </View>

        {/* ===== FREQUENT ===== */}
        <SectionHeader title="Chi phí hằng ngày" />

        <View style={styles.frequentList}>
          {MOCK_FREQUENT_EXPENSES.map(i => (
            <View key={i.id} style={[styles.frequentItem, { backgroundColor: colors.card }]}>
              <View style={[styles.frequentIcon, { backgroundColor: i.color }]}>
                <FontAwesome6 name={i.icon as any} size={normalize(18)} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText type="medium" size={15}>{i.name}</CustomText>
                <CustomText size={13}>{i.category}</CustomText>
              </View>
              <CustomText type="bold" size={15}>
                {formatCurrency(i.amount)}
              </CustomText>
            </View>
          ))}
        </View>

        <View style={{ height: hp(8) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  balanceCard: {
    margin: wp(5),
    padding: normalize(20),
    borderRadius: normalize(16),
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(10),
  },
  balanceIcon: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(8),
  },

  sectionHeader: {
    paddingHorizontal: wp(5),
    marginBottom: normalize(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  walletList: { paddingHorizontal: wp(5), gap: normalize(12) },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(12),
    borderRadius: normalize(12),
    gap: normalize(12),
  },
  walletIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },

  chartCard: {
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    padding: normalize(16),
    borderRadius: normalize(16),
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  legendDot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: 5,
    marginRight: normalize(8),
  },

  categoryList: { paddingHorizontal: wp(5), gap: normalize(12) },
  categoryItem: {
    padding: normalize(16),
    borderRadius: normalize(12),
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
  },
  categoryIcon: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRight: {
    position: 'absolute',
    right: normalize(16),
    top: normalize(16),
    alignItems: 'flex-end',
  },
  progressBg: {
    height: normalize(6),
    borderRadius: 3,
    marginTop: normalize(10),
    overflow: 'hidden',
  },
  progressFill: { height: '100%' },

  frequentList: { paddingHorizontal: wp(5), gap: normalize(12) },
  frequentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(12),
    borderRadius: normalize(12),
    gap: normalize(12),
  },
  frequentIcon: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StatisticsScreen;
