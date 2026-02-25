import CustomText from "@/components/base/CustomText";
import SectionHeader from "@/components/base/SectionHeader";
import LineChartCard from "@/components/chart/LineChartCard";
import STORAGE_KEY from "@/constants/StorageKey";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useFinanceSummary, useMonthlyChartData, useWalletOpeningClosingBalance } from "@/features/home/hooks/Usefinancesummary";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useTopSpendingCategories } from "@/hooks/useCategory";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

/* ================= HELPERS ================= */

/** Parse category_name từ JSON string {"vi":"...","en":"..."} hoặc plain string */
const parseCategoryName = (raw: string, lang: string): string => {
  if (!raw) return "";
  try {
    if (!raw.startsWith("{")) return raw;
    const parsed = JSON.parse(raw);
    return parsed[lang] || parsed.vi || parsed.en || raw;
  } catch {
    return raw;
  }
};

/* ================= MOCK DATA ================= */


const MOCK_FREQUENT_EXPENSES = [
  {
    id: "1",
    name: "Shoppe",
    category: "Mua sắm",
    icon: "bag-shopping",
    color: "#EE4D2D",
    amount: 89000,
  },
  {
    id: "2",
    name: "Starbucks",
    category: "Thực phẩm",
    icon: "mug-hot",
    color: "#00704A",
    amount: 45000,
  },
];

/* ================= SCREEN ================= */

