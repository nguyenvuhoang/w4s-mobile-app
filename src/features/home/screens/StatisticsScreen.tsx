import CustomText from "@/components/base/CustomText";
import SectionHeader from "@/components/base/SectionHeader";
import LineChartCard from "@/components/chart/LineChartCard";
import STORAGE_KEY from "@/constants/StorageKey";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useFinanceSummary, useMonthlyChartData, useWalletOpeningClosingBalance } from "@/features/home/hooks/Usefinancesummary";
import { useTopSpendingCategories } from "@/features/home/hooks/useTopSpendingCategories";
import { useTransaction } from "@/features/transaction/hooks/useTransaction";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useCategory } from "@/hooks/useCategory";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import StorageService from "@/services/StorageService";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { t } from "i18next";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const { width } = Dimensions.get("window");

/* ================= HELPERS ================= */

/** Parse category_name từ JSON string {"vi":"...","en":"..."} hoặc plain string */
const parseCategoryName = (raw: string | null, lang: string): string => {
  if (!raw) return "";
  try {
    if (typeof raw !== 'string' || !raw.startsWith("{")) return raw;
    const parsed = JSON.parse(raw);
    return parsed[lang] || parsed.vi || parsed.en || raw;
  } catch {
    return raw;
  }
};

/* ================= SCREEN ================= */

