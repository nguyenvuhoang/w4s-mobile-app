import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import StorageKey from "@/constants/StorageKey";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { categoryCache } from "@/features/category/hooks/useCategorycache";
import type {
  Loan,
  LoanFilterType,
  LoanSummary
} from "@/features/paybook/types";
import { useCategory } from "@/hooks/useCategory";
import StorageService from "@/services/StorageService";
import { categoryRepository } from "@/services/repositories/category.repository";
import { paybookRepository } from "@/services/repositories/paybook.repository";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { t } from "i18next";
import React, { useCallback, useMemo, useState } from "react";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { createStyles } from "../styles/PaybookListScreen.styles";
import { SafeAreaView } from "react-native-safe-area-context";

// Constants
const STATUS_CONFIG = {
  ACTIVE: {
    label: t("paybook.status_active"),
    color: "#B45309",
    bgColor: "#FEF3C7",
    icon: "clock",
  },
  COMPLETED: {
    label: t("paybook.status_completed"),
    color: "#15803D",
    bgColor: "#DCFCE7",
    icon: "check",
  },
  OVERDUE: {
    label: t("paybook.status_overdue"),
    color: "#DC2626",
    bgColor: "#FEE2E2",
    icon: "triangle-exclamation",
  },
  CANCELLED: {
    label: t("paybook.status_cancelled"),
    color: "#6B7280",
    bgColor: "#F3F4F6",
    icon: "ban",
  },
};

const FILTER_TABS: {
  key: LoanFilterType;
  labelKey: string;
  icon: string;
}[] = [
    { key: "ALL", labelKey: "common.all", icon: "list" },
    { key: "LEND", labelKey: "paybook.lend", icon: "arrow-trend-up" },
    { key: "BORROW", labelKey: "paybook.borrow", icon: "arrow-trend-down" },
  ];

