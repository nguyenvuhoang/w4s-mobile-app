import CustomText from '@/components/base/CustomText';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: 'https://via.placeholder.com/50' }}
              style={styles.avatar}
            />
            <View>
              <CustomText style={styles.greeting}>Chào, HOANG</CustomText>
              <CustomText style={styles.date}>T4, 14 Th12, 2025</CustomText>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <CustomText style={styles.balanceLabel}>Tổng Số Dư</CustomText>
          <CustomText style={styles.balanceAmount}>$24,582.50</CustomText>
          
          <View style={styles.balanceDetails}>
            <View style={styles.balanceItem}>
              <CustomText style={styles.balanceSubLabel}>Thu vào</CustomText>
              <CustomText style={styles.incomeAmount}>+$8,420.00</CustomText>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceItem}>
              <CustomText style={styles.balanceSubLabel}>Chi Ra</CustomText>
              <CustomText style={styles.expenseAmount}>-$3,285.40</CustomText>
            </View>
          </View>
          <CustomText style={styles.month}>Tháng 12</CustomText>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="arrow-up" size={24} color="#fff" />
            </View>
            <CustomText style={styles.actionLabel}>Gửi</CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#F5F5F7' }]}>
              <Ionicons name="arrow-down" size={24} color="#000" />
            </View>
            <CustomText style={styles.actionLabel}>Nhận</CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#F5F5F7' }]}>
              <Ionicons name="card-outline" size={24} color="#000" />
            </View>
            <CustomText style={styles.actionLabel}>Thẻ</CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#F5F5F7' }]}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
            </View>
            <CustomText style={styles.actionLabel}>Thêm</CustomText>
          </TouchableOpacity>
        </View>

        {/* Spending Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText style={styles.sectionTitle}>Chi tiêu nhiều nhất</CustomText>
            <TouchableOpacity>
              <CustomText style={styles.seeMore}>Xem Thêm</CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryList}>
            <CategoryItem
              icon="🛒"
              name="Mua sắm"
              transactions="32 Giao dịch"
              amount="1,248,000 đ"
              color="#FF6B35"
              progress={0.75}
            />
            <CategoryItem
              icon="🍴"
              name="Thực phẩm"
              transactions="28 Giao dịch"
              amount="842,000 đ"
              color="#4CAF50"
              progress={0.6}
            />
            <CategoryItem
              icon="🎬"
              name="Giải trí"
              transactions="15 Giao dịch"
              amount="425,000 đ"
              color="#9C27B0"
              progress={0.4}
            />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText style={styles.sectionTitle}>Giao dịch gần đây</CustomText>
            <TouchableOpacity>
              <CustomText style={styles.seeMore}>Xem thêm</CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionList}>
            <TransactionItem
              icon="🛍️"
              iconBg="#E3F2FD"
              name="Nội Thất"
              time="Hôm nay, 2:30 PM"
              amount="-89,000 đ"
              isExpense
            />
            <TransactionItem
              icon="💰"
              iconBg="#E8F5E9"
              name="Lương hàng tháng"
              time="Hôm qua, 9:00 AM"
              amount="+24,200,000 đ"
              isExpense={false}
            />
            <TransactionItem
              icon="🛍️"
              iconBg="#FFF3E0"
              name="Shopee"
              time="Hôm qua, 8:15 AM"
              amount="-6,000 đ"
              isExpense
            />
            <TransactionItem
              icon="🛍️"
              iconBg="#E3F2FD"
              name="Nội Thất"
              time="Hôm qua, 2:30 PM"
              amount="-89,000 đ"
              isExpense
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Category Item Component
const CategoryItem = ({ icon, name, transactions, amount, color, progress }: any) => (
  <View style={styles.categoryItem}>
    <View style={styles.categoryLeft}>
      <View style={[styles.categoryIcon, { backgroundColor: color + '20' }]}>
        <CustomText style={styles.categoryEmoji}>{icon}</CustomText>
      </View>
      <View>
        <CustomText style={styles.categoryName}>{name}</CustomText>
        <CustomText style={styles.categoryTransactions}>{transactions}</CustomText>
      </View>
    </View>
    <CustomText style={styles.categoryAmount}>{amount}</CustomText>
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  </View>
);

// Transaction Item Component
const TransactionItem = ({ icon, iconBg, name, time, amount, isExpense }: any) => (
  <View style={styles.transactionItem}>
    <View style={[styles.transactionIcon, { backgroundColor: iconBg }]}>
      <CustomText style={styles.transactionEmoji}>{icon}</CustomText>
    </View>
    <View style={styles.transactionInfo}>
      <CustomText style={styles.transactionName}>{name}</CustomText>
      <CustomText style={styles.transactionTime}>{time}</CustomText>
    </View>
    <CustomText style={[styles.transactionAmount, isExpense ? styles.expenseText : styles.incomeText]}>
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  date: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  balanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#fff',
    opacity: 0.3,
  },
  balanceSubLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  month: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: '#000',
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
    position: 'relative',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
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
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  categoryTransactions: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  categoryAmount: {
    position: 'absolute',
    right: 16,
    top: 24,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F5F5F7',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  transactionList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionEmoji: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  transactionTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  expenseText: {
    color: '#FF3B30',
  },
  incomeText: {
    color: '#34C759',
  },
});

export default HomeScreen;