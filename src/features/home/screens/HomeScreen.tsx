import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { hp, normalize, wp } from '@/utils/layout';
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
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: 'https://via.placeholder.com/50' }}
              style={styles.avatar}
            />
            <View>
              <CustomText style={[styles.greeting, { color: colors.text }]}>
                Chào, HOANG
              </CustomText>
              <CustomText style={[styles.date, { color: colors.icon }]}>
                T4, 14 Th12, 2025
              </CustomText>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
            <Ionicons name="notifications-outline" size={normalize(24)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.tint }]}>
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
            <View style={[styles.actionIcon, { backgroundColor: colors.tint }]}>
              <Ionicons name="arrow-up" size={normalize(24)} color="#fff" />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              Gửi
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="arrow-down" size={normalize(24)} color={colors.text} />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              Nhận
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="card-outline" size={normalize(24)} color={colors.text} />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              Thẻ
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="ellipsis-horizontal" size={normalize(24)} color={colors.text} />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              Thêm
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* Spending Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
              Chi tiêu nhiều nhất
            </CustomText>
            <TouchableOpacity>
              <CustomText style={[styles.seeMore, { color: colors.tint }]}>
                Xem Thêm
              </CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryList}>
            <CategoryItem
              icon="cart-outline"
              iconColor="#FF6B35"
              name="Mua sắm"
              transactions="32 Giao dịch"
              amount="1,248,000 đ"
              color="#FF6B35"
              progress={0.75}
              colors={colors}
            />
            <CategoryItem
              icon="restaurant-outline"
              iconColor="#4CAF50"
              name="Thực phẩm"
              transactions="28 Giao dịch"
              amount="842,000 đ"
              color="#4CAF50"
              progress={0.6}
              colors={colors}
            />
            <CategoryItem
              icon="film-outline"
              iconColor="#9C27B0"
              name="Giải trí"
              transactions="15 Giao dịch"
              amount="425,000 đ"
              color="#9C27B0"
              progress={0.4}
              colors={colors}
            />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
              Giao dịch gần đây
            </CustomText>
            <TouchableOpacity>
              <CustomText style={[styles.seeMore, { color: colors.tint }]}>
                Xem thêm
              </CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionList}>
            <TransactionItem
              icon="bag"
              iconColor="#2196F3"
              name="Nội Thất"
              time="Hôm nay, 2:30 PM"
              amount="-89,000 đ"
              isExpense
              colors={colors}
            />
            <TransactionItem
              icon="cash"
              iconColor="#4CAF50"
              name="Lương hàng tháng"
              time="Hôm qua, 9:00 AM"
              amount="+24,200,000 đ"
              isExpense={false}
              colors={colors}
            />
            <TransactionItem
              icon="cart"
              iconColor="#FF9800"
              name="Shopee"
              time="Hôm qua, 8:15 AM"
              amount="-6,000 đ"
              isExpense
              colors={colors}
            />
            <TransactionItem
              icon="home"
              iconColor="#2196F3"
              name="Nội Thất"
              time="Hôm qua, 2:30 PM"
              amount="-89,000 đ"
              isExpense
              colors={colors}
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: hp(2) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Category Item Component
const CategoryItem = ({ icon, iconColor, name, transactions, amount, color, progress, colors }: any) => (
  <View style={[styles.categoryItem, { backgroundColor: colors.card }]}>
    <View style={styles.categoryLeft}>
      <View style={[styles.categoryIcon, { backgroundColor: iconColor }]}>
        <Ionicons name={icon} size={normalize(24)} color="#fff" />
      </View>
      <View>
        <CustomText style={[styles.categoryName, { color: colors.text }]}>
          {name}
        </CustomText>
        <CustomText style={[styles.categoryTransactions, { color: colors.icon }]}>
          {transactions}
        </CustomText>
      </View>
    </View>
    <CustomText style={[styles.categoryAmount, { color: colors.text }]}>
      {amount}
    </CustomText>
    <View style={[styles.progressBarContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  </View>
);

// Transaction Item Component
const TransactionItem = ({ icon, iconColor, name, time, amount, isExpense, colors }: any) => (
  <View style={[styles.transactionItem, { backgroundColor: colors.card }]}>
    <View style={[styles.transactionIcon, { backgroundColor: iconColor + '1A' }]}>
      <Ionicons name={icon} size={normalize(24)} color={iconColor} />
    </View>
    <View style={styles.transactionInfo}>
      <CustomText style={[styles.transactionName, { color: colors.text }]}>
        {name}
      </CustomText>
      <CustomText style={[styles.transactionTime, { color: colors.icon }]}>
        {time}
      </CustomText>
    </View>
    <CustomText style={[styles.transactionAmount, isExpense ? styles.expenseText : styles.incomeText]}>
      {amount}
    </CustomText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: normalize(50),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: normalize(16),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  avatar: {
    width: normalize(50),
    height: normalize(50),
    borderRadius: normalize(25),
  },
  greeting: {
    fontSize: normalize(18),
    fontWeight: '600',
  },
  date: {
    fontSize: normalize(12),
    marginTop: normalize(2),
  },
  balanceCard: {
    borderRadius: normalize(24),
    padding: normalize(24),
    marginHorizontal: wp(5),
    marginBottom: hp(2.5),
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: normalize(14),
    color: '#fff',
    opacity: 0.8,
    marginBottom: normalize(8),
  },
  balanceAmount: {
    fontSize: normalize(36),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: normalize(20),
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
    height: normalize(40),
    backgroundColor: '#fff',
    opacity: 0.3,
  },
  balanceSubLabel: {
    fontSize: normalize(12),
    color: '#fff',
    opacity: 0.8,
    marginBottom: normalize(4),
  },
  incomeAmount: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: '#fff',
  },
  expenseAmount: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: '#fff',
  },
  month: {
    fontSize: normalize(12),
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: normalize(12),
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: wp(5),
    marginBottom: hp(3),
  },
  actionButton: {
    alignItems: 'center',
    gap: normalize(8),
  },
  actionIcon: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: normalize(12),
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
    position: 'relative',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    marginBottom: normalize(8),
  },
  categoryIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: normalize(16),
    fontWeight: '600',
  },
  categoryTransactions: {
    fontSize: normalize(12),
    marginTop: normalize(2),
  },
  categoryAmount: {
    position: 'absolute',
    right: normalize(16),
    top: normalize(24),
    fontSize: normalize(16),
    fontWeight: '600',
  },
  progressBarContainer: {
    height: normalize(6),
    borderRadius: normalize(3),
    overflow: 'hidden',
    marginTop: normalize(8),
  },
  progressBar: {
    height: '100%',
    borderRadius: normalize(3),
  },
  transactionList: {
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },
  transactionItem: {
    borderRadius: normalize(16),
    padding: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  transactionIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: normalize(16),
    fontWeight: '600',
  },
  transactionTime: {
    fontSize: normalize(12),
    marginTop: normalize(2),
  },
  transactionAmount: {
    fontSize: normalize(16),
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