const StatisticsScreen = () => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { defaultCurrency } = useDefaultCurrency();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { wallets, loading: walletsLoading, error: walletsError, refresh: refreshWallets } = useWallet();
  const { data: financeSummary, loading: summaryLoading, error: summaryError, refresh: refreshSummary } = useFinanceSummary();
  const {
    categories: topCategories,
    loading: categoriesLoading,
    error: categoriesError,
    refresh: refreshCategories,
  } = useTopSpendingCategories("M", 100);

  const { advancedSearchTransactions, loading: searchLoading } = useTransaction();
  const { categories: allCategories } = useCategory();
  const { convertBetween, formatAmount, isReady: converterReady } = useCurrencyConverter();
  const [topRecentExpenses, setTopRecentExpenses] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchTopExpenses = useCallback(async () => {
    try {
      setSearchError(null);
      const now = new Date();
      // Year and Month of now
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-indexed

      // Local 1st of current month
      const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;

      // Local last day of current month
      const lastDay = new Date(year, month + 1, 0).getDate();
      const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const result = await advancedSearchTransactions({
        from_transaction_date: fromDate,
        to_transaction_date: toDate,
        page_index: 1,
        page_size: 100,
      });

      const list = Array.isArray(result) ? result : (result?.items ?? result?.data ?? []);

      const sorted = list
        .filter((t: any) => {
          // Normalize type and amount from multiple possible fields
          const type = String(t.name || t.type || t.transaction_type || t.transaction_code || t.tran_code || '').toUpperCase();
          const amount = Number(t.amount ?? t.nu_m01 ?? 0);

          const isExpense = type === 'EXPENSE' || type === '02' || amount < 0 || (t.name === 'Expense' && amount > 0);
          return isExpense;
        })
        .sort((a: any, b: any) => {
          const amountA = Math.abs(Number(a.amountbase ?? a.nu_m02 ?? a.amount ?? a.nu_m01 ?? 0));
          const amountB = Math.abs(Number(b.amountbase ?? b.nu_m02 ?? b.amount ?? b.nu_m01 ?? 0));
          return amountB - amountA;
        })
        .slice(0, 5);

      setTopRecentExpenses(sorted);
    } catch (error: any) {
      console.error("[StatisticsScreen] fetchTopExpenses error:", error);
      setSearchError(error?.message || "Failed to fetch top expenses");
    }
  }, [advancedSearchTransactions]);

  const enhancedTopExpenses = useMemo(() => {
    return topRecentExpenses.map(item => {
      const findId = item.category_id || item.cat_id;
      // Match with c.id from useCategory
      const cat = allCategories.find(c => Number(c.id) === Number(findId));

      const rawTitle = item.title || item.trandesc || item.tran_name || t("home.transaction_default_name");
      const mappedName = cat ? parseCategoryName(cat.category_name, i18n.language) : parseCategoryName(rawTitle, i18n.language);

      return {
        ...item,
        catInfo: cat,
        icon: cat?.icon || item.icon || "receipt",
        color: cat?.color || item.color || "#9E9E9E",
        displayName: mappedName
      };
    });
  }, [topRecentExpenses, allCategories, t, i18n.language]);

  useEffect(() => {
    fetchTopExpenses();
  }, [fetchTopExpenses]);

  // Listen for changes
  useEffect(() => {
    const handleTransactionChange = () => {
      fetchTopExpenses();
    };

    TransactionEventEmitter.onTransactionChanged(handleTransactionChange);
    return () => {
      TransactionEventEmitter.offTransactionChanged(handleTransactionChange);
    };
  }, [fetchTopExpenses]);

  const { fetchBalance, data: openingBalanceData } = useWalletOpeningClosingBalance();

  // Auto-refresh when transaction changes is handled inside the hook

  const {
    expenses: monthlyExpenses,
    incomes: monthlyIncomes,
    loading: chartLoading,
    error: chartError,
    refresh: refreshCharts,
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

  const formatCurrency = (amount: number, currencyCode?: string) => {
    // If we have currency metadata from useCurrencyConverter, use its formatAmount
    if (converterReady && (!currencyCode || currencyCode === defaultCurrency.currencyId)) {
        return formatAmount(amount);
    }
    
    // Fallback or specific currency formatting
    const code = currencyCode || defaultCurrency.currencyId || "VND";
    const symbol = code === defaultCurrency.currencyId ? defaultCurrency.symbol : code;

    if (code === "VND") {
      return `${amount.toLocaleString("vi-VN")} ${symbol}`;
    }
    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: code === "VND" ? 0 : 2,
      maximumFractionDigits: code === "VND" ? 0 : 2,
    })}`;
  };

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

  const ErrorSection = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
    <View style={{
      padding: normalize(20),
      alignItems: 'center',
      backgroundColor: colors.card,
      marginHorizontal: wp(5),
      borderRadius: normalize(16),
      marginVertical: normalize(10),
      borderWidth: 1,
      borderColor: colors.border
    }}>
      <FontAwesome6 name="circle-exclamation" size={normalize(24)} color="#FF6B6B" style={{ marginBottom: normalize(10) }} />
      <CustomText size={14} style={{ color: colors.icon, textAlign: 'center', marginBottom: normalize(12) }}>
        {error}
      </CustomText>
      <TouchableOpacity
        onPress={onRetry}
        style={{
          paddingHorizontal: normalize(24),
          paddingVertical: normalize(10),
          backgroundColor: colors.tint,
          borderRadius: normalize(20)
        }}
      >
        <CustomText size={14} type="bold" style={{ color: '#fff' }}>
          {t("common.reload")}
        </CustomText>
      </TouchableOpacity>
    </View>
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
              <CustomText type="bold" size={18} style={{ color: "#1DA1F2" }}>$</CustomText>
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

        {summaryError && <ErrorSection error={summaryError} onRetry={refreshSummary} />}

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
            { height: (displayWallets.length - 1) * WALLET_CARD_PEEK + WALLET_CARD_H + WALLET_CARD_PEEK },
          ]}
        >
          {walletsError ? (
            <ErrorSection error={walletsError} onRetry={refreshWallets} />
          ) : (
            displayWallets.map((w, index) => {
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
                      top: index * WALLET_CARD_PEEK,
                      zIndex: index + 1,
                      height: isLast
                        ? WALLET_CARD_H + WALLET_CARD_PEEK
                        : WALLET_CARD_H,
                      borderBottomLeftRadius: isLast ? undefined : 0,
                      borderBottomRightRadius: isLast ? undefined : 0,
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
                      {WALLET_TYPE_LABEL["TRACKER"]}
                    </CustomText>
                    <CustomText type="bold" size={14} style={styles.walletStackCurrency} numberOfLines={1}>
                      {w.name}
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
            })
          )}
        </View>

        {/* ===== CHARTS ===== */}
        <SectionHeader
          title={t("statistics.monthly_report")}
          showAction={true}
          actionText={t("statistics.view_report")}
          onPressAction={() => router.push("../report")}
        />

        {chartLoading ? (
          <View style={{ paddingVertical: normalize(24), alignItems: 'center' }}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : chartError ? (
          <ErrorSection error={chartError} onRetry={refreshCharts} />
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
          <View style={{ paddingVertical: normalize(24), alignItems: 'center' }}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : categoriesError ? (
          <ErrorSection error={categoriesError} onRetry={refreshCategories} />
        ) : topCategories.length === 0 ? (
          <View style={{ paddingVertical: normalize(20), alignItems: 'center' }}>
            <CustomText size={14} style={{ color: colors.icon }}>
              {t("statistics.no_category_data") || "Không có dữ liệu danh mục"}
            </CustomText>
          </View>
        ) : (
          <View style={styles.categoryList}>
            {topCategories.map((c, index) => {
              const displayName = parseCategoryName(c.name, i18n.language);
              const pct = Math.round(c.percentage * 100);
              const radius = normalize(26);
              const stroke = normalize(5);
              const normalizedRadius = radius - stroke;
              const circumference = normalizedRadius * 2 * Math.PI;
              const strokeDashoffset = circumference - (Math.min(pct, 100) / 100) * circumference;

              return (
                <TouchableOpacity
                  key={`${c.category_id}-${index}`}
                  style={[styles.categoryCard, { backgroundColor: colors.card }]}
                  activeOpacity={0.7}
                  onPress={() => router.push({
                    pathname: '/(protected)/category-detail',
                    params: {
                      category: JSON.stringify(c)
                    }
                  })}
                >
                  <View style={styles.categoryCardLeft}>
                    <Svg height={radius * 2} width={radius * 2}>
                      <Circle
                        stroke="rgba(128,128,128,0.15)"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                      />
                      <Circle
                        stroke={c.color || colors.tint}
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        transform={`rotate(-90 ${radius} ${radius})`}
                      />
                    </Svg>
                    <View style={styles.categoryCardPct}>
                      <CustomText size={11} type="bold" style={{ color: colors.text }}>
                        {pct}%
                      </CustomText>
                    </View>
                  </View>
                  <View style={styles.categoryCardRight}>
                    <CustomText size={14} numberOfLines={1} style={{ color: colors.icon }}>
                      {displayName}
                    </CustomText>
                    <CustomText size={16} type="bold" numberOfLines={1}>
                      {formatCurrency(c.total_amount)}
                    </CustomText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ===== FREQUENT ===== */}
        <SectionHeader title={t("statistics.daily_expenses")} />

        <View style={styles.frequentList}>
          {searchLoading && topRecentExpenses.length === 0 ? (
            <ActivityIndicator color={colors.tint} />
          ) : searchError ? (
            <ErrorSection error={searchError} onRetry={fetchTopExpenses} />
          ) : enhancedTopExpenses.length === 0 ? (
            <View style={{ paddingVertical: normalize(20), alignItems: 'center' }}>
              <CustomText style={{ color: colors.icon }}>{t("home.no_transactions")}</CustomText>
            </View>
          ) : (
            enhancedTopExpenses.map((item) => {
              const amount = Math.abs(Number(item.amountbase ?? item.nu_m02 ?? item.amount ?? item.nu_m01 ?? 0));
              const title = item.displayName;
              const date = item.occurred_at || item.transaction_date || item.created_at;
              const iconColor = item.color;

              return (
                <TouchableOpacity
                  key={item.transaction_id || item.id}
                  style={[styles.frequentItem, { backgroundColor: colors.card }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    const detailData = {
                      transactionid: item.transaction_id || item.id,
                      transactiondate: date,
                      transactionname: title,
                      transactioncode: "02", // Explicitly expense
                      nu_m01: amount,
                      nu_m02: 0,
                      ccyid: item.currency || defaultCurrency.currencyId,
                      trandesc: title,
                      status: "Completed",
                      icon: item.icon,
                      color: item.color,
                    };

                    router.push({
                      pathname: "/(protected)/transaction-detail",
                      params: { transaction: JSON.stringify(detailData) },
                    });
                  }}
                >
                  <View style={[styles.frequentIcon, { backgroundColor: iconColor + "1A" }]}>
                    <FontAwesome6
                      name={(item.icon || "receipt") as any}
                      size={normalize(20)}
                      color={iconColor}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText type="semiBold" size={15} numberOfLines={1}>
                      {parseCategoryName(title, i18n.language)}
                    </CustomText>
                    <CustomText size={12} style={{ color: colors.icon, marginTop: normalize(2) }}>
                      {new Date(date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </CustomText>
                  </View>
                  <CustomText
                    type="bold"
                    size={16}
                    style={{ color: "#FF6B6B" }}
                  >
                    -{(() => {
                        const itemCurrency = item.currency || item.ccyid || "VND";
                        let finalAmount = amount;
                        if (itemCurrency !== defaultCurrency.currencyId) {
                            const converted = convertBetween(amount, itemCurrency, defaultCurrency.currencyId);
                            if (converted !== null) finalAmount = converted;
                        }
                        return formatAmount(finalAmount);
                    })()}
                  </CustomText>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: hp(8) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

/* ================= CONSTANTS ================= */

const WALLET_FALLBACK_COLORS = ["#2196F3", "#7B2FBE", "#00B96B"];

/** Chiều cao cơ bản của mỗi wallet card */
const WALLET_CARD_H = normalize(64);
/** Số pixel nhô ra của mỗi card phía dưới card trên */
const WALLET_CARD_PEEK = normalize(54);

/** Map wallet type sang label hiển thị tiếng Việt */
const WALLET_TYPE_LABEL: Record<string, string> = {
  FIAT: t("wallet.type_fiat_name"),
  TRACKER: t("wallet.type_tracking_name"),
  DEFI: t("wallet.type_defi_name"),
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
    borderRadius: normalize(5),
    marginRight: normalize(8),
  },

  categoryList: {
    paddingHorizontal: wp(5),
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48.5%',
    padding: normalize(12),
    borderRadius: normalize(16),
    marginBottom: normalize(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    // Android Shadow
    elevation: 2,
    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryCardLeft: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardPct: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardRight: {
    flex: 1,
    justifyContent: 'center',
  },

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
