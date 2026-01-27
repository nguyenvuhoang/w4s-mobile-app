import CustomText from "@/components/base/CustomText";
import { GlobalContext } from "@/contexts/GlobalContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useFinanceSummary } from "@/features/home/hooks/Usefinancesummary";
import {
  RecentTransaction,
  useRecentTransactions,
} from "@/features/home/hooks/useRecentTransactions";
import {
  useTopSpendingCategories
} from "@/features/home/hooks/useTopSpendingCategories";
import { styles } from "@/features/home/styles/HomeScreen.Style";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import {
  getCurrentDateString,
  getCurrentMonthString,
} from "@/utils/formatDate";
import { formatPercent } from "@/utils/formatNumber";
import { hp, normalize } from "@/utils/layout";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const { appInfo } = React.useContext(GlobalContext);
  const { showNotification } = useNotification();
  const { defaultCurrency, loading: currencyLoading } = useDefaultCurrency();

  // Fetch finance data (amounts already in correct currency from server)
  const { data, loading, error, refresh } = useFinanceSummary();
  const {
    transactions: recentTransactions,
    loading: transactionsLoading,
    refresh: refreshTransactions,
  } = useRecentTransactions(5);
  const {
    categories: topCategories,
    loading: categoriesLoading,
    refresh: refreshCategories,
  } = useTopSpendingCategories("M", 5);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshTransactions(), refreshCategories()]);
    setRefreshing(false);
  }, [refresh, refreshTransactions, refreshCategories]);

  // Format currency for display (no conversion - server returns correct currency)
  const formatCurrency = (
    amount: number | undefined,
    currencySymbol?: string,
  ) => {
    if (amount === undefined) return "...";
    const formatted = amount.toLocaleString();
    return `${formatted} ${currencySymbol || defaultCurrency.symbol}`;
  };

  // Format transaction amount with sign
  const formatTransactionAmount = (transaction: RecentTransaction) => {
    const isExpense = transaction.type === "EXPENSE";
    const sign = isExpense ? "-" : "+";
    const formatted = transaction.amount.toLocaleString();
    return `${sign}${formatted} ${defaultCurrency.symbol}`;
  };

  // Format transaction time
  const formatTransactionTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const timeStr = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (date >= today) {
      return `${t("home.today")}, ${timeStr}`;
    } else if (date >= yesterday) {
      return `${t("home.yesterday")}, ${timeStr}`;
    } else {
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  };

  // Get category icon based on icon or fallback
  const getCategoryIcon = (transaction: RecentTransaction): string => {
    if (transaction.icon) {
      return transaction.icon;
    }
    // Fallback icons based on transaction type
    if (transaction.type === "INCOME") return "cash";
    if (transaction.type === "EXPENSE") return "cart";
    return "swap-horizontal";
  };

  // Get category color based on color or fallback
  const getCategoryColor = (transaction: RecentTransaction): string => {
    if (transaction.color) {
      return transaction.color;
    }
    // Fallback colors based on transaction type
    if (transaction.type === "INCOME") return "#4CAF50";
    if (transaction.type === "EXPENSE") return "#FF6B6B";
    return "#2196F3";
  };

  // Parse name from JSON string format: {"vi":"Tên","en":"Name"}
  const parseName = (name: string | null): string | null => {
    if (!name) return null;
    try {
      const parsed = JSON.parse(name);
      return parsed[i18n.language] || parsed.vi || parsed.en || name;
    } catch {
      return name;
    }
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
                {t("home.greeting")}{appInfo?.name}
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
              {t("home.loading_data")}
            </CustomText>
          </View>
        ) : error ? (
          <View style={[styles.balanceCard, { backgroundColor: colors.tint }]}>
            <CustomText style={[styles.balanceLabel, { color: "#fff" }]}>
              {t("home.load_error")}
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
                {t("home.retry")}
              </CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.balanceCard, { backgroundColor: colors.tint }]}>
            <CustomText style={styles.balanceLabel}>{t("home.total_balance")}</CustomText>
            <CustomText style={styles.balanceAmount}>
              {balanceFormatted}
            </CustomText>

            <View style={styles.balanceDetails}>
              <View style={styles.balanceItem}>
                <CustomText style={styles.balanceSubLabel}>{t("home.income")}</CustomText>
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
                <CustomText style={styles.balanceSubLabel}>{t("home.expense")}</CustomText>
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
            onPress={() => showNotification(t("common.feature_developing"), "warning")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.tint }]}>
              <Ionicons name="arrow-up" size={normalize(24)} color="#fff" />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              {t("home.send")}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => showNotification(t("common.feature_developing"), "warning")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <Ionicons
                name="arrow-down"
                size={normalize(24)}
                color={colors.text}
              />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              {t("home.receive")}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => showNotification(t("common.feature_developing"), "warning")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <Ionicons
                name="card-outline"
                size={normalize(24)}
                color={colors.text}
              />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              {t("home.card")}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => showNotification(t("common.feature_developing"), "warning")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <Ionicons
                name="ellipsis-horizontal"
                size={normalize(24)}
                color={colors.text}
              />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              {t("home.add")}
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* Spending Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
              {t("home.top_spending")}
            </CustomText>
            <TouchableOpacity
              onPress={() => { }}
            >
              <CustomText style={[styles.seeMore, { color: colors.tint }]}>
                {t("home.see_more")}
              </CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryList}>
            {categoriesLoading && topCategories.length === 0 ? (
              <View
                style={{
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="small" color={colors.tint} />
                <CustomText
                  style={{ color: colors.icon, marginTop: 8, fontSize: 14 }}
                >
                  {t("home.loading_categories")}
                </CustomText>
              </View>
            ) : topCategories.length === 0 ? (
              <View
                style={{
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="folder-outline"
                  size={normalize(40)}
                  color={colors.icon}
                />
                <CustomText
                  style={{ color: colors.icon, marginTop: 8, fontSize: 14 }}
                >
                  {t("home.no_spending")}
                </CustomText>
              </View>
            ) : (
              topCategories.map((category) => (
                <CategoryItem
                  key={category.category_id}
                  icon={category.icon || "pricetag-outline"}
                  iconColor={category.color || "#9E9E9E"}
                  name={parseName(category.name) || t("home.uncategorized")}
                  transactions={`${category.transaction_count} ${t("home.transactions_count")}`}
                  amount={formatCurrency(category.total_amount)}
                  color={category.color || "#9E9E9E"}
                  progress={category.percentage}
                  colors={colors}
                />
              ))
            )}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
              {t("home.recent_transactions")}
            </CustomText>
            <TouchableOpacity
              onPress={() => { }}
            >
              <CustomText style={[styles.seeMore, { color: colors.tint }]}>
                {t("home.see_more")}
              </CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionList}>
            {transactionsLoading && recentTransactions.length === 0 ? (
              <View
                style={{
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="small" color={colors.tint} />
                <CustomText
                  style={{ color: colors.icon, marginTop: 8, fontSize: 14 }}
                >
                  {t("home.loading_transactions")}
                </CustomText>
              </View>
            ) : recentTransactions.length === 0 ? (
              <View
                style={{
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="receipt-outline"
                  size={normalize(40)}
                  color={colors.icon}
                />
                <CustomText
                  style={{ color: colors.icon, marginTop: 8, fontSize: 14 }}
                >
                  {t("home.no_transactions")}
                </CustomText>
              </View>
            ) : (
              recentTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.transaction_id}
                  icon={getCategoryIcon(transaction)}
                  iconColor={getCategoryColor(transaction)}
                  name={parseName(transaction.title) || t("home.transaction_default_name")}
                  time={formatTransactionTime(transaction.occurred_at)}
                  amount={formatTransactionAmount(transaction)}
                  isExpense={transaction.type === "EXPENSE"}
                  colors={colors}
                />
              ))
            )}
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
        <FontAwesome6 name={icon} size={normalize(24)} color="#fff" />
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
      <FontAwesome6 name={icon} size={normalize(24)} color={iconColor} />
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
