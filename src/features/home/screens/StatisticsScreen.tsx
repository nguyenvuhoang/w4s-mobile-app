import CustomText from '@/components/base/CustomText';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface StatisticsScreenProps {
  navigation: any;
}

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Tháng');
  const [selectedTab, setSelectedTab] = useState('Chi tiêu');

  const periods = ['Ngày', 'Tuần', 'Tháng', 'Năm'];
  const tabs = ['Chi tiêu', 'Thu nhập'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <CustomText style={styles.headerTitle}>Thống kê</CustomText>
          <TouchableOpacity>
            <Ionicons name="filter-outline" size={24} color="#000" />
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
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <CustomText
                style={[
                  styles.periodText,
                  selectedPeriod === period && styles.periodTextActive,
                ]}
              >
                {period}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                selectedTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <CustomText
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Amount Card */}
        <View style={styles.totalCard}>
          <CustomText style={styles.totalLabel}>
            Tổng {selectedTab.toLowerCase()}
          </CustomText>
          <CustomText style={styles.totalAmount}>
            {selectedTab === 'Chi tiêu' ? '-' : '+'}$3,285.40
          </CustomText>
          <View style={styles.changeContainer}>
            <Ionicons
              name={selectedTab === 'Chi tiêu' ? 'arrow-up' : 'arrow-down'}
              size={16}
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
        <View style={styles.chartContainer}>
          <CustomText style={styles.chartTitle}>Biểu đồ chi tiêu</CustomText>
          <View style={styles.chartPlaceholder}>
            {/* This would be replaced with actual chart library */}
            <View style={styles.barChart}>
              {[40, 70, 45, 85, 60, 95, 75].map((height, index) => (
                <View key={index} style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${height}%` },
                      index === 3 && styles.barActive,
                    ]}
                  />
                  <CustomText style={styles.barLabel}>
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
            <CustomText style={styles.sectionTitle}>
              Phân tích theo danh mục
            </CustomText>
            <TouchableOpacity>
              <CustomText style={styles.seeMore}>Xem tất cả</CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryList}>
            <CategoryBreakdown
              icon="🛒"
              name="Mua sắm"
              amount="1,248,000 đ"
              percentage={38}
              color="#FF6B35"
            />
            <CategoryBreakdown
              icon="🍴"
              name="Thực phẩm"
              amount="842,000 đ"
              percentage={26}
              color="#4CAF50"
            />
            <CategoryBreakdown
              icon="🚗"
              name="Giao thông"
              amount="625,000 đ"
              percentage={19}
              color="#2196F3"
            />
            <CategoryBreakdown
              icon="🎬"
              name="Giải trí"
              amount="425,000 đ"
              percentage={13}
              color="#9C27B0"
            />
            <CategoryBreakdown
              icon="💡"
              name="Hóa đơn"
              amount="145,000 đ"
              percentage={4}
              color="#FF9800"
            />
          </View>
        </View>

        {/* Monthly Comparison */}
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>So sánh theo tháng</CustomText>
          <View style={styles.comparisonContainer}>
            <MonthComparison month="T10" amount="2,850,000 đ" />
            <MonthComparison month="T11" amount="3,120,000 đ" />
            <MonthComparison month="T12" amount="3,285,400 đ" isActive />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Category Breakdown Component
const CategoryBreakdown = ({ icon, name, amount, percentage, color }: any) => (
  <View style={styles.categoryItem}>
    <View style={styles.categoryLeft}>
      <View style={[styles.categoryIcon, { backgroundColor: color + '20' }]}>
        <CustomText style={styles.categoryEmoji}>{icon}</CustomText>
      </View>
      <View style={styles.categoryInfo}>
        <CustomText style={styles.categoryName}>{name}</CustomText>
        <CustomText style={styles.categoryAmount}>{amount}</CustomText>
      </View>
    </View>
    <View style={styles.categoryRight}>
      <CustomText style={styles.categoryPercentage}>{percentage}%</CustomText>
      <View style={styles.percentageBarContainer}>
        <View
          style={[
            styles.percentageBar,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  </View>
);

// Month Comparison Component
const MonthComparison = ({ month, amount, isActive }: any) => (
  <View style={[styles.monthCard, isActive && styles.monthCardActive]}>
    <CustomText style={[styles.monthLabel, isActive && styles.monthLabelActive]}>
      {month}
    </CustomText>
    <CustomText style={[styles.monthAmount, isActive && styles.monthAmountActive]}>
      {amount}
    </CustomText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  periodSelector: {
    marginBottom: 16,
  },
  periodContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodText: {
    fontSize: 14,
    color: '#000',
  },
  periodTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
  },
  increaseText: {
    color: '#FF3B30',
  },
  decreaseText: {
    color: '#34C759',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  chartPlaceholder: {
    height: 200,
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
    gap: 8,
  },
  bar: {
    width: '70%',
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
  barActive: {
    backgroundColor: '#007AFF',
  },
  barLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeMore: {
    fontSize: 14,
    color: '#007AFF',
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  categoryRight: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  categoryPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  percentageBarContainer: {
    width: 60,
    height: 4,
    backgroundColor: '#F5F5F7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  percentageBar: {
    height: '100%',
    borderRadius: 2,
  },
  comparisonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  monthCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  monthCardActive: {
    backgroundColor: '#007AFF',
  },
  monthLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  monthLabelActive: {
    color: '#fff',
  },
  monthAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  monthAmountActive: {
    color: '#fff',
  },
});

export default StatisticsScreen;