// Component
const PaybookListScreen = () => {
  const { colors } = useAppTheme();
  const { getCategoryByCode } = useCategory({ autoFetch: false });
  const { convertBetween, formatAmount, isReady } = useCurrencyConverter();
  const [activeFilter, setActiveFilter] = useState<LoanFilterType>("ALL");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const summary = useMemo<LoanSummary>(() => {
    let total_lend = 0;
    let total_borrow = 0;

    loans.forEach((loan) => {
      const converted = convertBetween(loan.principal_amount, loan.currency_code) ?? loan.principal_amount;
      if (loan.loan_type === "LEND") {
        total_lend += converted;
      } else if (loan.loan_type === "BORROW") {
        total_borrow += converted;
      }
    });

    return {
      total_lend,
      total_borrow,
      net_balance: total_lend - total_borrow,
    };
  }, [loans, convertBetween]);

  // Fetch data
  const fetchLoans = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await paybookRepository.getLoans();

      // Server trả về data — adapt theo response thực tế
      if (res?.data) {
        const rawItems = res.data.items ?? res.data ?? [];
        const items: Loan[] = rawItems.map((item: any) => ({
          ...item,
          loan_id: String(item.loan_id || item.id || ""),
          remaining_amount: item.remaining_amount ?? item.balance ?? 0,
          paid_amount:
            item.paid_amount ??
            (item.principal_amount ?? 0) - (item.balance ?? 0),
          principal_amount: item.principal_amount ?? 0,
          maturity_date: item.maturity_date ?? item.start_date ?? "",
          counterparty_name: item.counterparty_name ?? "Chưa rõ",
          loan_type: (item.loan_type || "LEND").toUpperCase(),
          status: (item.status || "ACTIVE").toUpperCase(),
          payment_type: (item.payment_type || "BULLET").toUpperCase(),
          interest_rate: item.interest_rate ?? 0,
          total_installments: item.total_installments ?? item.total_installment ?? 0,
          paid_installments: item.paid_installments ?? item.paid_installment ?? 0,
        }));
        setLoans(items);

        // Pre-fetch categories cho tất cả wallet IDs trong loan list
        // để getCategoryByCode(walletId, "LOAN_COLLECT"/"LOAN_REPAY") có dữ liệu trong cache.
        const uniqueWalletIds = [...new Set(items.map((l) => l.wallet_id).filter(Boolean))];
        const uncachedWalletIds = uniqueWalletIds.filter((wId) => !categoryCache.hasWallet(wId));
        if (uncachedWalletIds.length > 0) {
          try {
            const userCode = await StorageService.getItem(StorageKey.userCode);
            const appInfoStr = await StorageService.getItem(StorageKey.appInfo);
            let contractNumber = '';
            if (appInfoStr) {
              try { contractNumber = JSON.parse(appInfoStr)?.contract_number || ''; } catch { }
            }
            await Promise.all(
              uncachedWalletIds.map(async (wId) => {
                const res2 = await categoryRepository.getCategories(userCode?.toString() || '', wId, contractNumber);
                if (res2.isSuccess?.() && res2.data) {
                  const flat = (res2.data.data || []).flatMap((c: any) =>
                    [c, ...(c.children || [])]
                  );
                  categoryCache.set(wId, flat);
                }
              })
            );
          } catch (catErr) {
            console.warn('[PaybookListScreen] Failed to pre-fetch categories:', catErr);
          }
        }
      }
    } catch (error) {
      console.error("[PaybookListScreen] fetchLoans error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLoans();
    }, [fetchLoans])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLoans(true);
  }, [fetchLoans]);

  // Derived data
  const filteredLoans = useMemo(() => {
    let result = loans;

    // Lọc theo mảng tabs
    if (activeFilter !== "ALL") {
      result = result.filter((l) => l.loan_type === activeFilter);
    }

    // Lọc theo search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.counterparty_name.toLowerCase().includes(q) ||
          (l.loan_description && l.loan_description.toLowerCase().includes(q)) ||
          ((l as any).loan_no && (l as any).loan_no.toLowerCase().includes(q))
      );
    }

    return result;
  }, [loans, activeFilter, searchQuery]);

  const filterCounts = useMemo(() => ({
    ALL: loans.length,
    LEND: loans.filter((l) => l.loan_type === "LEND").length,
    BORROW: loans.filter((l) => l.loan_type === "BORROW").length,
  }), [loans]);

  // Utils
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const getDaysLeft = (maturityDate: string) => {
    const delta = Math.ceil(
      (new Date(maturityDate).getTime() - Date.now()) / 86_400_000
    );
    return delta;
  };

  // Quick-transact handler
  const handleQuickTransact = useCallback(
    (loan: Loan) => {
      const isLend = loan.loan_type === "LEND";
      const code = isLend ? "LOAN_COLLECT" : "LOAN_REPAY";

      // Lấy category từ cache — nếu chưa có thì không truyền (user tự chọn trong màn hình)
      const cached = getCategoryByCode(loan.wallet_id, code);
      const category = cached
        ? {
          id: cached.id,
          category_id: cached.category_code ?? code,
          category_code: cached.category_code ?? code,
          category_name: cached.category_name,
          category_type: cached.category_type,
          category_group: cached.category_group as "LOAN",
          icon: cached.icon,
          color: cached.color,
        }
        : undefined;

      const autofillData = {
        type: "inout" as const,
        walletId: loan.wallet_id,
        ...(category && { category }),
        amount: String(loan.remaining_amount),
        loan: loan,
        note: loan.counterparty_name
          ? `${isLend ? t("paybook.collect_from") : t("paybook.repay_to")} ${loan.counterparty_name}`
          : "",
      };
      console.log("+++++++++++", JSON.stringify(autofillData))

      router.push({
        pathname: "/(protected)/transaction/add-transaction",
        params: { autofillData: JSON.stringify(autofillData) },
      } as any);
    },
    [getCategoryByCode, t]
  );


  // Render card
  const renderLoanCard = useCallback(
    (loan: Loan, index: number) => {
      const isLend = loan.loan_type === "LEND";
      const amountColor = isLend ? "#22C55E" : "#EF4444";
      const amountPrefix = isLend ? "+" : "-";
      const statusConfig = STATUS_CONFIG[loan.status];
      const daysLeft = getDaysLeft(loan.maturity_date);
      const isDueSoon =
        loan.status === "ACTIVE" && daysLeft >= 0 && daysLeft <= 14;
      const progress =
        loan.principal_amount > 0
          ? Math.min(loan.paid_amount / loan.principal_amount, 1)
          : 0;
      const convertedRemaining = convertBetween(loan.remaining_amount, loan.currency_code);
      const convertedPrincipal = convertBetween(loan.principal_amount, loan.currency_code);

      const formattedRemaining = convertedRemaining !== null
        ? formatAmount(convertedRemaining)
        : formatAmount(loan.remaining_amount, loan.currency_code);
      const formattedPrincipal = convertedPrincipal !== null
        ? formatAmount(convertedPrincipal)
        : formatAmount(loan.principal_amount, loan.currency_code);

      return (
        <TouchableOpacity
          key={loan.loan_id}
          style={[styles.card, index === 0 && { marginTop: 0 }]}
          onPress={() => router.push(`/(protected)/paybook/${loan.loan_id}`)}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: isLend ? "#E8F5E9" : "#FFEBEE" },
              ]}
            >
              <AppIcon
                name={loan.counterparty_type === "MERCHANT" ? "building" : "user"}
                size={normalize(17)}
                color={amountColor}
              />
            </View>

            <View style={styles.cardMeta}>
              <View style={styles.nameRow}>
                <CustomText
                  style={[styles.cardName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {loan.counterparty_name}
                </CustomText>

                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: isLend ? "#E8F5E9" : "#FFEBEE" },
                  ]}
                >
                  <AppIcon
                    name={isLend ? "arrow-trend-up" : "arrow-trend-down"}
                    size={normalize(9)}
                    color={amountColor}
                    style={{ marginRight: wp(0.8) }}
                  />
                  <CustomText
                    style={[styles.typeBadgeText, { color: amountColor }]}
                  >
                    {isLend
                      ? t("paybook.lend")
                      : t("paybook.borrow")}
                  </CustomText>
                </View>
              </View>

              {(loan.loan_description || (loan as any).loan_no) ? (
                <CustomText
                  style={[styles.cardDesc, { color: colors.icon }]}
                  numberOfLines={1}
                >
                  {(loan as any).loan_no
                    ? `[${(loan as any).loan_no}] `
                    : ""}
                  {loan.loan_description || ""}
                </CustomText>
              ) : null}
            </View>
          </View>

          {/* Amount */}
          <View style={styles.amountRow}>
            <View>
              <CustomText style={[styles.amountLabel, { color: colors.icon }]}>
                {t("paybook.remaining")}
              </CustomText>
              <CustomText
                style={[styles.remainingAmount, { color: amountColor }]}
              >
                {amountPrefix}
                {formattedRemaining}
              </CustomText>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <CustomText style={[styles.amountLabel, { color: colors.icon }]}>
                {t("paybook.principal")}
              </CustomText>
              <CustomText
                style={[styles.principalAmount, { color: colors.text }]}
              >
                {formattedPrincipal}
              </CustomText>
            </View>
          </View>

          {/* Progress */}
          <View
            style={[styles.progressTrack, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progress * 100)}%` as any,
                  backgroundColor: amountColor,
                },
              ]}
            />
          </View>

          <CustomText style={[styles.progressLabel, { color: colors.icon }]}>
            {t("paybook.paid")} {Math.round(progress * 100)}% •{" "}
            {loan.payment_type === "INSTALLMENT"
              ? loan.total_installments && loan.total_installments > 0
                ? `${loan.paid_installments ?? 0}/${loan.total_installments} ${t("paybook.installment")}`
                : t("paybook.installment_payment")
              : t("paybook.one_time_payment")}
          </CustomText>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              <View style={styles.footerItem}>
                <AppIcon
                  name="calendar-days"
                  size={normalize(10)}
                  color={
                    isDueSoon
                      ? "#EF4444"
                      : loan.status === "OVERDUE"
                        ? "#DC2626"
                        : colors.icon
                  }
                  style={{ marginRight: wp(1) }}
                />
                <CustomText
                  style={[
                    styles.footerText,
                    {
                      color:
                        isDueSoon || loan.status === "OVERDUE"
                          ? "#EF4444"
                          : colors.icon,
                    },
                  ]}
                >
                  {loan.status === "OVERDUE"
                    ? t("paybook.overdue_days", {
                      days: Math.abs(daysLeft),
                    })
                    : isDueSoon
                      ? t("paybook.days_left", { days: daysLeft })
                      : formatDate(loan.maturity_date)}
                </CustomText>
              </View>

              <View style={[styles.footerItem, { marginLeft: wp(3) }]}>
                <AppIcon
                  name="percent"
                  size={normalize(9)}
                  color={colors.icon}
                  style={{ marginRight: wp(1) }}
                />
                <CustomText
                  style={[styles.footerText, { color: colors.icon }]}
                >
                  {loan.interest_rate}%/{t("paybook.year")}
                </CustomText>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bgColor },
              ]}
            >
              <AppIcon
                name={statusConfig.icon as any}
                size={normalize(9)}
                color={statusConfig.color}
                style={{ marginRight: wp(1) }}
              />
              <CustomText
                style={[styles.statusText, { color: statusConfig.color }]}
              >
                {statusConfig.label}
              </CustomText>
            </View>
          </View>

          {/* Quick-action button — only for active/overdue loans */}
          {(loan.status === "ACTIVE" || loan.status === "OVERDUE") && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: isLend ? "#E8F5E9" : "#FFEBEE" },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleQuickTransact(loan);
              }}
              activeOpacity={0.75}
            >
              <AppIcon
                name={isLend ? "hand-holding-dollar" : "money-bill-transfer"}
                size={normalize(12)}
                color={amountColor}
                style={{ marginRight: wp(1.5) }}
              />
              <CustomText style={[styles.actionBtnText, { color: amountColor }]}>
                {isLend ? t("paybook.action_collect") : t("paybook.action_repay")}
              </CustomText>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    },
    [styles, colors, convertBetween, formatAmount, handleQuickTransact, t]
  );

  // Render
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader
        title={isSearchMode ? "" : t("paybook.title")}
        centerComponent={
          isSearchMode ? (
            <View style={styles.headerSearchWrapper}>
              <TextInput
                style={[styles.headerSearchInput, { color: colors.text }]}
                placeholder={t("paybook.search_placeholder")}
                placeholderTextColor={colors.icon}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
            </View>
          ) : undefined
        }
        rightComponent={
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              if (isSearchMode) {
                setIsSearchMode(false);
                setSearchQuery("");
              } else {
                setIsSearchMode(true);
              }
            }}
          >
            <AppIcon
              name={isSearchMode ? "xmark" : "magnifying-glass"}
              size={normalize(18)}
              color={colors.text}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Cho vay */}
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconWrapper, { backgroundColor: "#E8F5E9" }]}>
              <AppIcon name="arrow-trend-up" size={normalize(16)} color="#22C55E" />
            </View>
            <CustomText style={[styles.summaryLabel, { color: colors.icon }]}>{t("paybook.lend")}</CustomText>
            <CustomText style={[styles.summaryAmount, { color: "#22C55E" }]}>
              +{formatAmount(Math.abs(summary.total_lend))}
            </CustomText>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

          {/* Đi vay */}
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconWrapper, { backgroundColor: "#FFEBEE" }]}>
              <AppIcon name="arrow-trend-down" size={normalize(16)} color="#EF4444" />
            </View>
            <CustomText style={[styles.summaryLabel, { color: colors.icon }]}>{t("paybook.borrow")}</CustomText>
            <CustomText style={[styles.summaryAmount, { color: "#EF4444" }]}>
              -{formatAmount(Math.abs(summary.total_borrow))}
            </CustomText>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

          {/* Chênh lệch */}
          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryIconWrapper,
                {
                  backgroundColor:
                    summary.net_balance >= 0 ? "#EEF2FF" : "#FFF3F3",
                },
              ]}
            >
              <AppIcon
                name="scale-balanced"
                size={normalize(15)}
                color={summary.net_balance >= 0 ? "#6366F1" : "#EF4444"}
              />
            </View>
            <CustomText style={[styles.summaryLabel, { color: colors.icon }]}>{t("paybook.net")}</CustomText>
            <CustomText
              style={[
                styles.summaryAmount,
                { color: summary.net_balance >= 0 ? "#6366F1" : "#EF4444" },
              ]}
            >
              {summary.net_balance >= 0 ? "+" : "-"}
              {formatAmount(Math.abs(summary.net_balance))}
            </CustomText>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <CustomText style={[styles.filterSectionTitle, { color: colors.text }]}>
            {t("paybook.list")}
          </CustomText>
          <View style={styles.filterContainer}>
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              const count = filterCounts[tab.key];
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveFilter(tab.key)}
                  activeOpacity={0.7}
                  style={[
                    styles.filterTab,
                    {
                      borderColor: isActive ? "transparent" : colors.border,
                      backgroundColor: isActive ? "transparent" : colors.card,
                    },
                  ]}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={colors.gradientPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.filterTabGradient}
                    >
                      <CustomText style={[styles.filterTabText, { color: "#fff" }]}>
                        {t(tab.labelKey)}
                      </CustomText>
                      {count > 0 && (
                        <View style={[styles.filterBadge, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
                          <CustomText style={[styles.filterBadgeText, { color: "#fff" }]}>
                            {count}
                          </CustomText>
                        </View>
                      )}
                    </LinearGradient>
                  ) : (
                    <View style={styles.filterTabInner}>
                      <CustomText style={[styles.filterTabText, { color: colors.text }]}>
                        {t(tab.labelKey)}
                      </CustomText>
                      {count > 0 && (
                        <View style={[styles.filterBadge, { backgroundColor: colors.border }]}>
                          <CustomText style={[styles.filterBadgeText, { color: colors.text }]}>
                            {count}
                          </CustomText>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {loading || !isReady ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <CustomText style={[styles.loadingText, { color: colors.icon }]}>
                {t("common.loading")}
              </CustomText>
            </View>
          ) : filteredLoans.length > 0 ? (
            filteredLoans.map((loan, index) => renderLoanCard(loan, index))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBg, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <AppIcon
                  name="book-open"
                  size={normalize(40)}
                  color={colors.tint}
                  style={{ opacity: 0.6 }}
                />
              </View>
              <CustomText style={[styles.emptyTitle, { color: colors.text }]}>
                {t("paybook.empty_title")}
              </CustomText>
              <CustomText style={[styles.emptySubtitle, { color: colors.icon }]}>
                {t("paybook.empty_desc")}
              </CustomText>
            </View>
          )}
        </View>

        <View style={{ height: hp(12) }} />
      </ScrollView>

      {/* Create Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.push("/(protected)/paybook/create")}
          activeOpacity={0.8}
          style={[styles.createButton, { shadowColor: colors.tint }]}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBg}
          >
            <AppIcon
              name="plus"
              size={normalize(15)}
              color="#fff"
              style={{ marginRight: wp(2) }}
            />
            <CustomText style={styles.createButtonText}>{t("paybook.create")}</CustomText>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
export default PaybookListScreen;
