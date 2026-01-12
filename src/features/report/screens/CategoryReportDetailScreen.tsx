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
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/* ================= MOCK DATA ================= */

const EXPENSE_CATEGORIES = [
  { id: '1', name: 'Nhóm Chi Tiêu', icon: 'arrow-down', color: '#F44336' },
  { id: '2', name: 'Thực phẩm', icon: 'utensils', color: '#4CAF50' },
  { id: '3', name: 'Mua sắm', icon: 'bag-shopping', color: '#FF6B35' },
  { id: '4', name: 'Di chuyển', icon: 'car', color: '#00BCD4' },
];

const INCOME_CATEGORIES = [
  { id: '1', name: 'Nhóm Thu nhập', icon: 'arrow-up', color: '#4CAF50' },
  { id: '2', name: 'Lương', icon: 'money-bill', color: '#2196F3' },
  { id: '3', name: 'Thưởng', icon: 'gift', color: '#FF9800' },
];

const SUBCATEGORIES_EXPENSE = [
  { id: '1', name: 'Thực phẩm', icon: 'utensils', color: '#4CAF50' },
  { id: '2', name: 'Lương', icon: 'money-bill', color: '#2196F3' },
];

const SUBCATEGORIES_INCOME = [
  { id: '1', name: 'Lương', icon: 'money-bill', color: '#2196F3' },
];

const TIME_PERIODS = [
  { id: '1', label: 'TH09/25' },
  { id: '2', label: 'TH10/25' },
  { id: '3', label: 'TH11/25' },
  { id: '4', label: 'Tháng này' },
];

const MOCK_EXPENSE_TREND = [
  { value: 4500000, label: 'Tháng 11', frontColor: '#F44336' },
  { value: 3800000, label: 'Tháng 12', frontColor: '#F44336' },
  { value: 3300000, label: 'Tháng Này', frontColor: '#F44336' },
];

const MOCK_INCOME_TREND = [
  { value: 6200000, label: 'Tháng 11', frontColor: '#4CAF50' },
  { value: 7300000, label: 'Tháng 12', frontColor: '#4CAF50' },
  { value: 8700000, label: 'Tháng Này', frontColor: '#4CAF50' },
];

const MOCK_EXPENSE_TRANSACTIONS = [
  {
    id: '1',
    name: 'Ăn vặt',
    icon: 'bowl-food',
    color: '#FF9800',
    amount: -75000,
    date: '17 Sep 2025',
    time: '10:34 AM',
  },
  {
    id: '2',
    name: 'Starbucks',
    icon: 'mug-hot',
    color: '#4CAF50',
    amount: -150000,
    date: '17 Sep 2025',
    time: '10:34 AM',
  },
  {
    id: '3',
    name: 'Bữa chính',
    icon: 'utensils',
    color: '#FFB74D',
    amount: -50000,
    date: '17 Sep 2025',
    time: '10:34 AM',
  },
  {
    id: '4',
    name: 'Starbucks',
    icon: 'mug-hot',
    color: '#4CAF50',
    amount: -350000,
    date: '17 Sep 2025',
    time: '10:34 AM',
    note: 'Mời đồng nghiệp',
  },
];

const MOCK_INCOME_TRANSACTIONS = [
  {
    id: '1',
    name: 'Lương chính',
    icon: 'money-bill-wave',
    color: '#2196F3',
    amount: 7500000,
    date: '17 Sep 2025',
    time: '10:34 AM',
  },
  {
    id: '2',
    name: 'Thu nhập ngoài',
    icon: 'hand-holding-dollar',
    color: '#4CAF50',
    amount: 1150000,
    date: '17 Sep 2025',
    time: '10:34 AM',
  },
  {
    id: '3',
    name: 'Thưởng chuyên cần',
    icon: 'gift',
    color: '#FF9800',
    amount: 50000,
    date: '17 Sep 2025',
    time: '10:34 AM',
  },
];

/* ================= SCREEN ================= */

