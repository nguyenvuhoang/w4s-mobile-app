import CustomButton from '@/components/base/CustomButton';
import CustomText from '@/components/base/CustomText';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BudgetScreenProps {
  navigation: any;
}

const BudgetScreen: React.FC<BudgetScreenProps> = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Tháng này');
  const [showAddModal, setShowAddModal] = useState(false);

  const periods = ['Tuần này', 'Tháng này', 'Năm này'];

  const budgets = [
    {
      id: '1',
      category: 'Mua sắm',
      icon: '🛒',
      color: '#FF6B35',
      spent: 1248000,
      total: 2000000,
      percentage: 62.4,
    },
    {
      id: '2',
      category: 'Thực phẩm',
      icon: '🍴',
      color: '#4CAF50',
      spent: 842000,
      total: 1500000,
      percentage: 56.1,
    },
    {
      id: '3',
      category: 'Giao thông',
      icon: '🚗',
      color: '#2196F3',
      spent: 625000,
      total: 800000,
      percentage: 78.1,
    },
    {
      id: '4',
      category: 'Giải trí',
      icon: '🎬',
      color: '#9C27B0',
      spent: 425000,
      total: 500000,
      percentage: 85.0,
    },
  ];

  const totalBudget = budgets.reduce((sum, b) => sum + b.total, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalPercentage = (totalSpent / totalBudget) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <CustomText style={styles.headerTitle}>Ngân sách</CustomText>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={28} color="#007AFF" />
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

        {/* Overall Budget Card */}
        <View style={styles.overallCard}>
          <View style={styles.overallHeader}>
            <CustomText style={styles.overallTitle}>Tổng ngân sách</CustomText>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.overallAmount}>
            <CustomText style={styles.spentAmount}>
              {totalSpent.toLocaleString('vi-VN')} đ
            </CustomText>
            <CustomText style={styles.totalAmount}>
              / {totalBudget.toLocaleString('vi-VN')} đ
            </CustomText>
          </View>

          {/* Progress Bar */}
          <View style={styles.overallProgressContainer}>
            <View
              style={[
                styles.overallProgress,
                {
                  width: `${Math.min(totalPercentage, 100)}%`,
                  backgroundColor: totalPercentage > 90 ? '#FF3B30' : '#007AFF',
                },
              ]}
            />
          </View>

          <View style={styles.overallStats}>
            <View style={styles.statItem}>
              <CustomText style={styles.statLabel}>Đã chi</CustomText>
              <CustomText style={styles.statValue}>
                {totalPercentage.toFixed(1)}%
              </CustomText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <CustomText style={styles.statLabel}>Còn lại</CustomText>
              <CustomText style={styles.statValue}>
                {(totalBudget - totalSpent).toLocaleString('vi-VN')} đ
              </CustomText>
            </View>
          </View>
        </View>

        {/* Budget List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText style={styles.sectionTitle}>
              Ngân sách theo danh mục
            </CustomText>
            <CustomText style={styles.budgetCount}>{budgets.length} danh mục</CustomText>
          </View>

          <View style={styles.budgetList}>
            {budgets.map((budget) => (
              <BudgetItem key={budget.id} budget={budget} />
            ))}
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color="#FF9800" />
            <CustomText style={styles.tipsTitle}>Mẹo tiết kiệm</CustomText>
          </View>
          <CustomText style={styles.tipsText}>
            Chi tiêu giải trí của bạn đã vượt 85% ngân sách. Hãy cân nhắc giảm bớt để
            đạt mục tiêu tháng này.
          </CustomText>
        </View>
      </ScrollView>

      {/* Add Budget Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <CustomText style={styles.modalTitle}>Thêm ngân sách</CustomText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <CustomText style={styles.inputLabel}>Danh mục</CustomText>
                <TouchableOpacity style={styles.inputField}>
                  <CustomText style={styles.inputPlaceholder}>Chọn danh mục</CustomText>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <CustomText style={styles.inputLabel}>Số tiền ngân sách</CustomText>
                <View style={styles.amountInputContainer}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#C7C7CC"
                  />
                  <CustomText style={styles.currencyText}>đ</CustomText>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <CustomText style={styles.inputLabel}>Chu kỳ</CustomText>
                <View style={styles.cycleOptions}>
                  {['Tuần', 'Tháng', 'Năm'].map((cycle) => (
                    <TouchableOpacity key={cycle} style={styles.cycleButton}>
                      <CustomText style={styles.cycleText}>{cycle}</CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <CustomButton
                title="Tạo ngân sách"
                onPress={() => setShowAddModal(false)}
                style={styles.modalButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Budget Item Component
const BudgetItem = ({ budget }: any) => {
  const isOverBudget = budget.percentage > 90;
  const isWarning = budget.percentage > 70 && budget.percentage <= 90;

  return (
    <TouchableOpacity style={styles.budgetItem}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View
            style={[styles.budgetIcon, { backgroundColor: budget.color + '20' }]}
          >
            <CustomText style={styles.budgetEmoji}>{budget.icon}</CustomText>
          </View>
          <View>
            <CustomText style={styles.budgetCategory}>{budget.category}</CustomText>
            <CustomText style={styles.budgetAmount}>
              {budget.spent.toLocaleString('vi-VN')} đ /{' '}
              {budget.total.toLocaleString('vi-VN')} đ
            </CustomText>
          </View>
        </View>
        <View style={styles.budgetRight}>
          <CustomText
            style={[
              styles.budgetPercentage,
              isOverBudget && styles.overBudgetText,
              isWarning && styles.warningText,
            ]}
          >
            {budget.percentage.toFixed(1)}%
          </CustomText>
          {isOverBudget && (
            <Ionicons name="alert-circle" size={16} color="#FF3B30" />
          )}
        </View>
      </View>

      <View style={styles.budgetProgressContainer}>
        <View
          style={[
            styles.budgetProgress,
            {
              width: `${Math.min(budget.percentage, 100)}%`,
              backgroundColor: isOverBudget
                ? '#FF3B30'
                : isWarning
                ? '#FF9800'
                : budget.color,
            },
          ]}
        />
      </View>

      <CustomText style={styles.budgetRemaining}>
        Còn lại: {(budget.total - budget.spent).toLocaleString('vi-VN')} đ
      </CustomText>
    </TouchableOpacity>
  );
};

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
    marginBottom: 20,
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
  overallCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  overallAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  spentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  totalAmount: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 4,
  },
  overallProgressContainer: {
    height: 12,
    backgroundColor: '#F5F5F7',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  overallProgress: {
    height: '100%',
    borderRadius: 6,
  },
  overallStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
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
  },
  budgetCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  budgetList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  budgetItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  budgetIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetEmoji: {
    fontSize: 24,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  budgetAmount: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  budgetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  budgetPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  overBudgetText: {
    color: '#FF3B30',
  },
  warningText: {
    color: '#FF9800',
  },
  budgetProgressContainer: {
    height: 6,
    backgroundColor: '#F5F5F7',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  budgetProgress: {
    height: '100%',
    borderRadius: 3,
  },
  budgetRemaining: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tipsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  inputField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
  },
  inputPlaceholder: {
    fontSize: 16,
    color: '#C7C7CC',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  currencyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 8,
  },
  cycleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  cycleButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    alignItems: 'center',
  },
  cycleText: {
    fontSize: 14,
    color: '#000',
  },
  modalButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default BudgetScreen;