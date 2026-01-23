import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useFinanceSummary } from "@/features/home/hooks/Usefinancesummary";
import { styles } from "@/features/home/styles/HomeScreen.Style";
import { getCurrentDateString, getCurrentMonthString } from "@/utils/formatDate";
import { formatPercent } from "@/utils/formatNumber";
import { hp, normalize } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors } = useAppTheme();

  // Fetch finance data (amounts are pre-formatted by server)
  const { data, loading, error, refresh } = useFinanceSummary();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Format currency helper
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "...";
    return amount.toLocaleString("vi-VN") + " ₫";
  };

  const incomeTotal = data?.income_expense_summary.income.total || 0;
  const expenseTotal = data?.income_expense_summary.expense.total || 0;
  const totalBalance = incomeTotal - expenseTotal;

  const incomeFormatted = formatCurrency(incomeTotal);
  const expenseFormatted = formatCurrency(expenseTotal);
  const balanceFormatted = formatCurrency(totalBalance);

  const incomePercent = data?.income_expense_summary.income.change_percent || 0;
  const expensePercent = data?.income_expense_summary.expense.change_percent || 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: "https://via.placeholder.com/50" }}
              style={styles.avatar}
            />
            <View>
              <CustomText style={[styles.greeting, { color: colors.text }]}>
                Chào, HOANG
              </CustomText>
              <CustomText style={[styles.date, { color: colors.icon }]}>
                {getCurrentDateString()}
              </CustomText>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Notification")}>
            <Ionicons
              name="notifications-outline"
              size={normalize(24)}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        {loading && !data ? (
          <View
            style={[
              styles.balanceCard,
              {
                backgroundColor: colors.tint,
                justifyContent: "center",
                alignItems: "center",
                minHeight: 200,
              },
            ]}
          >
            <ActivityIndicator size="large" color="#fff" />
            <CustomText
              style={[styles.balanceSubLabel, { color: "#fff", marginTop: 8 }]}
            >
              Đang tải dữ liệu...
            </CustomText>
          </View>
        ) : error ? (
          <View style={[styles.balanceCard, { backgroundColor: colors.tint }]}>
            <CustomText style={[styles.balanceLabel, { color: "#fff" }]}>
              Lỗi tải dữ liệu
            </CustomText>
            <CustomText
              style={[styles.balanceSubLabel, { color: "#fff", marginTop: 8 }]}
            >
              {error}
            </CustomText>
            <TouchableOpacity
              onPress={refresh}
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 8,
                alignSelf: "flex-start",
              }}
            >
              <CustomText style={{ color: "#fff", fontWeight: "600" }}>
                Thử lại
              </CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.balanceCard, { backgroundColor: colors.tint }]}>
            <CustomText style={styles.balanceLabel}>Tổng Số Dư</CustomText>
            <CustomText style={styles.balanceAmount}>
              {balanceFormatted}
            </CustomText>

            <View style={styles.balanceDetails}>
              <View style={styles.balanceItem}>
                <CustomText style={styles.balanceSubLabel}>Thu vào</CustomText>
                <CustomText style={styles.incomeAmount}>
                  +{incomeFormatted}
                </CustomText>
                {incomePercent !== 0 && (
                  <CustomText
                    style={[styles.changePercent, { color: "#4CAF50" }]}
                  >
                    {formatPercent(incomePercent)}
                  </CustomText>
                )}
              </View>
              <View style={styles.divider} />
              <View style={styles.balanceItem}>
                <CustomText style={styles.balanceSubLabel}>Chi Ra</CustomText>
                <CustomText style={styles.expenseAmount}>
                  -{expenseFormatted}
                </CustomText>
                {expensePercent !== 0 && (
                  <CustomText
                    style={[styles.changePercent, { color: "#FF6B6B" }]}
                  >
                    {formatPercent(expensePercent)}
                  </CustomText>
                )}
              </View>
            </View>
            <CustomText style={styles.month}>{getCurrentMonthString()}</CustomText>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => console.log("Navigate to Send Money")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.tint }]}>
              <Ionicons name="arrow-up" size={normalize(24)} color="#fff" />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              Gửi
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => console.log("Navigate to Receive Money")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <Ionicons
                name="arrow-down"
                size={normalize(24)}
                color={colors.text}
              />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              Nhận
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => console.log("Navigate to Cards")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <Ionicons
                name="card-outline"
                size={normalize(24)}
                color={colors.text}
              />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              Thẻ
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => console.log("Show more actions")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <Ionicons
                name="ellipsis-horizontal"
                size={normalize(24)}
                color={colors.text}
              />
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
            <TouchableOpacity
              onPress={() => console.log("Navigate to Categories")}
            >
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
              amount="1.248.000 ₫"
              color="#FF6B35"
              progress={0.75}
              colors={colors}
            />
            <CategoryItem
              icon="restaurant-outline"
              iconColor="#4CAF50"
              name="Thực phẩm"
              transactions="28 Giao dịch"
              amount="842.000 ₫"
              color="#4CAF50"
              progress={0.6}
              colors={colors}
            />
            <CategoryItem
              icon="film-outline"
              iconColor="#9C27B0"
              name="Giải trí"
              transactions="15 Giao dịch"
              amount="425.000 ₫"
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
            <TouchableOpacity
              onPress={() => console.log("Navigate to Transactions")}
            >
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
              amount="-89.000 ₫"
              isExpense
              colors={colors}
            />
            <TransactionItem
              icon="cash"
              iconColor="#4CAF50"
              name="Lương hàng tháng"
              time="Hôm qua, 9:00 AM"
              amount="+24.200.000 ₫"
              isExpense={false}
              colors={colors}
            />
            <TransactionItem
              icon="cart"
              iconColor="#FF9800"
              name="Shopee"
              time="Hôm qua, 8:15 AM"
              amount="-6.000 ₫"
              isExpense
              colors={colors}
            />
            <TransactionItem
              icon="home"
              iconColor="#2196F3"
              name="Nội Thất"
              time="Hôm qua, 2:30 PM"
              amount="-89.000 ₫"
              isExpense
              colors={colors}
            />
          </View>
        </View>

        <View style={{ height: hp(2) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Category Item Component
const CategoryItem = ({
  icon,
  iconColor,
  name,
  transactions,
  amount,
  color,
  progress,
  colors,
}: any) => (
  <View style={[styles.categoryItem, { backgroundColor: colors.card }]}>
    <View style={styles.categoryLeft}>
      <View style={[styles.categoryIcon, { backgroundColor: iconColor }]}>
        <Ionicons name={icon} size={normalize(24)} color="#fff" />
      </View>
      <View>
        <CustomText style={[styles.categoryName, { color: colors.text }]}>
          {name}
        </CustomText>
        <CustomText
          style={[styles.categoryTransactions, { color: colors.icon }]}
        >
          {transactions}
        </CustomText>
      </View>
    </View>
    <CustomText style={[styles.categoryAmount, { color: colors.text }]}>
      {amount}
    </CustomText>
    <View
      style={[
        styles.progressBarContainer,
        { backgroundColor: colors.background },
      ]}
    >
      <View
        style={[
          styles.progressBar,
          { width: `${progress * 100}%`, backgroundColor: color },
        ]}
      />
    </View>
  </View>
);

// Transaction Item Component
const TransactionItem = ({
  icon,
  iconColor,
  name,
  time,
  amount,
  isExpense,
  colors,
}: any) => (
  <View style={[styles.transactionItem, { backgroundColor: colors.card }]}>
    <View
      style={[styles.transactionIcon, { backgroundColor: iconColor + "1A" }]}
    >
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
    <CustomText
      style={[
        styles.transactionAmount,
        isExpense ? styles.expenseText : styles.incomeText,
      ]}
    >
      {amount}
    </CustomText>
  </View>
);

export default HomeScreen;