const StatisticsScreen = () => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { wallets, loading: walletsLoading } = useWallet();
  const { data: financeSummary, loading: summaryLoading } = useFinanceSummary();
  const {
    data: topCategories,
    loading: categoriesLoading,
    fetchTopCategories,
  } = useTopSpendingCategories();

  const { fetchBalance, data: openingBalanceData } = useWalletOpeningClosingBalance();

  useEffect(() => {
    fetchTopCategories('M', 0);
  }, [fetchTopCategories]);

  const {
    expenses: monthlyExpenses,
    incomes: monthlyIncomes,
    loading: chartLoading,
  } = useMonthlyChartData();
  const [openingBalance, setOpeningBalance] = useState<number | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    fetchBalance({
      period_type: "M",
      anchor_date: today,
      type: "C"
    });
  }, [fetchBalance]);

  useEffect(() => {
    if (openingBalanceData && openingBalanceData.net_balance && openingBalanceData.net_balance.details) {
      const opening = openingBalanceData.net_balance.details.find(d => d.label === "Opening_Balance");
      if (opening) {
        setOpeningBalance(opening.amount);
      }
    }
  }, [openingBalanceData]);

  const totalBalance = useMemo(
    () => financeSummary?.total_balance ?? 0,
    [financeSummary]
  );

  // Chỉ hiển thị tối đa 3 ví
  const displayWallets = useMemo(
    () => wallets.slice(0, 3),
    [wallets]
  );

  const formatCurrency = (v: number, currency: string = "đ") =>
    v.toLocaleString("vi-VN") + " " + currency;

  const formatYLabel = (value: string) => {
    const num = Number(value);
    if (num >= 1_000_000) return `${Math.round(num / 1_000_000)}tr`;
    if (num >= 1_000) return `${Math.round(num / 1_000)}k`;
    return "0";
  };

  const handleWalletPress = async (walletId: number) => {
    try {
      // Lưu wallet đã chọn vào storage
      await StorageService.setAsyncItem(
        STORAGE_KEY.TEMP_WALLET_STORAGE,
        JSON.stringify({ walletId })
      );
      // Navigate đến ReportScreen
      router.push("../report");
    } catch (error) {
      console.error('[StatisticsScreen] Failed to save selected wallet:', error);
    }
  };

  // Lắng nghe khi quay lại từ WalletListScreen
  useFocusEffect(
    useCallback(() => {
      const checkWalletSelection = async () => {
        try {
          const storedWallet = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_WALLET_STORAGE,
          );
          if (storedWallet) {
            // Nếu có wallet được chọn, navigate đến ReportScreen
            // Không xóa storage ở đây vì ReportScreen sẽ cần dùng
            router.push("../report");
          }
        } catch (error) {
          console.error('[StatisticsScreen] Failed to check wallet selection:', error);
        }
      };
      checkWalletSelection();
    }, [])
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ===== TOTAL BALANCE ===== */}
        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <View style={styles.balanceHeader}>
            <View
              style={[
                styles.balanceIcon,
                { backgroundColor: colors.tint + "20" },
              ]}
            >
              <FontAwesome6
                name="shield-halved"
                size={normalize(18)}
                color={colors.tint}
              />
            </View>
            <CustomText type="medium" size={14}>
              {t("home.total_balance")}
            </CustomText>
          </View>
          <CustomText type="bold" size={32}>
            {formatCurrency(totalBalance)}
          </CustomText>

          {openingBalance !== null && (
            <View style={{ marginTop: normalize(8), flexDirection: 'row', alignItems: 'center' }}>
              <CustomText type="medium" size={12} style={{ color: colors.icon }}>
                Opening Balance:
              </CustomText>
              <CustomText type="bold" size={14} style={{ marginLeft: normalize(5), color: colors.text }}>
                {formatCurrency(openingBalance)}
              </CustomText>
            </View>
          )}
        </View>

        {/* ===== WALLETS ===== */}
        <SectionHeader
          title={t("statistics.my_wallets")}
          showAction={true}
          onPressAction={() => router.push("/(protected)/wallet/wallet-list?mode=select")}
        />

        <View style={styles.walletList}>
          {displayWallets.map((w) => (
            <TouchableOpacity
              key={w.walletId}
              style={[styles.walletItem, { backgroundColor: colors.card }]}
              onPress={() => handleWalletPress(w.walletId)}
              activeOpacity={0.7}
            >
              <View style={[styles.walletIcon, { backgroundColor: w.color || colors.tint }]}>
                <FontAwesome6
                  name={(w.icon as any) || "wallet"}
                  size={normalize(16)}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText type="medium" size={15}>
                  {w.name}
                </CustomText>
                <CustomText size={13}>{formatCurrency(w.balance, w.currency)}</CustomText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ===== CHARTS ===== */}
        <SectionHeader
          title={t("statistics.monthly_report")}
          showAction={true}
          actionText={t("statistics.view_report")}
          onPressAction={() => router.push("../report")}
        />

        {chartLoading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <>
            <LineChartCard
              label={t("home.expense")}
              color="#F44336"
              data={monthlyExpenses}
              formatYLabel={formatYLabel}
            />

            <LineChartCard
              label={t("home.income")}
              color="#2196F3"
              data={monthlyIncomes}
              formatYLabel={formatYLabel}
            />
          </>
        )}

        {/* ===== CATEGORY ===== */}
        <SectionHeader title={t("statistics.category_analysis")} />

        {categoriesLoading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : topCategories.length === 0 ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <CustomText size={14} style={{ color: colors.icon }}>
              {t("statistics.no_category_data") || "Không có dữ liệu danh mục"}
            </CustomText>
          </View>
        ) : (
          <View style={styles.categoryList}>
            {topCategories.map((c) => {
              const displayName = parseCategoryName(c.category_name, i18n.language);
              const pct = Math.round(c.percentage * 100);
              return (
                <View
                  key={c.id}
                  style={[styles.categoryItem, { backgroundColor: colors.card }]}
                >
                  <View style={styles.categoryRow}>
                    <View
                      style={[styles.categoryIcon, { backgroundColor: c.color || colors.tint }]}
                    >
                      <FontAwesome6
                        name={(c.icon || "tag") as any}
                        size={normalize(18)}
                        color="#fff"
                      />
                    </View>
                    <CustomText type="medium" size={15}>
                      {displayName}
                    </CustomText>
                  </View>

                  <View style={styles.categoryRight}>
                    <CustomText type="medium" size={13}>
                      {pct}%
                    </CustomText>
                    <CustomText type="bold" size={15}>
                      {formatCurrency(c.total_amount)}
                    </CustomText>
                  </View>

                  <View
                    style={[
                      styles.progressBg,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(pct, 100)}%`, backgroundColor: c.color || colors.tint },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ===== FREQUENT ===== */}
        <SectionHeader title={t("statistics.daily_expenses")} />

        <View style={styles.frequentList}>
          {MOCK_FREQUENT_EXPENSES.map((i) => (
            <View
              key={i.id}
              style={[styles.frequentItem, { backgroundColor: colors.card }]}
            >
              <View style={[styles.frequentIcon, { backgroundColor: i.color }]}>
                <FontAwesome6
                  name={i.icon as any}
                  size={normalize(18)}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText type="medium" size={15}>
                  {i.name}
                </CustomText>
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
  container: { flex: 1, marginBottom: normalize(50), },

  balanceCard: {
    margin: wp(5),
    padding: normalize(20),
    borderRadius: normalize(16),
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(10),
  },
  balanceIcon: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(8),
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(8),
  },

  sectionHeader: {
    paddingHorizontal: wp(5),
    marginBottom: normalize(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  walletList: { paddingHorizontal: wp(5), gap: normalize(12) },
  walletItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: normalize(12),
    borderRadius: normalize(12),
    gap: normalize(12),
  },
  walletIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },

  chartCard: {
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    padding: normalize(16),
    borderRadius: normalize(16),
  },
  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(10),
  },
  categoryIcon: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  categoryRight: {
    position: "absolute",
    right: normalize(16),
    top: normalize(16),
    alignItems: "flex-end",
  },
  progressBg: {
    height: normalize(6),
    borderRadius: 3,
    marginTop: normalize(10),
    overflow: "hidden",
  },
  progressFill: { height: "100%" },

  frequentList: { paddingHorizontal: wp(5), gap: normalize(12) },
  frequentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: normalize(12),
    borderRadius: normalize(12),
    gap: normalize(12),
  },
  frequentIcon: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
});

export default StatisticsScreen;
