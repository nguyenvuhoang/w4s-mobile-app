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
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  const [balanceVisible, setBalanceVisible] = useState(true);
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
        <LinearGradient
          colors={["#1DA1F2", "#00CFDD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconCircle}>
              <CustomText style={{ color: "#1DA1F2", fontSize: normalize(18), fontWeight: "bold" }}>$</CustomText>
            </View>
            <CustomText type="medium" size={14} style={{ color: "#fff", marginLeft: normalize(10), flex: 1 }}>
              {t("home.total_balance")}
            </CustomText>
            <TouchableOpacity onPress={() => setBalanceVisible((v) => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons
                name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                size={normalize(20)}
                color="rgba(255,255,255,0.85)"
              />
            </TouchableOpacity>
          </View>

          <CustomText type="bold" size={32} style={styles.balanceAmount}>
            {balanceVisible ? formatCurrency(totalBalance) : "••••••••"}
          </CustomText>
        </LinearGradient>

        {/* ===== WALLETS ===== */}
        <SectionHeader
          title={t("statistics.my_wallets")}
          showAction={true}
          onPressAction={() => router.push("/(protected)/wallet/wallet-list?mode=select")}
        />

        {/* Stacked cards — mỗi card chồng lên card trước */}
        <View
          style={[
            styles.walletStackContainer,
            { height: (displayWallets.length - 1) * normalize(WALLET_CARD_PEEK) + normalize(WALLET_CARD_H) + normalize(WALLET_CARD_PEEK) },
          ]}
        >
          {displayWallets.map((w, index) => {
            const isLast = index === displayWallets.length - 1;
            const cardColor = w.color || WALLET_FALLBACK_COLORS[index % WALLET_FALLBACK_COLORS.length];
            return (
              <TouchableOpacity
                key={w.walletId}
                activeOpacity={0.85}
                onPress={() => handleWalletPress(w.walletId)}
                style={[
                  styles.walletStackCard,
                  {
                    backgroundColor: cardColor,
                    top: index * normalize(WALLET_CARD_PEEK),
                    zIndex: index + 1,
                    height: isLast
                      ? normalize(WALLET_CARD_H) + normalize(WALLET_CARD_PEEK)
                      : normalize(WALLET_CARD_H),
                  },
                ]}
              >
                {/* Top row: icon + type label + currency/name */}
                <View style={styles.walletStackRow}>
                  <View style={styles.walletStackIconWrap}>
                    <FontAwesome6
                      name={(w.icon as any) || "wallet"}
                      size={normalize(16)}
                      color="#fff"
                    />
                  </View>
                  <CustomText type="semiBold" size={14} style={styles.walletStackLabel} numberOfLines={1}>
                    {WALLET_TYPE_LABEL[w.type] || w.name}
                  </CustomText>
                  <CustomText type="bold" size={14} style={styles.walletStackCurrency} numberOfLines={1}>
                    {w.currency || w.name}
                  </CustomText>
                </View>

                {/* Last card: show balance at bottom-right */}
                {isLast && (
                  <CustomText type="bold" size={22} style={styles.walletStackBalance}>
                    {balanceVisible ? formatCurrency(w.balance, w.currency) : "••••••••"}
                  </CustomText>
                )}
              </TouchableOpacity>
            );
          })}
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

/* ================= CONSTANTS ================= */

const WALLET_FALLBACK_COLORS = ["#2196F3", "#7B2FBE", "#00B96B"];

/** Chiều cao cơ bản của mỗi wallet card */
const WALLET_CARD_H = 64;
/** Số pixel nhô ra của mỗi card phía dưới card trên */
const WALLET_CARD_PEEK = 54;

/** Map wallet type sang label hiển thị tiếng Việt */
const WALLET_TYPE_LABEL: Record<string, string> = {
  FIAT: "Ví tiền mặt",
  TRACKER: "Ví theo dõi",
  DEFI: "Ví thẻ",
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: normalize(50) },

  // ── Balance Card ──
  balanceCard: {
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    paddingHorizontal: normalize(20),
    paddingTop: normalize(18),
    paddingBottom: normalize(22),
    borderRadius: normalize(20),
    overflow: "hidden",
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(14),
  },
  balanceIconCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceAmount: {
    color: "#fff",
    letterSpacing: -0.5,
    textAlign: "right",
  },

  // ── Wallet Stacked Cards ──
  walletStackContainer: {
    marginHorizontal: wp(5),
    marginBottom: normalize(20),
    position: "relative",
  },
  walletStackCard: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: normalize(16),
    paddingHorizontal: normalize(16),
    paddingTop: normalize(18),
    paddingBottom: normalize(12),
    justifyContent: "space-between",
  },
  walletStackRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletStackIconWrap: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(10),
  },
  walletStackLabel: {
    color: "#fff",
    flex: 1,
  },
  walletStackCurrency: {
    color: "#fff",
    textAlign: "right",
  },
  walletStackBalance: {
    color: "#fff",
    textAlign: "right",
    marginTop: normalize(8),
  },

  sectionHeader: {
    paddingHorizontal: wp(5),
    marginBottom: normalize(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
