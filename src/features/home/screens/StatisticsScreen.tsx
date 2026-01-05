import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Tokens } from '@/core/theme/theme';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StatisticsScreenProps {
  navigation: any;
}

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ navigation }) => {
  const { colors } = useAppTheme();

  const [selectedPeriod, setSelectedPeriod] = useState('Tháng');
  const [selectedTab, setSelectedTab] = useState('Chi tiêu');

  const periods = ['Ngày', 'Tuần', 'Tháng', 'Năm'];
  const tabs = ['Chi tiêu', 'Thu nhập'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <CustomText style={[styles.headerTitle, { color: colors.text }]}>
            Thống kê
          </CustomText>
          <TouchableOpacity>
            <Ionicons name="filter-outline" size={normalize(24)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodSelector}
          contentContainerStyle={styles.periodContent}
        >
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedPeriod === period && { backgroundColor: colors.tint, borderColor: colors.tint },
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <CustomText
                style={[
                  styles.periodText,
                  { color: selectedPeriod === period ? Tokens.colors.main.white : colors.text },
                ]}
              >
                {period}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Selector */}
        <View style={[styles.tabSelector, { backgroundColor: colors.card }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                selectedTab === tab && { backgroundColor: colors.tint },
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <CustomText
                style={[
                  styles.tabText,
                  { color: selectedTab === tab ? Tokens.colors.main.white : colors.icon },
                ]}
              >
                {tab}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Amount Card */}
        <View style={[styles.totalCard, { backgroundColor: colors.card }]}>
          <CustomText style={[styles.totalLabel, { color: colors.icon }]}>
            Tổng {selectedTab.toLowerCase()}
          </CustomText>
          <CustomText style={[styles.totalAmount, { color: colors.text }]}>
            {selectedTab === 'Chi tiêu' ? '-' : '+'}3,285,400 đ
          </CustomText>
          <View style={styles.changeContainer}>
            <Ionicons
              name={selectedTab === 'Chi tiêu' ? 'arrow-up' : 'arrow-down'}
              size={normalize(16)}
              color={selectedTab === 'Chi tiêu' ? '#FF3B30' : '#34C759'}
            />
            <CustomText
              style={[
                styles.changeText,
                selectedTab === 'Chi tiêu' ? styles.increaseText : styles.decreaseText,
              ]}
            >
              +12.5% so với tháng trước
            </CustomText>
          </View>
        </View>

        {/* Chart Placeholder */}
        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <CustomText style={[styles.chartTitle, { color: colors.text }]}>
            Biểu đồ chi tiêu
          </CustomText>
          <View style={styles.chartPlaceholder}>
            {/* This would be replaced with actual chart library */}
            <View style={styles.barChart}>
              {[40, 70, 45, 85, 60, 95, 75].map((height, index) => (
                <View key={index} style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { 
                        height: `${height}%`,
                        backgroundColor: colors.border,
                      },
                      index === 3 && { backgroundColor: colors.tint },
                    ]}
                  />
                  <CustomText style={[styles.barLabel, { color: colors.icon }]}>
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][index]}
                  </CustomText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
              Phân tích theo danh mục
            </CustomText>
            <TouchableOpacity>
              <CustomText style={[styles.seeMore, { color: colors.tint }]}>
                Xem tất cả
              </CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryList}>
            <CategoryBreakdown
              icon="cart"
              iconColor="#FF6B35"
              name="Mua sắm"
              amount="1,248,000 đ"
              percentage={38}
              colors={colors}
            />
            <CategoryBreakdown
              icon="restaurant"
              iconColor="#4CAF50"
              name="Thực phẩm"
              amount="842,000 đ"
              percentage={26}
              colors={colors}
            />
            <CategoryBreakdown
              icon="car"
              iconColor="#2196F3"
              name="Giao thông"
              amount="625,000 đ"
              percentage={19}
              colors={colors}
            />
            <CategoryBreakdown
              icon="film"
              iconColor="#9C27B0"
              name="Giải trí"
              amount="425,000 đ"
              percentage={13}
              colors={colors}
            />
            <CategoryBreakdown
              icon="bulb"
              iconColor="#FF9800"
              name="Hóa đơn"
              amount="145,000 đ"
              percentage={4}
              colors={colors}
            />
          </View>
        </View>

        {/* Monthly Comparison */}
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            So sánh theo tháng
          </CustomText>
          <View style={styles.comparisonContainer}>
            <MonthComparison month="T10" amount="2,850,000 đ" colors={colors} />
            <MonthComparison month="T11" amount="3,120,000 đ" colors={colors} />
            <MonthComparison month="T12" amount="3,285,400 đ" isActive colors={colors} />
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: hp(2) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Category Breakdown Component
const CategoryBreakdown = ({ icon, iconColor, name, amount, percentage, colors }: any) => (
  <View style={[styles.categoryItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.categoryLeft}>
      <View style={[styles.categoryIcon, { backgroundColor: iconColor + '1A' }]}>
        <Ionicons name={icon} size={normalize(24)} color={iconColor} />
      </View>
      <View style={styles.categoryInfo}>
        <CustomText style={[styles.categoryName, { color: colors.text }]}>
          {name}
        </CustomText>
        <CustomText style={[styles.categoryAmount, { color: colors.icon }]}>
          {amount}
        </CustomText>
      </View>
    </View>
    <View style={styles.categoryRight}>
      <CustomText style={[styles.categoryPercentage, { color: colors.text }]}>
        {percentage}%
      </CustomText>
      <View style={[styles.percentageBarContainer, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.percentageBar,
            { width: `${percentage}%`, backgroundColor: iconColor },
          ]}
        />
      </View>
    </View>
  </View>
);

// Month Comparison Component
const MonthComparison = ({ month, amount, isActive, colors }: any) => (
  <View
    style={[
      styles.monthCard,
      { backgroundColor: colors.card, borderColor: colors.border },
      isActive && { backgroundColor: colors.tint, borderColor: colors.tint },
    ]}
  >
    <CustomText
      style={[
        styles.monthLabel,
        { color: colors.icon },
        isActive && { color: Tokens.colors.main.white },
      ]}
    >
      {month}
    </CustomText>
    <CustomText
      style={[
        styles.monthAmount,
        { color: colors.text },
        isActive && { color: Tokens.colors.main.white },
      ]}
    >
      {amount}
    </CustomText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: normalize(16),
  },
  headerTitle: {
    fontSize: normalize(24),
    fontWeight: 'bold',
  },
  periodSelector: {
    marginBottom: normalize(16),
  },
  periodContent: {
    paddingHorizontal: wp(5),
    gap: normalize(8),
  },
  periodButton: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
    borderWidth: 1,
  },
  periodText: {
    fontSize: normalize(14),
  },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: wp(5),
    marginBottom: hp(2.5),
    borderRadius: normalize(12),
    padding: normalize(4),
  },
  tabButton: {
    flex: 1,
    paddingVertical: normalize(10),
    alignItems: 'center',
    borderRadius: normalize(8),
  },
  tabText: {
    fontSize: normalize(14),
  },
  totalCard: {
    borderRadius: normalize(20),
    padding: normalize(24),
    marginHorizontal: wp(5),
    marginBottom: hp(2.5),
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: normalize(14),
    marginBottom: normalize(8),
  },
  totalAmount: {
    fontSize: normalize(36),
    fontWeight: 'bold',
    marginBottom: normalize(8),
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  changeText: {
    fontSize: normalize(12),
  },
  increaseText: {
    color: '#FF3B30',
  },
  decreaseText: {
    color: '#34C759',
  },
  chartContainer: {
    borderRadius: normalize(20),
    padding: normalize(20),
    marginHorizontal: wp(5),
    marginBottom: hp(2.5),
  },
  chartTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    marginBottom: normalize(20),
  },
  chartPlaceholder: {
    height: normalize(200),
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: normalize(8),
  },
  bar: {
    width: '70%',
    borderRadius: normalize(4),
  },
  barLabel: {
    fontSize: normalize(10),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    marginBottom: normalize(16),
  },
  sectionTitle: {
    fontSize: normalize(18),
    fontWeight: '600',
    paddingHorizontal: wp(5),
    marginBottom: normalize(16),
  },
  seeMore: {
    fontSize: normalize(14),
  },
  categoryList: {
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },
  categoryItem: {
    borderRadius: normalize(16),
    padding: normalize(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    flex: 1,
  },
  categoryIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: normalize(16),
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: normalize(14),
    marginTop: normalize(2),
  },
  categoryRight: {
    alignItems: 'flex-end',
    minWidth: normalize(60),
  },
  categoryPercentage: {
    fontSize: normalize(16),
    fontWeight: '600',
    marginBottom: normalize(4),
  },
  percentageBarContainer: {
    width: normalize(60),
    height: normalize(4),
    borderRadius: normalize(2),
    overflow: 'hidden',
  },
  percentageBar: {
    height: '100%',
    borderRadius: normalize(2),
  },
  comparisonContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },
  monthCard: {
    flex: 1,
    borderRadius: normalize(16),
    padding: normalize(16),
    alignItems: 'center',
    borderWidth: 1,
  },
  monthLabel: {
    fontSize: normalize(14),
    marginBottom: normalize(8),
  },
  monthAmount: {
    fontSize: normalize(14),
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default StatisticsScreen;