const CategoryReportDetailScreen = ({ type = 'expense' }: { type?: 'expense' | 'income' }) => {
  const { colors } = useAppTheme();
  const isExpense = type === 'expense';

  const [selectedCategory, setSelectedCategory] = useState(
    isExpense ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState(
    isExpense ? SUBCATEGORIES_EXPENSE[0] : SUBCATEGORIES_INCOME[0]
  );
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[3]);

  const currentAmount = isExpense ? 3316000 : 8700000;
  const savedAmount = isExpense ? 726000 : 600000;
  const changePercent = isExpense ? -12.5 : 5.5;

  const trendData = isExpense ? MOCK_EXPENSE_TREND : MOCK_INCOME_TREND;
  const transactions = isExpense ? MOCK_EXPENSE_TRANSACTIONS : MOCK_INCOME_TRANSACTIONS;
  const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const subcategories = isExpense ? SUBCATEGORIES_EXPENSE : SUBCATEGORIES_INCOME;

  const formatCurrency = (v: number) => {
    const formatted = Math.abs(v).toLocaleString('vi-VN') + ' đ';
    return v < 0 ? `-${formatted}` : `+${formatted}`;
  };

  const formatYLabel = (value: string) => {
    const num = Number(value);
    if (num >= 1_000_000) return `${Math.round(num / 1_000_000)}tr`;
    if (num >= 1_000) return `${Math.round(num / 1_000)}k`;
    return '0';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ===== HEADER DROPDOWNS ===== */}
        <View style={styles.headerRow}>
          {/* Category Dropdown */}
          <TouchableOpacity style={[styles.dropdown, { backgroundColor: colors.card }]}>
            <CustomText type="medium" size={15}>
              {selectedCategory.name}
            </CustomText>
            <FontAwesome6 name="chevron-down" size={normalize(14)} color={colors.tint} />
          </TouchableOpacity>

          {/* Subcategory Dropdown */}
          <TouchableOpacity style={[styles.dropdown, { backgroundColor: colors.card }]}>
            <FontAwesome6
              name={selectedSubcategory.icon as any}
              size={normalize(14)}
              color={selectedSubcategory.color}
            />
            <CustomText type="medium" size={15}>
              {selectedSubcategory.name}
            </CustomText>
            <FontAwesome6 name="chevron-down" size={normalize(14)} color={colors.tint} />
          </TouchableOpacity>
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
                style={[selectedPeriod.id === period.id && { color: '#fff' }]}
              >
                {period.label}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>

        {/* ===== TREND SECTION ===== */}
        <CustomText type="medium" size={16} style={styles.sectionTitle}>
          {isExpense ? 'Xu hướng chi tiêu' : 'Xu hướng thu nhập'}
        </CustomText>

        <View style={[styles.trendCard, { backgroundColor: colors.card }]}>
          <View style={styles.trendHeader}>
            <View style={styles.trendInfo}>
              <View
                style={[
                  styles.trendIcon,
                  { backgroundColor: isExpense ? '#FFE4E1' : '#E8F5E9' },
                ]}
              >
                <FontAwesome6
                  name={isExpense ? 'arrow-trend-down' : 'arrow-trend-up'}
                  size={normalize(16)}
                  color={isExpense ? '#F44336' : '#4CAF50'}
                />
              </View>
              <View>
                <CustomText size={13}>
                  {isExpense ? 'Chi tiêu' : 'Thu nhập'}
                </CustomText>
                <CustomText size={12} style={{ color: colors.text }}>
                  Tiết kiệm: {formatCurrency(savedAmount)}
                </CustomText>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <CustomText type="bold" size={20}>
                {formatCurrency(currentAmount)}
              </CustomText>
              <View style={styles.changeIndicator}>
                <FontAwesome6
                  name={changePercent >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={normalize(10)}
                  color={changePercent >= 0 ? '#4CAF50' : '#F44336'}
                />
                <CustomText
                  size={12}
                  style={{ color: changePercent >= 0 ? '#4CAF50' : '#F44336' }}
                >
                  {changePercent >= 0 ? '+' : ''}{changePercent}% tháng trước
                </CustomText>
              </View>
            </View>
          </View>

          {/* Bar Chart */}
          <View style={styles.chartContainer}>
            <BarChart
              data={trendData}
              width={width - wp(10) - normalize(40)}
              height={normalize(200)}
              barWidth={normalize(60)}
              spacing={normalize(40)}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={1}
              yAxisThickness={1}
              yAxisColor={colors.border}
              xAxisColor={colors.border}
              yAxisTextStyle={{ fontSize: normalize(10), color: colors.icon }}
              xAxisLabelTextStyle={{ fontSize: normalize(10), color: colors.icon }}
              formatYLabel={formatYLabel}
              noOfSections={5}
            />
          </View>
        </View>

        {/* ===== TRANSACTION HISTORY ===== */}
        <CustomText type="medium" size={16} style={styles.sectionTitle}>
          Lịch sử giao dịch
        </CustomText>

        <View style={styles.transactionList}>
          {transactions.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.transactionItem, { backgroundColor: colors.card }]}
            >
              <View style={[styles.transactionIcon, { backgroundColor: item.color }]}>
                <FontAwesome6 name={item.icon as any} size={normalize(18)} color="#fff" />
              </View>

              <View style={{ flex: 1 }}>
                <CustomText type="medium" size={15}>
                  {item.name}
                </CustomText>
                {/* {item.note && (
                  <CustomText size={12} style={{ color: colors.text }}>
                    {item.note}
                  </CustomText>
                )} */}
                <CustomText size={12} style={{ color: colors.text, marginTop: 2 }}>
                  {item.date}
                </CustomText>
                <CustomText size={11} style={{ color: colors.text }}>
                  {item.time}
                </CustomText>
              </View>

              <CustomText
                type="bold"
                size={15}
                style={{ color: item.amount < 0 ? '#F44336' : '#4CAF50' }}
              >
                {formatCurrency(item.amount)}
              </CustomText>
            </TouchableOpacity>
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

  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    gap: normalize(12),
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: normalize(12),
    borderRadius: normalize(12),
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

  trendCard: {
    marginHorizontal: wp(5),
    padding: normalize(16),
    borderRadius: normalize(12),
    marginBottom: normalize(20),
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: normalize(16),
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  trendIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    marginTop: normalize(4),
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: normalize(10),
  },

  transactionList: {
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(12),
    borderRadius: normalize(12),
    gap: normalize(12),
  },
  transactionIcon: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CategoryReportDetailScreen;