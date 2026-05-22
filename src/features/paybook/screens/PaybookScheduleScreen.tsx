import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import type {
  LoanSchedule,
  ScheduleStatus
} from "@/features/paybook/types";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePaybookDetail } from "../hooks/usePaybook";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";

type FilterStatus = "ALL" | ScheduleStatus;

const getScheduleStatusConfig = (
  t: ReturnType<typeof useTranslation>["t"]
): Record<ScheduleStatus, { label: string; color: string; bgColor: string; icon: string }> => ({
  PENDING: { label: t("paybookSchedule.status.PENDING"), color: "#B45309", bgColor: "#FEF3C7", icon: "clock" },
  PAID: { label: t("paybookSchedule.status.PAID"), color: "#15803D", bgColor: "#DCFCE7", icon: "check" },
  OVERDUE: { label: t("paybookSchedule.status.OVERDUE"), color: "#DC2626", bgColor: "#FEE2E2", icon: "triangle-exclamation" },
  PARTIAL: { label: t("paybookSchedule.status.PARTIAL"), color: "#7C3AED", bgColor: "#EDE9FE", icon: "circle-half-stroke" },
});

// ─── Component ───────────────────────────────────────────────────────────────

const PaybookScheduleScreen = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { convertBetween, formatAmount, currencyFormatter, isReady, getCurrencyDetails } = useCurrencyConverter();
  const params = useLocalSearchParams<{ loanId: string }>();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const SCHEDULE_STATUS_CONFIG = useMemo(() => getScheduleStatusConfig(t), [t]);

  const FILTER_TABS: { key: FilterStatus; label: string }[] = useMemo(() => [
    { key: "ALL", label: t("paybookSchedule.filter.all") },
    { key: "PENDING", label: t("paybookSchedule.filter.pending") },
    { key: "PAID", label: t("paybookSchedule.filter.paid") },
    { key: "OVERDUE", label: t("paybookSchedule.filter.overdue") },
  ], [t]);

  const { loading, loanDetail, getLoanDetail } = usePaybookDetail();

  useEffect(() => {
    if (params.loanId) {
      getLoanDetail(Number(params.loanId));
    }
  }, [params.loanId, getLoanDetail]);

  const schedules = loanDetail?.schedules ?? [];

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filteredSchedules = useMemo(() => {
    if (activeFilter === "ALL") return schedules;
    return schedules.filter((s) => s.status === activeFilter);
  }, [schedules, activeFilter]);

  const filterCounts = useMemo(() => ({
    ALL: schedules.length,
    PENDING: schedules.filter((s) => s.status === "PENDING").length,
    PAID: schedules.filter((s) => s.status === "PAID").length,
    OVERDUE: schedules.filter((s) => s.status === "OVERDUE").length,
    PARTIAL: schedules.filter((s) => s.status === "PARTIAL").length,
  }), [schedules]);

  const totalPrincipal = schedules.reduce((a, s) => a + s.principal_due_amount, 0);
  const totalInterest = schedules.reduce((a, s) => a + s.interest_due_amount, 0);
  const totalPaidPrincipal = schedules.reduce((a, s) => a + s.paid_principal_amount, 0);
  const totalPaidInterest = schedules.reduce((a, s) => a + s.paid_interest_amount, 0);

  // ── Formatters ──────────────────────────────────────────────────────────────
  const formatCurrency = useCallback((amount: number) => {
    const fromCurrency = loanDetail?.currency_code ?? "VND";
    const converted = convertBetween(amount, fromCurrency);
    if (converted !== null) {
      return formatAmount(converted);
    }
    return formatAmount(amount, fromCurrency);
  }, [loanDetail?.currency_code, convertBetween, formatAmount]);

  const formatCurrencyShort = useCallback((amount: number) => {
    const fromCurrency = loanDetail?.currency_code ?? "VND";
    const converted = convertBetween(amount, fromCurrency);
    const displayAmount = converted !== null ? converted : amount;

    const displayCurrencyId = converted !== null ? undefined : fromCurrency;
    const currencyDetails = getCurrencyDetails(displayCurrencyId ?? "");
    const symbol = displayCurrencyId
      ? (currencyDetails?.symbol ?? displayCurrencyId)
      : currencyFormatter.symbol;

    if (i18n.language === "vi") {
      if (displayAmount >= 1_000_000_000)
        return `${(displayAmount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} Tỷ ${symbol}`;
      if (displayAmount >= 1_000_000)
        return `${(displayAmount / 1_000_000).toFixed(1).replace(/\.0$/, "")} Tr ${symbol}`;
    } else {
      if (displayAmount >= 1_000_000_000)
        return `${symbol}${(displayAmount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
      if (displayAmount >= 1_000_000)
        return `${symbol}${(displayAmount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    }
    return formatAmount(displayAmount, displayCurrencyId);
  }, [i18n.language, loanDetail?.currency_code, convertBetween, formatAmount, currencyFormatter, getCurrencyDetails]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const getDaysLeft = (dateStr: string) => {
    return Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / 86_400_000
    );
  };

  // ── Toggle expand ───────────────────────────────────────────────────────────
  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // ── Render Summary ──────────────────────────────────────────────────────────
  const renderSummary = () => (
    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <CustomText style={[styles.summaryLabel, { color: colors.icon }]}>
            {t("paybookSchedule.summary.totalPrincipal")}
          </CustomText>
          <CustomText style={[styles.summaryValue, { color: colors.text }]}>
            {formatCurrencyShort(totalPrincipal)}
          </CustomText>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <CustomText style={[styles.summaryLabel, { color: colors.icon }]}>
            {t("paybookSchedule.summary.totalInterest")}
          </CustomText>
          <CustomText style={[styles.summaryValue, { color: colors.text }]}>
            {formatCurrencyShort(totalInterest)}
          </CustomText>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <CustomText style={[styles.summaryLabel, { color: colors.icon }]}>
            {t("paybookSchedule.summary.totalDue")}
          </CustomText>
          <CustomText style={[styles.summaryValue, { color: colors.text }]}>
            {formatCurrencyShort(totalPrincipal + totalInterest)}
          </CustomText>
        </View>
      </View>
    </View>
  );

  // ── Render Filter Tabs ──────────────────────────────────────────────────────
  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {FILTER_TABS.map((tab) => {
        const isActive = activeFilter === tab.key;
        const count = filterCounts[tab.key];
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              {
                backgroundColor: isActive ? colors.tint : colors.card,
                borderColor: isActive ? colors.tint : colors.border,
              },
            ]}
            onPress={() => setActiveFilter(tab.key)}
            activeOpacity={0.7}
          >
            <CustomText
              style={[
                styles.filterTabText,
                { color: isActive ? "#fff" : colors.text },
              ]}
            >
              {tab.label}
            </CustomText>
            {count > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.3)"
                      : colors.border,
                  },
                ]}
              >
                <CustomText
                  style={[
                    styles.filterBadgeText,
                    { color: isActive ? "#fff" : colors.text },
                  ]}
                >
                  {count}
                </CustomText>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ── Render Schedule Item ────────────────────────────────────────────────────
  const renderScheduleItem = ({ item }: { item: LoanSchedule }) => {
    const statusCfg = SCHEDULE_STATUS_CONFIG[item.status];
    const totalDue = item.principal_due_amount + item.interest_due_amount;
    const totalPaid = item.paid_principal_amount + item.paid_interest_amount;
    const isExpanded = expandedId === item.id;
    const daysUntilDue = getDaysLeft(item.due_date);
    const isPastDue = daysUntilDue < 0 && item.status !== "PAID";
    const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7 && item.status !== "PAID";

    return (
      <TouchableOpacity
        style={[styles.scheduleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => toggleExpand(item.id)}
      >
        {/* Header */}
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleHeaderLeft}>
            <View style={[styles.scheduleDot, { backgroundColor: statusCfg.color }]}>
              <AppIcon
                name={statusCfg.icon as any}
                size={normalize(10)}
                color="#fff"
              />
            </View>
            <View style={styles.scheduleHeaderMeta}>
              <CustomText style={[styles.scheduleKy, { color: colors.text }]}>
                {t("paybookSchedule.card.installment", { no: item.installment_no })}
              </CustomText>
              <CustomText style={[styles.scheduleDate, { color: colors.icon }]}>
                {t("paybookSchedule.card.dueDate", { date: formatDate(item.due_date) })}
              </CustomText>
            </View>
          </View>

          <View style={styles.scheduleHeaderRight}>
            <CustomText style={[styles.scheduleTotal, { color: colors.text }]}>
              {formatCurrency(totalDue)}
            </CustomText>
            <View style={[styles.scheduleStatusBadge, { backgroundColor: statusCfg.bgColor }]}>
              <CustomText style={[styles.scheduleStatusText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </CustomText>
            </View>
          </View>
        </View>

        {/* Due indicator */}
        {(isPastDue || isDueSoon) && (
          <View style={[
            styles.dueIndicator,
            { backgroundColor: isPastDue ? "#FEE2E2" : "#FEF3C7" },
          ]}>
            <AppIcon
              name={isPastDue ? "triangle-exclamation" : "hourglass-half"}
              size={normalize(10)}
              color={isPastDue ? "#DC2626" : "#B45309"}
              style={{ marginRight: wp(1.5) }}
            />
            <CustomText style={[
              styles.dueIndicatorText,
              { color: isPastDue ? "#DC2626" : "#B45309" },
            ]}>
              {isPastDue
                ? t("paybookSchedule.card.overdueDays", { days: Math.abs(daysUntilDue) })
                : t("paybookSchedule.card.daysLeft", { days: daysUntilDue })}
            </CustomText>
          </View>
        )}

        {/* Expanded details */}
        {isExpanded && (
          <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
            <View style={styles.detailRow}>
              <CustomText style={[styles.detailLabel, { color: colors.icon }]}>
                {t("paybookSchedule.card.openingBalance")}
              </CustomText>
              <CustomText style={[styles.detailValue, { color: colors.text }]}>
                {formatCurrency(item.opening_balance)}
              </CustomText>
            </View>
            <View style={styles.detailRow}>
              <CustomText style={[styles.detailLabel, { color: colors.icon }]}>
                {t("paybookSchedule.card.principalDue")}
              </CustomText>
              <CustomText style={[styles.detailValue, { color: colors.text }]}>
                {formatCurrency(item.principal_due_amount)}
              </CustomText>
            </View>
            <View style={styles.detailRow}>
              <CustomText style={[styles.detailLabel, { color: colors.icon }]}>
                {t("paybookSchedule.card.interestDue")}
              </CustomText>
              <CustomText style={[styles.detailValue, { color: colors.text }]}>
                {formatCurrency(item.interest_due_amount)}
              </CustomText>
            </View>

            <View style={[styles.detailSeparator, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <CustomText style={[styles.detailLabel, { color: colors.icon }]}>
                {t("paybookSchedule.card.paidPrincipal")}
              </CustomText>
              <CustomText style={[styles.detailValue, { color: colors.text }]}>
                {formatCurrency(item.paid_principal_amount)}
              </CustomText>
            </View>
            <View style={styles.detailRow}>
              <CustomText style={[styles.detailLabel, { color: colors.icon }]}>
                {t("paybookSchedule.card.paidInterest")}
              </CustomText>
              <CustomText style={[styles.detailValue, { color: colors.text }]}>
                {formatCurrency(item.paid_interest_amount)}
              </CustomText>
            </View>

            <View style={[styles.detailSeparator, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <CustomText style={[styles.detailLabel, { color: colors.icon }]}>
                {t("paybookSchedule.card.closingBalance")}
              </CustomText>
              <CustomText style={[styles.detailValue, { color: colors.text }]}>
                {formatCurrency(item.closing_balance)}
              </CustomText>
            </View>
            <View style={styles.detailRow}>
              <CustomText style={[styles.detailLabel, { color: colors.icon }]}>
                {t("paybookSchedule.card.period")}
              </CustomText>
              <CustomText style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(item.from_date)} → {formatDate(item.to_date)}
              </CustomText>
            </View>
            {item.paid_date && (
              <View style={styles.detailRow}>
                <CustomText style={[styles.detailLabel, { color: colors.icon }]}>
                  {t("paybookSchedule.card.paidDate")}
                </CustomText>
                <CustomText style={[styles.detailValue, { color: "#15803D" }]}>
                  {formatDate(item.paid_date)}
                </CustomText>
              </View>
            )}
            {item.payment_ref_no && (
              <View style={styles.detailRow}>
                <CustomText style={[styles.detailLabel, { color: colors.icon }]}>
                  {t("paybookSchedule.card.paymentRef")}
                </CustomText>
                <CustomText style={[styles.detailValue, { color: colors.text }]}>
                  {item.payment_ref_no}
                </CustomText>
              </View>
            )}
          </View>
        )}

        {/* Expand indicator */}
        <View style={styles.expandIndicator}>
          <AppIcon
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={normalize(10)}
            color={colors.icon}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading || !isReady) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <AppHeader title={t("paybookSchedule.title")} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader title={t("paybookSchedule.title")} />

      <FlatList
        data={filteredSchedules}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderScheduleItem}
        ListHeaderComponent={
          <View>
            {renderSummary()}
            {renderFilterTabs()}
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppIcon
              name="calendar-xmark"
              size={normalize(48)}
              color={colors.icon}
              style={{ opacity: 0.4 }}
            />
            <CustomText style={[styles.emptyText, { color: colors.icon }]}>
              {t("paybookSchedule.empty")}
            </CustomText>
          </View>
        }
        ListFooterComponent={<View style={{ height: hp(4) }} />}
      />
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: {
      paddingHorizontal: wp(4),
      paddingTop: hp(1.5),
    },

    // ── Summary ──
    summaryCard: {
      borderRadius: normalize(16),
      padding: normalize(14),
      borderWidth: 1,
      marginBottom: hp(1.5),
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    summaryItem: {
      flex: 1,
      alignItems: "center",
    },
    summaryDivider: {
      width: 1,
      height: normalize(30),
      marginHorizontal: wp(1),
    },
    summaryLabel: {
      fontSize: normalize(10),
      fontFamily: Fonts.regular,
      marginBottom: hp(0.3),
      textAlign: "center",
    },
    summaryValue: {
      fontSize: normalize(13),
      fontFamily: Fonts.bold,
      textAlign: "center",
    },

    // ── Filter ──
    filterContainer: {
      flexDirection: "row",
      gap: wp(2),
      marginBottom: hp(1.5),
    },
    filterTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: hp(1),
      borderRadius: normalize(10),
      borderWidth: 1,
      gap: wp(1),
    },
    filterTabText: {
      fontSize: normalize(12),
      fontFamily: Fonts.medium,
    },
    filterBadge: {
      paddingHorizontal: wp(1.5),
      paddingVertical: hp(0.1),
      borderRadius: normalize(20),
    },
    filterBadgeText: {
      fontSize: normalize(10),
      fontFamily: Fonts.semiBold,
    },

    // ── Schedule Card ──
    scheduleCard: {
      borderRadius: normalize(16),
      padding: normalize(14),
      borderWidth: 1,
      marginBottom: hp(1),
    },
    scheduleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    scheduleHeaderLeft: {
      flexDirection: "row",
      alignItems: "flex-start",
      flex: 1,
    },
    scheduleDot: {
      width: normalize(28),
      height: normalize(28),
      borderRadius: normalize(8),
      alignItems: "center",
      justifyContent: "center",
      marginRight: wp(2.5),
    },
    scheduleHeaderMeta: {
      flex: 1,
    },
    scheduleKy: {
      fontSize: normalize(15),
      fontFamily: Fonts.semiBold,
    },
    scheduleDate: {
      fontSize: normalize(12),
      fontFamily: Fonts.regular,
      marginTop: hp(0.15),
    },
    scheduleHeaderRight: {
      alignItems: "flex-end",
    },
    scheduleTotal: {
      fontSize: normalize(15),
      fontFamily: Fonts.bold,
      marginBottom: hp(0.3),
    },
    scheduleStatusBadge: {
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.2),
      borderRadius: normalize(6),
    },
    scheduleStatusText: {
      fontSize: normalize(10),
      fontFamily: Fonts.semiBold,
    },

    // ── Due indicator ──
    dueIndicator: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.6),
      borderRadius: normalize(8),
      marginTop: hp(0.8),
    },
    dueIndicatorText: {
      fontSize: normalize(11),
      fontFamily: Fonts.semiBold,
    },

    // ── Expanded ──
    expandedSection: {
      marginTop: hp(1),
      paddingTop: hp(1),
      borderTopWidth: 1,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: hp(0.6),
    },
    detailLabel: {
      fontSize: normalize(12),
      fontFamily: Fonts.regular,
    },
    detailValue: {
      fontSize: normalize(13),
      fontFamily: Fonts.medium,
    },
    detailSeparator: {
      height: StyleSheet.hairlineWidth,
      marginVertical: hp(0.4),
    },

    // ── Expand indicator ──
    expandIndicator: {
      alignItems: "center",
      paddingTop: hp(0.6),
    },

    // ── Empty ──
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: hp(8),
    },
    emptyText: {
      fontSize: normalize(14),
      fontFamily: Fonts.regular,
      marginTop: hp(1.5),
    },
  });

export default PaybookScheduleScreen;