import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import FeatureSearchModal from "@/components/modals/FeatureSearchModal";
import HomeBanners from "@/components/banner/banner";
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
import { getValidIconName } from "@/utils/iconMapper";
import { Images } from "@/utils/images";
import { hp, normalize } from "@/utils/layout";
import { router } from "expo-router";
import React, { useCallback, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { appInfo } = useContext(GlobalContext);
  const { showNotification } = useNotification();
  const { defaultCurrency, loading: currencyLoading } = useDefaultCurrency();

  // Fetch finance data (amounts already in correct currency from server)
  const { data, loading, error, refresh } = useFinanceSummary();
  const {
    transactions: recentTransactions,
    totalCount: totalTransactionsCount,
    loading: transactionsLoading,
    refresh: refreshTransactions,
  } = useRecentTransactions(5);
  const {
    categories: topCategories,
    loading: categoriesLoading,
    refresh: refreshCategories,
  } = useTopSpendingCategories("M", 5);

  const [refreshing, setRefreshing] = React.useState(false);
  const [isSearchVisible, setSearchVisible] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshTransactions(), refreshCategories()]);
    setRefreshing(false);
  }, [refresh, refreshTransactions, refreshCategories]);

  // Handle server percentage without multiplying by 100
  const formatPercent = useCallback((value: number | undefined) => {
    if (value === undefined || value === 0) return "0%";
    const sign = value > 0 ? "+" : "";
    const formatted = Math.abs(value).toFixed(1).replace(/\.0$/, "");
    return `${sign}${formatted}%`;
  }, []);

  // Format currency for display (no conversion - server returns correct currency)
  const formatCurrency = useCallback((
    amount: number | undefined,
    currencySymbol?: string,
  ) => {
    if (amount === undefined) return "...";
    const formatted = amount.toLocaleString();
    return `${formatted}${currencySymbol || defaultCurrency.symbol}`;
  }, [defaultCurrency.symbol]);

  // Format transaction amount with sign
  const formatTransactionAmount = useCallback((transaction: RecentTransaction) => {
    const isExpense = transaction.type === "EXPENSE";
    const sign = isExpense ? "-" : "+";
    const formatted = transaction.amount.toLocaleString();
    return `${sign}${formatted}${defaultCurrency.symbol}`;
  }, [defaultCurrency.symbol]);

  // Format transaction time
  const formatTransactionTime = useCallback((dateString: string) => {
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
  }, [t]);

  // Get category icon based on icon or fallback
  const getCategoryIcon = useCallback((transaction: RecentTransaction): string => {
    let iconName = transaction.icon;
    if (!iconName) {
      if (transaction.type === "INCOME") iconName = "cash";
      else if (transaction.type === "EXPENSE") iconName = "cart";
      else iconName = "swap-horizontal";
    }
    return getValidIconName(iconName);
  }, []);

  // Get category color based on color or fallback
  const getCategoryColor = useCallback((transaction: RecentTransaction): string => {
    if (transaction.color) {
      return transaction.color;
    }
    // Fallback colors based on transaction type
    if (transaction.type === "INCOME") return "#4CAF50";
    if (transaction.type === "EXPENSE") return "#FF6B6B";
    return "#2196F3";
  }, []);

  // Parse name from JSON string format: {"vi":"Tên","en":"Name"}
  const parseName = useCallback((name: string | null): string | null => {
    if (!name) return null;
    try {
      const parsed = JSON.parse(name);
      return parsed[i18n.language] || parsed.vi || parsed.en || name;
    } catch {
      return name;
    }
  }, [i18n.language]);

  // Memoize calculated values
  const financialSummary = useMemo(() => {
    const incomeTotal = data?.income_expense_summary.income.total || 0;
    const expenseTotal = data?.income_expense_summary.expense.total || 0;
    const totalBalance = data?.total_balance || 0;

    return {
      incomeFormatted: formatCurrency(incomeTotal),
      expenseFormatted: formatCurrency(expenseTotal),
      balanceFormatted: formatCurrency(totalBalance),
      incomePercent: data?.income_expense_summary.income.change_percent || 0,
      expensePercent: data?.income_expense_summary.expense.change_percent || 0,
    };
  }, [data, formatCurrency]);

  const handleFeatureDeveloping = useCallback(() => {
    showNotification(t("common.feature_developing"), "warning");
  }, [showNotification, t]);

  const handleCategoryPress = useCallback((category: any) => {
    router.push({
      pathname: '/(protected)/category-detail',
      params: {
        category: JSON.stringify({
          category_id: category.category_id,
          category_code: category.category_code,
          name: category.name,
          icon: getValidIconName(category.icon || 'pricetag-outline'),
          color: category.color || '#9E9E9E',
          transaction_count: category.transaction_count,
          total_amount: category.total_amount,
          percentage: category.percentage,
        }),
      },
    });

    // router.push({
    //   pathname: "/(protected)/transaction/add-transaction",
    //   params: {
    //     autofillData: JSON.stringify({
    //       type: "expense",
    //       walletId: 86,
    //       amount: "150000",
    //       note: "Mua cà phê",
    //       category: {
    //         id: 12,
    //         category_id: "cat_001",
    //         category_name: JSON.stringify({ vi: "Ăn uống", en: "Food" }),
    //         category_type: "EXPENSE",
    //         category_group: "EXPENSE",
    //         icon: "coffee",
    //         color: "#FF6B6B",
    //       },
    //       date: new Date().toISOString(),
    //     }),
    //   },
    // });


    // router.push({
    //   pathname: "/(protected)/invoice/create-invoice",
    //   params: {
    //     autofillData: JSON.stringify({
    //       walletId: 86,
    //       category: {
    //         category_id: "cat_001",
    //         category_name: JSON.stringify({ vi: "Tiền điện" }),
    //         category_type: "EXPENSE",
    //         icon: "bolt",
    //         color: "#FFB800"
    //       },
    //       amount: 150000,
    //       date: "2026-02-15",
    //       note: "Tiền điện tháng 2",
    //       recurring: {
    //         type: "monthly",
    //         count: 12,
    //         isForever: false,
    //         selectedDays: [1]
    //       }
    //     })
    //   }
    // });

    // router.push({
    //   pathname: "/(protected)/create-budget",
    //   params: {
    //     autofillData: JSON.stringify({
    //       type: "expense",
    //       walletId: 86,
    //       amount: "2000000",
    //       note: "Ngân sách ăn uống tháng 3",
    //     }),
    //   },
    // });

    // router.push({
    //   pathname: "/(protected)/create-budget",
    //   params: {
    //     autofillData: JSON.stringify({
    //       period: "THIS_MONTH",
    //       walletId: 86,
    //       amount: "2000000",
    //       category: {
    //         category_id: "cat_food",
    //         category_name: JSON.stringify({ vi: "Ăn uống" }),
    //         category_type: "EXPENSE",
    //         icon: "utensils",
    //         color: "#FF6B6B",
    //       },
    //     }),
    //   },
    // });

    // router.push({
    //   pathname: "/(protected)/budget/create-budget",
    //   params: {
    //     autofillData: JSON.stringify({
    //       // Ngày tùy chỉnh: truyền startDate + endDate thay vì period
    //       startDate: "2026-03-15",           // hoặc new Date(...).toISOString()
    //       endDate: "2026-04-20",
    //       dateRangeLabel: "15/03 - 20/04",   // nhãn hiện thị tuỳ ý (tùy chọn)

    //       walletId: 86,
    //       amount: "2000000",
    //       category: {
    //         category_id: "cat_food",
    //         category_name: JSON.stringify({ vi: "Ăn uống" }),
    //         category_type: "EXPENSE",
    //         icon: "utensils",
    //         color: "#FF6B6B",
    //       },
    //     }),
    //   },
    // });



    // router.push({
    //   pathname: "/(protected)/event/create-event",
    //   params: {
    //     autofillData: JSON.stringify({
    //       icon: "plane",
    //       color: "#4CAF50",
    //       eventName: "Du lịch Đà Nẵng",
    //       walletId: 86,
    //       currency: { currencyId: "VND", symbol: "đ", name: "Việt Nam Đồng" },
    //       endDate: "2026-03-31T00:00:00.000Z",
    //     }),
    //   },
    // });


  }, []);

  const handleTransactionPress = useCallback((transaction: RecentTransaction) => {
    const detailData = {
      transactionid: transaction.transaction_id,
      transactiondate: transaction.occurred_at,
      transactionname: transaction.title,
      transactioncode: transaction.type === 'INCOME' ? '01' : '02',
      nu_m01: transaction.amount,
      nu_m02: 0,
      ccyid: transaction.currency || defaultCurrency.currencyId,
      cha_r01: '',
      cha_r02: '',
      sourcetranref: '',
      sourceid: '',
      trandesc: transaction.title,
      status: 'Completed',
      icon: getCategoryIcon(transaction),
      color: getCategoryColor(transaction),
    };

    router.push({
      pathname: '/(protected)/transaction-detail',
      params: { transaction: JSON.stringify(detailData) }
    });
  }, [defaultCurrency.currencyId, getCategoryIcon, getCategoryColor]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Scrollable Content */}
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
        {/* Custom Header with Avatar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={
                appInfo?.avatar?.startsWith("http")
                  ? { uri: appInfo.avatar }
                  : Images.placeholder.avatar
              }
              style={styles.headerAvatar}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/notification')}
            style={styles.notificationBtn}
          >
            <AppIcon
              name="system_noti"
              size={normalize(24)}
              color={colors.tint}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.greetingSection}>
          <CustomText style={[styles.greetingText, { color: colors.tint }]}>
            {t("home.greeting_name", { name: appInfo?.name?.toUpperCase() || 'USER' })}
          </CustomText>
          <CustomText style={[styles.greetingSubText, { color: colors.text }]}>
            {t("home.good_day")}
          </CustomText>
        </View>

        {/* Commented Search Bar as requested */}
        {/* 
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.searchBar, { backgroundColor: colors.card }]}
            onPress={() => setSearchVisible(true)}
            activeOpacity={0.7}
          >
            <AppIcon name="search" size={normalize(20)} color={colors.text} style={{ opacity: 0.5 }} type="Ionicons" />
            <CustomText style={[styles.searchPlaceholder, { color: colors.text }]}>
              {t("common.search") || "Search"}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/notification')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <AppIcon
              name="system_noti"
              size={normalize(24)}
              color={colors.tint}
            />
          </TouchableOpacity>
        </View>
        */}
        {/* Balance Card */}
        {loading && !data ? (
          <View
            style={[
              styles.balanceCard,
              { backgroundColor: colors.tint, justifyContent: "center", minHeight: 200 },
            ]}
          >
            <ActivityIndicator size="large" color="#fff" />
            <CustomText style={[styles.balanceSubLabel, { marginTop: 8 }]}>
              {t("home.loading_data")}
            </CustomText>
          </View>
        ) : error ? (
          <View style={[styles.balanceCard, { backgroundColor: colors.tint }]}>
            <View style={styles.balanceDecorOuterTL} />
            <View style={styles.balanceDecorInnerTL} />
            <View style={styles.balanceDecorOuterBR} />
            <View style={styles.balanceDecorInnerBR} />
            <CustomText style={styles.balanceLabel}>
              {t("home.load_error")}
            </CustomText>
            <CustomText style={[styles.balanceSubLabel, { marginTop: 8 }]}>
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
            <View style={styles.balanceDecorOuterTL} />
            <View style={styles.balanceDecorInnerTL} />
            <View style={styles.balanceDecorOuterBR} />
            <View style={styles.balanceDecorInnerBR} />

            <View style={styles.balanceLabelPill}>
              <CustomText style={styles.balanceLabel}>{t("home.total_balance")}</CustomText>
            </View>

            <CustomText style={styles.balanceAmount}>
              {financialSummary.balanceFormatted}
            </CustomText>

            <View style={styles.balanceDetails}>
              <View style={styles.balanceItem}>
                <CustomText style={styles.balanceSubLabel}>{t("home.income")}</CustomText>
                <CustomText style={styles.incomeAmount}>
                  {financialSummary.incomeFormatted}
                </CustomText>
              </View>
              <View style={styles.divider} />
              <View style={styles.balanceItem}>
                <CustomText style={styles.balanceSubLabel}>{t("home.expense")}</CustomText>
                <CustomText style={styles.expenseAmount}>
                  -{financialSummary.expenseFormatted}
                </CustomText>
              </View>
            </View>

            <CustomText style={styles.month}>
              {new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long' })}
            </CustomText>
          </View>
        )}
        {/* Quick Actions */}
        {/* <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFeatureDeveloping}
          >
            <LinearGradient
              colors={colors.gradianBase}
              locations={[0, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionIcon}
            >
              <AppIcon name="system_send" size={normalize(28)} color="#fff" />
            </LinearGradient>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              {t("home.send")}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFeatureDeveloping}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <AppIcon
                name="system_revice"
                size={normalize(32)}
                color={colors.tint}
              />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              {t("home.receive")}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFeatureDeveloping}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <AppIcon
                name="system_card"
                size={normalize(24)}
                color={colors.tint}
              />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              {t("home.card")}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFeatureDeveloping}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
              <AppIcon
                name="system_more"
                size={normalize(24)}
                color={colors.tint}
              />
            </View>
            <CustomText style={[styles.actionLabel, { color: colors.text }]}>
              {t("home.add")}
            </CustomText>
          </TouchableOpacity>
        </View>
        */}

        <HomeBanners />

        {/* Spending Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
              {t("home.top_spending")}
            </CustomText>
            <TouchableOpacity
              onPress={() => router.push('/(protected)/top-spending-categories')}
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
                <AppIcon
                  name="folder-outline"
                  size={normalize(40)}
                  color={colors.icon}
                  type="Ionicons"
                />
                <CustomText
                  style={{ color: colors.icon, marginTop: 8, fontSize: 14 }}
                >
                  {t("home.no_spending")}
                </CustomText>
              </View>
            ) : (
              topCategories.map((category, index) => (
                <CategoryItem
                  key={`${category.category_id}-${index}`}
                  icon={getValidIconName(category.icon || "pricetag-outline")}
                  iconColor={category.color || "#9E9E9E"}
                  name={parseName(category.name) || t("home.uncategorized")}
                  transactions={`${category.transaction_count} ${t("home.transactions_count")}`}
                  amount={formatCurrency(category.total_amount)}
                  color={category.color || "#9E9E9E"}
                  progress={category.percentage}
                  colors={colors}
                  onPress={() => handleCategoryPress(category)}
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
              onPress={() => router.push('/(protected)/transaction-history')}
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
                <AppIcon
                  name="receipt-outline"
                  size={normalize(40)}
                  color={colors.icon}
                  type="Ionicons"
                />
                <CustomText
                  style={{ color: colors.icon, marginTop: 8, fontSize: 14 }}
                >
                  {t("home.no_transactions")}
                </CustomText>
              </View>
            ) : (
              recentTransactions.map((transaction, index) => (
                <TransactionItem
                  key={`${transaction.transaction_id}-${index}`}
                  icon={getCategoryIcon(transaction)}
                  iconColor={getCategoryColor(transaction)}
                  name={parseName(transaction.title) || t("home.transaction_default_name")}
                  time={formatTransactionTime(transaction.occurred_at)}
                  amount={formatTransactionAmount(transaction)}
                  isExpense={transaction.type === "EXPENSE"}
                  colors={colors}
                  onPress={() => handleTransactionPress(transaction)}
                />
              ))
            )}
          </View>
        </View>

        <View style={{ height: hp(2) }} />
      </ScrollView>

      <FeatureSearchModal
        isVisible={isSearchVisible}
        onClose={() => setSearchVisible(false)}
      />
    </SafeAreaView>
  );
};

// Category Item Component - Memoized để tránh re-render không cần thiết
const CategoryItem = React.memo(({
  icon,
  iconColor,
  name,
  transactions,
  amount,
  color,
  progress,
  colors,
  onPress,
}: any) => (
  <TouchableOpacity
    style={[styles.categoryItem, { backgroundColor: colors.card }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.categoryLeft}>
      <View style={[styles.categoryIcon, { backgroundColor: iconColor }]}>
        <AppIcon name={icon} size={normalize(24)} color="#fff" />
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
  </TouchableOpacity>
));

// Transaction Item Component - Memoized để tránh re-render không cần thiết
const TransactionItem = React.memo(({
  icon,
  iconColor,
  name,
  time,
  amount,
  isExpense,
  colors,
  onPress,
}: any) => (
  <TouchableOpacity
    style={[styles.transactionItem, { backgroundColor: colors.card }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[styles.transactionIcon, { backgroundColor: iconColor + "1A" }]}
    >
      <AppIcon name={icon} size={normalize(24)} color={iconColor} />
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
  </TouchableOpacity>
));

export default HomeScreen;