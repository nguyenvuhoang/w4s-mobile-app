import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import type {
  LoanStatus,
  ScheduleStatus
} from "@/features/paybook/types";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { hp, normalize, wp } from "@/utils/layout";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePaybookDetail } from "../hooks/usePaybook";

// ─── Component ───────────────────────────────────────────────────────────────

const PaybookDetailScreen = () => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showMenu, setShowMenu] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { loading, loanDetail, getLoanDetail } = usePaybookDetail();
  const { convertBetween, formatAmount, currencyFormatter, isReady, getCurrencyDetails } = useCurrencyConverter();

  // ─── Status configs (moved inside component to use 't') ────────────────────

  const STATUS_CONFIG: Record<
    LoanStatus,
    { label: string; color: string; bgColor: string; icon: string }
  > = useMemo(() => ({
    ACTIVE: { label: t("paybook.status_active"), color: "#B45309", bgColor: "#FEF3C7", icon: "clock" },
    COMPLETED: { label: t("paybook.status_completed"), color: "#15803D", bgColor: "#DCFCE7", icon: "check" },
    OVERDUE: { label: t("paybook.status_overdue"), color: "#DC2626", bgColor: "#FEE2E2", icon: "triangle-exclamation" },
    CANCELLED: { label: t("paybook.status_cancelled"), color: "#6B7280", bgColor: "#F3F4F6", icon: "ban" },
  }), [t]);

  const SCHEDULE_STATUS_CONFIG: Record<
    ScheduleStatus,
    { label: string; color: string; bgColor: string; icon: string }
  > = useMemo(() => ({
    PENDING: { label: t("paybookSchedule.status.PENDING"), color: "#B45309", bgColor: "#FEF3C7", icon: "clock" },
    PAID: { label: t("paybookSchedule.status.PAID"), color: "#15803D", bgColor: "#DCFCE7", icon: "check" },
    OVERDUE: { label: t("paybookSchedule.status.OVERDUE"), color: "#DC2626", bgColor: "#FEE2E2", icon: "triangle-exclamation" },
    PARTIAL: { label: t("paybookSchedule.status.PARTIAL"), color: "#7C3AED", bgColor: "#EDE9FE", icon: "circle-half-stroke" },
  }), [t]);

  const INTEREST_CALC_LABELS: Record<string, string> = useMemo(() => ({
    REDUCING: t("paybook.reducing"),
    FLAT: t("paybook.flat"),
  }), [t]);

  const PAYMENT_TYPE_LABELS: Record<string, string> = useMemo(() => ({
    INSTALLMENT: t("paybook.installment_payment"),
    BULLET: t("paybook.bullet"),
  }), [t]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        getLoanDetail(Number(id));
      }
    }, [id, getLoanDetail])
  );

  // TODO: Replace with actual API call later
  // const loan = MOCK_LOAN_DETAIL;
  const loan = loanDetail;
  console.log("loanDetail-----", JSON.stringify(loanDetail));

  // ── Formatters (must be before any early return — Rules of Hooks) ────────────
  const formatCurrency = useCallback((amount: number) => {
    const fromCurrency = loan?.currency_code ?? "VND";
    const converted = convertBetween(amount, fromCurrency);
    if (converted !== null) {
      return formatAmount(converted);
    }
    return formatAmount(amount, fromCurrency);
  }, [loan?.currency_code, convertBetween, formatAmount]);

  const formatCurrencyShort = useCallback((amount: number) => {
    const fromCurrency = loan?.currency_code ?? "VND";
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
  }, [i18n.language, loan?.currency_code, convertBetween, formatAmount, currencyFormatter, getCurrencyDetails]);

  // ── Early return: loading / no data / converter not ready ───────────────────
  if (loading || !loan || !isReady) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <AppHeader title={t("paybook.detailTitle")} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  const isLend = loan.loan_type === "LEND";
  const typeColor = isLend ? "#22C55E" : "#EF4444";
  const accentColor = colors.tint;
  const statusConfig = STATUS_CONFIG[loan.status];

  // ── Computed values ─────────────────────────────────────────────────────────
  const paidAmount = loan.principal_amount - loan.balance;
  const progress = loan.principal_amount > 0
    ? Math.min(paidAmount / loan.principal_amount, 1)
    : 0;

  const schedules = loan.schedules ?? [];
  const isInstallment = loan.payment_type === "INSTALLMENT";
  const hasInterest = loan.interest_rate > 0;
  const hasSchedules = schedules.length > 0;

  const totalInterest = schedules.reduce(
    (acc, s) => acc + s.interest_due_amount, 0
  );
  const paidInstallments = schedules.filter(
    (s) => s.status === "PAID"
  ).length;
  const nextSchedule = schedules.find(
    (s) => s.status === "PENDING" || s.status === "OVERDUE"
  );

  const daysToMaturity = Math.ceil(
    (new Date(loan.maturity_date).getTime() - Date.now()) / 86_400_000
  );

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

  // ── Navigate to schedule screen ─────────────────────────────────────────────
  const handleViewSchedule = () => {
    router.push({
      pathname: "/(protected)/paybook/schedule",
      params: { loanId: String(loan.id) },
    });
  };

  // ── Navigate to history screen ─────────────────────────────────────────────
  const handleViewHistory = () => {
    router.push({
      pathname: "/(protected)/paybook/transaction-history",
      params: { loanId: String(loan.id) },
    });
  };

  const handleShare = async () => {
    try {
      const shareMessage = [
        t("paybook.share_message_header"),
        `-------------------------`,
        `${t("paybook.partner")}: ${loan.counterparty_name}`,
        `${t("paybook.type")}: ${isLend ? t("paybook.lend") : t("paybook.borrow")}`,
        `${t("paybook.originalPrincipal")}: ${formatCurrency(loan.principal_amount)}`,
        `${t("paybook.remaining")}: ${formatCurrency(loan.balance)}`,
        `${t("paybook.maturity_date")}: ${formatDate(loan.maturity_date)}`,
        `${t("paybook.note")}: ${loan.note || t("paybook.no_note")}`,
        `-------------------------`,
        t("paybook.app_footer"),
      ].join("\n");

      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.error("[PaybookDetail] Share failed:", error);
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const InfoRow = ({ label, value, valueColor, icon }: {
    label: string;
    value: string;
    valueColor?: string;
    icon?: string;
  }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        {icon && (
          <AppIcon
            name={icon as any}
            size={normalize(12)}
            color={colors.icon}
            style={{ marginRight: wp(2), width: normalize(16), textAlign: "center" }}
          />
        )}
        <CustomText style={[styles.infoLabel, { color: colors.icon }]}>
          {label}
        </CustomText>
      </View>
      <CustomText
        style={[styles.infoValue, { color: valueColor || colors.text }]}
        numberOfLines={1}
      >
        {value}
      </CustomText>
    </View>
  );

  // --- Menu Dropdown ---
  const MenuDropdown = ({ visible, onClose, onEdit, onDelete, onShare, onViewHistory }: any) => {
    if (!visible) return null;
    return (
      <View style={[styles.menuDropdown, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        {[
          { icon: 'share-nodes', label: t("paybook.share"), onPress: onShare, color: colors.text },
          { icon: 'receipt', label: t("paybook.transaction_history"), onPress: onViewHistory, color: colors.text },
          { icon: 'pen-to-square', label: t("paybook.edit"), onPress: onEdit, color: colors.text },
          { icon: 'trash-can', label: t("paybook.delete"), onPress: onDelete, color: '#EF4444' },
        ].map((item, i, arr) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); item.onPress(); }}>
              <AppIcon name={item.icon as any} size={normalize(15)} color={item.color} />
              <CustomText style={[styles.menuItemText, { color: item.color }]}>{item.label}</CustomText>
            </TouchableOpacity>
            {i < arr.length - 1 && <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader
        title={t("paybook.detailTitle")}
        rightComponent={
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={{ padding: normalize(8) }}>
            <AppIcon name="ellipsis-vertical" size={normalize(20)} color={colors.icon} />
          </TouchableOpacity>
        }
      />

      <MenuDropdown
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onEdit={() => router.push({
          pathname: "/(protected)/paybook/edit",
          params: { loanId: String(loan.id) },
        })}
        onDelete={() => {
          // TODO: Implement delete logic
          console.log("Delete loan", loan.id);
        }}
        onShare={handleShare}
        onViewHistory={handleViewHistory}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ════════════════════════════════════════════════════════════════════
            1. HERO CARD — Thông tin chính + progress
        ════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header: Avatar + Name + Status */}
          <View style={styles.heroHeader}>
            <View style={styles.heroHeaderLeft}>
              <View style={[styles.heroAvatar, { backgroundColor: isLend ? "#E8F5E9" : "#FFEBEE" }]}>
                <AppIcon
                  name={loan.counterparty_type === "MERCHANT" ? "building" : "user"}
                  size={normalize(20)}
                  color={typeColor}
                />
              </View>
              <View style={styles.heroMeta}>
                <CustomText style={[styles.heroName, { color: colors.text }]} numberOfLines={1}>
                  {loan.counterparty_name}
                </CustomText>
                <View style={styles.heroSubRow}>
                  <View style={[styles.typeBadge, { backgroundColor: isLend ? "#E8F5E9" : "#FFEBEE" }]}>
                    <AppIcon
                      name={isLend ? "arrow-trend-up" : "arrow-trend-down"}
                      size={normalize(9)}
                      color={typeColor}
                      style={{ marginRight: wp(1) }}
                    />
                    <CustomText style={[styles.typeBadgeText, { color: typeColor }]}>
                      {isLend ? t("paybook.lend") : t("paybook.borrow")}
                    </CustomText>
                  </View>
                  <CustomText style={[styles.loanNo, { color: colors.icon }]}>
                    #{loan.loan_no}
                  </CustomText>
                </View>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <AppIcon
                name={statusConfig.icon as any}
                size={normalize(10)}
                color={statusConfig.color}
                style={{ marginRight: wp(1) }}
              />
              <CustomText style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </CustomText>
            </View>
          </View>

          {/* ── Amount Section ── */}
          <View style={[styles.amountSection, { borderTopColor: colors.border }]}>
            <View style={[styles.amountBox, { backgroundColor: `${accentColor}10` }]}>
              <CustomText style={[styles.amountBoxLabel, { color: colors.icon }]}>
                {t("paybook.currentBalance")}
              </CustomText>
              <CustomText style={[styles.amountBoxValue, { color: accentColor }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(loan.balance)}
              </CustomText>
            </View>
            <View style={[styles.amountBox, { backgroundColor: `${colors.border}40` }]}>
              <CustomText style={[styles.amountBoxLabel, { color: colors.icon }]}>
                {t("paybook.originalPrincipal")}
              </CustomText>
              <CustomText style={[styles.amountBoxValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(loan.principal_amount)}
              </CustomText>
            </View>
          </View>

          {/* ── Progress ── */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <CustomText style={[styles.progressLabelText, { color: colors.icon }]}>
                {t("paybook.progress")}
              </CustomText>
              <CustomText style={[styles.progressPercent, { color: accentColor }]}>
                {Math.round(progress * 100)}%
              </CustomText>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: `${accentColor}20` }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(Math.round(progress * 100), 2)}%` as any,
                    backgroundColor: accentColor,
                  },
                ]}
              />
            </View>
            <View style={styles.progressFooter}>
              <CustomText style={[styles.progressFooterText, { color: colors.icon }]}>
                {t("paybook.paid")}: {formatCurrencyShort(paidAmount)}
              </CustomText>
              <CustomText style={[styles.progressFooterText, { color: colors.icon }]}>
                {isInstallment && loan.total_installments
                  ? `${paidInstallments}/${loan.total_installments} ${t("paybook.installments")}`
                  : t("paybook.bullet")}
              </CustomText>
            </View>
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            2. KỲ THANH TOÁN TIẾP THEO
        ════════════════════════════════════════════════════════════════════ */}
        {nextSchedule && (
          <View style={[styles.nextPaymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleLeft}>
                <View style={[styles.sectionDot, { backgroundColor: accentColor }]} />
                <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
                  {t("paybook.nextPayment")}
                </CustomText>
              </View>
              <View style={[styles.scheduleBadge, { backgroundColor: "#FEF3C7" }]}>
                <CustomText style={[styles.scheduleBadgeText, { color: "#B45309" }]}>
                  {t("paybook.installment")} {nextSchedule.installment_no}
                </CustomText>
              </View>
            </View>

            <View style={styles.nextPaymentContent}>
              {/* Số tiền cần trả */}
              <View style={[styles.nextPaymentAmount, { backgroundColor: `${accentColor}08`, borderColor: `${accentColor}20` }]}>
                <CustomText style={[styles.nextPaymentAmountLabel, { color: colors.icon }]}>
                  {t("paybook.totalDue")}
                </CustomText>
                <CustomText style={[styles.nextPaymentAmountVal, { color: accentColor }]}>
                  {formatCurrency(nextSchedule.principal_due_amount + nextSchedule.interest_due_amount)}
                </CustomText>
                <View style={styles.nextPaymentBreakdown}>
                  <View style={styles.nextPaymentBreakdownItem}>
                    <CustomText style={[styles.breakdownLabel, { color: colors.icon }]}>
                      {t("paybook.principal")}
                    </CustomText>
                    <CustomText style={[styles.breakdownValue, { color: colors.text }]}>
                      {formatCurrency(nextSchedule.principal_due_amount)}
                    </CustomText>
                  </View>
                  <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.nextPaymentBreakdownItem}>
                    <CustomText style={[styles.breakdownLabel, { color: colors.icon }]}>
                      {t("paybook.interest")}
                    </CustomText>
                    <CustomText style={[styles.breakdownValue, { color: colors.text }]}>
                      {formatCurrency(nextSchedule.interest_due_amount)}
                    </CustomText>
                  </View>
                </View>
              </View>

              {/* Ngày đến hạn */}
              <View style={styles.nextPaymentDateRow}>
                <View style={styles.nextPaymentDateItem}>
                  <AppIcon
                    name="calendar-days"
                    size={normalize(13)}
                    color={colors.icon}
                    style={{ marginRight: wp(2) }}
                  />
                  <View>
                    <CustomText style={[styles.nextDateLabel, { color: colors.icon }]}>
                      {t("paybook.dueDate")}
                    </CustomText>
                    <CustomText style={[styles.nextDateValue, { color: colors.text }]}>
                      {formatDate(nextSchedule.due_date)}
                    </CustomText>
                  </View>
                </View>
                {(() => {
                  const daysUntilDue = getDaysLeft(nextSchedule.due_date);
                  const isOverdue = daysUntilDue < 0;
                  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;
                  return (
                    <View style={[
                      styles.daysLeftBadge,
                      {
                        backgroundColor: isOverdue ? "#FEE2E2"
                          : isDueSoon ? "#FEF3C7"
                            : "#EEF2FF",
                      },
                    ]}>
                      <AppIcon
                        name={isOverdue ? "triangle-exclamation" : "hourglass-half"}
                        size={normalize(10)}
                        color={isOverdue ? "#DC2626" : isDueSoon ? "#B45309" : "#6366F1"}
                        style={{ marginRight: wp(1) }}
                      />
                      <CustomText style={[
                        styles.daysLeftText,
                        { color: isOverdue ? "#DC2626" : isDueSoon ? "#B45309" : "#6366F1" },
                      ]}>
                        {isOverdue
                          ? t("paybook.overdueDays", { days: Math.abs(daysUntilDue) })
                          : t("paybook.remainingDays", { days: daysUntilDue })}
                      </CustomText>
                    </View>
                  );
                })()}
              </View>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            3. THÔNG TIN KHOẢN VAY
        ════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleLeft}>
              <View style={[styles.sectionDot, { backgroundColor: accentColor }]} />
              <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
                {t("paybook.detailTitle")}
              </CustomText>
            </View>
          </View>

          <View style={styles.infoContent}>
            {loan.contract_number ? (
              <InfoRow
                icon="file-contract"
                label={t("paybook.contract_number")}
                value={loan.contract_number}
              />
            ) : null}
            {loan.description ? (
              <InfoRow
                icon="file-lines"
                label={t("paybook.description")}
                value={loan.description}
              />
            ) : null}
            {hasInterest ? (
              <>
                <InfoRow
                  icon="percent"
                  label={t("paybook.interest")}
                  value={`${loan.interest_rate}%/${t("paybook.year")}`}
                  valueColor={accentColor}
                />
                <InfoRow
                  icon="calculator"
                  label={t("paybook.interest_calc_method")}
                  value={INTEREST_CALC_LABELS[loan.interest_calc_method] || loan.interest_calc_method}
                />
                <InfoRow
                  icon="money-bill-wave"
                  label={t("paybook.totalInterest")}
                  value={formatCurrency(totalInterest)}
                />
              </>
            ) : (
              <InfoRow
                icon="percent"
                label={t("paybook.interest")}
                value={t("paybook.no_interest")}
              />
            )}
            <InfoRow
              icon="credit-card"
              label={t("paybook.type")}
              value={
                isInstallment && loan.total_installments
                  ? `${PAYMENT_TYPE_LABELS[loan.payment_type]} (${loan.total_installments} ${t("paybook.installments")})`
                  : PAYMENT_TYPE_LABELS[loan.payment_type] || loan.payment_type
              }
            />
            <InfoRow
              icon="calendar"
              label={t("paybook.start_date")}
              value={formatDate(loan.start_date)}
            />
            <InfoRow
              icon="calendar-check"
              label={t("paybook.maturity_date")}
              value={formatDate(loan.maturity_date)}
              valueColor={
                daysToMaturity < 0
                  ? "#DC2626"
                  : daysToMaturity <= 30
                    ? "#B45309"
                    : undefined
              }
            />
            {loan.note ? (
              <InfoRow
                icon="sticky-note"
                label={t("paybook.note")}
                value={loan.note}
              />
            ) : null}
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            4. TỔNG QUAN CÁC KỲ (preview 3 kỳ gần nhất + nút xem tất cả)
        ════════════════════════════════════════════════════════════════════ */}
        {hasSchedules && (
          <View style={[styles.schedulePreviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleLeft}>
                <View style={[styles.sectionDot, { backgroundColor: accentColor }]} />
                <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
                  {t("paybook.payment_schedule")}
                </CustomText>
              </View>
              <TouchableOpacity
                style={[styles.viewAllButton, { backgroundColor: `${accentColor}15` }]}
                activeOpacity={0.7}
                onPress={handleViewSchedule}
              >
                <CustomText style={[styles.viewAllText, { color: accentColor }]}>
                  {t("paybook.view_all")}
                </CustomText>
                <AppIcon
                  name="chevron-right"
                  size={normalize(10)}
                  color={accentColor}
                  style={{ marginLeft: wp(1) }}
                />
              </TouchableOpacity>
            </View>

            {/* Timeline-style schedule preview */}
            <View style={styles.scheduleTimeline}>
              {schedules.slice(0, 3).map((schedule, index) => {
                const schedStatusCfg = SCHEDULE_STATUS_CONFIG[schedule.status];
                const totalDue = schedule.principal_due_amount + schedule.interest_due_amount;
                const isLast = index === Math.min(2, schedules.length - 1);

                return (
                  <View key={schedule.id} style={styles.timelineItem}>
                    {/* Timeline line */}
                    <View style={styles.timelineLineWrapper}>
                      <View style={[styles.timelineDot, { backgroundColor: schedStatusCfg.color }]}>
                        <AppIcon
                          name={schedStatusCfg.icon as any}
                          size={normalize(8)}
                          color="#fff"
                        />
                      </View>
                      {!isLast && (
                        <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                      )}
                    </View>

                    {/* Schedule content */}
                    <View style={[styles.timelineContent, { borderColor: colors.border }]}>
                      <View style={styles.timelineContentHeader}>
                        <CustomText style={[styles.timelineKy, { color: colors.text }]}>
                          {t("paybook.installment")} {schedule.installment_no}
                        </CustomText>
                        <View style={[styles.timelineStatusBadge, { backgroundColor: schedStatusCfg.bgColor }]}>
                          <CustomText style={[styles.timelineStatusText, { color: schedStatusCfg.color }]}>
                            {schedStatusCfg.label}
                          </CustomText>
                        </View>
                      </View>
                      <View style={styles.timelineRow}>
                        <CustomText style={[styles.timelineDate, { color: colors.icon }]}>
                          {t("paybook.dueDate")}: {formatDate(schedule.due_date)}
                        </CustomText>
                        <CustomText style={[styles.timelineAmount, { color: colors.text }]}>
                          {formatCurrencyShort(totalDue)}
                        </CustomText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* View all button */}
            {schedules.length > 3 && (
              <TouchableOpacity
                style={[styles.viewAllBottomButton, { borderColor: colors.border }]}
                onPress={handleViewSchedule}
                activeOpacity={0.7}
              >
                <CustomText style={[styles.viewAllBottomText, { color: accentColor }]}>
                  {t("paybook.view_all_installments", { count: schedules.length })}
                </CustomText>
                <AppIcon
                  name="arrow-right"
                  size={normalize(12)}
                  color={accentColor}
                  style={{ marginLeft: wp(1.5) }}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            5. TỔNG KẾT NHANH
        ════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleLeft}>
              <View style={[styles.sectionDot, { backgroundColor: accentColor }]} />
              <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
                {t("paybook.summary")}
              </CustomText>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            {/* Gốc đã trả */}
            <View style={[styles.summaryGridItem, { backgroundColor: `${accentColor}08` }]}>
              <View style={[styles.summaryGridIcon, { backgroundColor: `${accentColor}15` }]}>
                <AppIcon name="money-bill-1" size={normalize(14)} color={accentColor} />
              </View>
              <CustomText style={[styles.summaryGridLabel, { color: colors.icon }]}>
                {t("paybook.paidPrincipal")}
              </CustomText>
              <CustomText style={[styles.summaryGridValue, { color: colors.text }]}>
                {formatCurrencyShort(paidAmount)}
              </CustomText>
            </View>

            {/* Lãi dự kiến — chỉ hiển thị khi có lãi */}
            {hasInterest ? (
              <View style={[styles.summaryGridItem, { backgroundColor: `${accentColor}08` }]}>
                <View style={[styles.summaryGridIcon, { backgroundColor: `${accentColor}15` }]}>
                  <AppIcon name="chart-line" size={normalize(14)} color={accentColor} />
                </View>
                <CustomText style={[styles.summaryGridLabel, { color: colors.icon }]}>
                  {t("paybook.totalInterest")}
                </CustomText>
                <CustomText style={[styles.summaryGridValue, { color: colors.text }]}>
                  {formatCurrencyShort(totalInterest)}
                </CustomText>
              </View>
            ) : (
              <View style={[styles.summaryGridItem, { backgroundColor: `${accentColor}08` }]}>
                <View style={[styles.summaryGridIcon, { backgroundColor: `${accentColor}15` }]}>
                  <AppIcon name="percent" size={normalize(14)} color={accentColor} />
                </View>
                <CustomText style={[styles.summaryGridLabel, { color: colors.icon }]}>
                  {t("paybook.interest")}
                </CustomText>
                <CustomText style={[styles.summaryGridValue, { color: colors.text }]}>
                  {t("paybook.no_interest")}
                </CustomText>
              </View>
            )}

            {/* Tổng phải trả */}
            <View style={[styles.summaryGridItem, { backgroundColor: `${accentColor}08` }]}>
              <View style={[styles.summaryGridIcon, { backgroundColor: `${accentColor}15` }]}>
                <AppIcon name="coins" size={normalize(14)} color={accentColor} />
              </View>
              <CustomText style={[styles.summaryGridLabel, { color: colors.icon }]}>
                {t("paybook.totalPayment")}
              </CustomText>
              <CustomText style={[styles.summaryGridValue, { color: colors.text }]}>
                {formatCurrencyShort(loan.principal_amount + totalInterest)}
              </CustomText>
            </View>

            {/* Còn lại */}
            <View style={[styles.summaryGridItem, { backgroundColor: `${accentColor}08` }]}>
              <View style={[styles.summaryGridIcon, { backgroundColor: `${accentColor}15` }]}>
                <AppIcon name="hourglass-half" size={normalize(14)} color={accentColor} />
              </View>
              <CustomText style={[styles.summaryGridLabel, { color: colors.icon }]}>
                {t("paybook.remainingTime")}
              </CustomText>
              <CustomText style={[styles.summaryGridValue, { color: colors.text }]}>
                {daysToMaturity > 0 ? `${daysToMaturity} ${i18n.language === "vi" ? "ngày" : "days"}` : t("paybook.expired")}
              </CustomText>
            </View>
          </View>
        </View>

        <View style={{ height: hp(4) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: wp(4), paddingTop: hp(1.5), paddingBottom: hp(6) },

    // Menu button
    menuButton: {
      width: normalize(36),
      height: normalize(36),
      borderRadius: normalize(18),
      alignItems: "center",
      justifyContent: "center",
    },

    // ── Hero Card ──
    heroCard: {
      borderRadius: normalize(20),
      padding: normalize(16),
      borderWidth: 1,
      marginBottom: hp(1.5),
    },
    heroHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    heroHeaderLeft: {
      flexDirection: "row",
      alignItems: "flex-start",
      flex: 1,
      marginRight: wp(2),
    },
    heroAvatar: {
      width: normalize(46),
      height: normalize(46),
      borderRadius: normalize(14),
      alignItems: "center",
      justifyContent: "center",
      marginRight: wp(3),
    },
    heroMeta: { flex: 1 },
    heroName: {
      fontSize: normalize(17),
      fontFamily: Fonts.bold,
      marginBottom: hp(0.4),
    },
    heroSubRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(2),
    },
    typeBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.25),
      borderRadius: normalize(6),
    },
    typeBadgeText: {
      fontSize: normalize(10),
      fontFamily: Fonts.semiBold,
    },
    loanNo: {
      fontSize: normalize(11),
      fontFamily: Fonts.regular,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.4),
      borderRadius: normalize(8),
    },
    statusText: {
      fontSize: normalize(10),
      fontFamily: Fonts.semiBold,
    },

    // ── Amount Section ──
    amountSection: {
      flexDirection: "row",
      gap: normalize(10),
      marginTop: hp(1.5),
      paddingTop: hp(1.5),
      borderTopWidth: 1,
    },
    amountBox: {
      flex: 1,
      borderRadius: normalize(12),
      padding: normalize(12),
      alignItems: "center",
    },
    amountBoxLabel: {
      fontSize: normalize(11),
      fontFamily: Fonts.regular,
      marginBottom: hp(0.3),
    },
    amountBoxValue: {
      fontSize: normalize(16),
      fontFamily: Fonts.bold,
    },

    // ── Progress ──
    progressSection: {
      marginTop: hp(1.5),
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: hp(0.6),
    },
    progressLabelText: {
      fontSize: normalize(11),
      fontFamily: Fonts.regular,
    },
    progressPercent: {
      fontSize: normalize(13),
      fontFamily: Fonts.bold,
    },
    progressTrack: {
      height: normalize(8),
      borderRadius: normalize(4),
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: normalize(4),
    },
    progressFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: hp(0.5),
    },
    progressFooterText: {
      fontSize: normalize(11),
      fontFamily: Fonts.regular,
    },

    // ── Next Payment Card ──
    nextPaymentCard: {
      borderRadius: normalize(20),
      padding: normalize(16),
      borderWidth: 1,
      marginBottom: hp(1.5),
    },
    nextPaymentContent: {
      marginTop: hp(1.2),
    },
    nextPaymentAmount: {
      borderRadius: normalize(14),
      padding: normalize(14),
      borderWidth: 1,
      marginBottom: hp(1),
    },
    nextPaymentAmountLabel: {
      fontSize: normalize(11),
      fontFamily: Fonts.regular,
      marginBottom: hp(0.3),
    },
    nextPaymentAmountVal: {
      fontSize: normalize(20),
      fontFamily: Fonts.bold,
      marginBottom: hp(0.8),
    },
    nextPaymentBreakdown: {
      flexDirection: "row",
      alignItems: "center",
    },
    nextPaymentBreakdownItem: {
      flex: 1,
    },
    breakdownLabel: {
      fontSize: normalize(10),
      fontFamily: Fonts.regular,
      marginBottom: hp(0.15),
    },
    breakdownValue: {
      fontSize: normalize(13),
      fontFamily: Fonts.semiBold,
    },
    breakdownDivider: {
      width: 1,
      height: normalize(28),
      marginHorizontal: wp(3),
    },
    nextPaymentDateRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    nextPaymentDateItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    nextDateLabel: {
      fontSize: normalize(10),
      fontFamily: Fonts.regular,
    },
    nextDateValue: {
      fontSize: normalize(13),
      fontFamily: Fonts.semiBold,
    },
    daysLeftBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.4),
      borderRadius: normalize(8),
    },
    daysLeftText: {
      fontSize: normalize(11),
      fontFamily: Fonts.semiBold,
    },

    // ── Section commons ──
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitleLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    sectionDot: {
      width: normalize(8),
      height: normalize(8),
      borderRadius: normalize(4),
      marginRight: wp(2),
    },
    sectionTitle: {
      fontSize: normalize(15),
      fontFamily: Fonts.semiBold,
    },
    scheduleBadge: {
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.3),
      borderRadius: normalize(8),
    },
    scheduleBadgeText: {
      fontSize: normalize(11),
      fontFamily: Fonts.semiBold,
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.4),
      borderRadius: normalize(8),
    },
    viewAllText: {
      fontSize: normalize(12),
      fontFamily: Fonts.semiBold,
    },

    // ── Info Card ──
    infoCard: {
      borderRadius: normalize(20),
      padding: normalize(16),
      borderWidth: 1,
      marginBottom: hp(1.5),
    },
    infoContent: {
      marginTop: hp(1),
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: hp(1),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    infoRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 0.45,
    },
    infoLabel: {
      fontSize: normalize(12),
      fontFamily: Fonts.regular,
    },
    infoValue: {
      fontSize: normalize(13),
      fontFamily: Fonts.medium,
      flex: 0.55,
      textAlign: "right",
    },

    // ── Schedule Preview ──
    schedulePreviewCard: {
      borderRadius: normalize(20),
      padding: normalize(16),
      borderWidth: 1,
      marginBottom: hp(1.5),
    },
    scheduleTimeline: {
      marginTop: hp(1.5),
    },
    timelineItem: {
      flexDirection: "row",
    },
    timelineLineWrapper: {
      alignItems: "center",
      width: normalize(24),
      marginRight: wp(2.5),
    },
    timelineDot: {
      width: normalize(22),
      height: normalize(22),
      borderRadius: normalize(11),
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    timelineLine: {
      width: 2,
      flex: 1,
      marginTop: -2,
    },
    timelineContent: {
      flex: 1,
      borderWidth: 1,
      borderRadius: normalize(12),
      padding: normalize(12),
      marginBottom: hp(1),
    },
    timelineContentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: hp(0.5),
    },
    timelineKy: {
      fontSize: normalize(14),
      fontFamily: Fonts.semiBold,
    },
    timelineStatusBadge: {
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.2),
      borderRadius: normalize(6),
    },
    timelineStatusText: {
      fontSize: normalize(10),
      fontFamily: Fonts.semiBold,
    },
    timelineRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    timelineDate: {
      fontSize: normalize(12),
      fontFamily: Fonts.regular,
    },
    timelineAmount: {
      fontSize: normalize(14),
      fontFamily: Fonts.bold,
    },
    viewAllBottomButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: hp(1.2),
      borderTopWidth: 1,
      marginTop: hp(0.5),
    },
    viewAllBottomText: {
      fontSize: normalize(13),
      fontFamily: Fonts.semiBold,
    },

    // ── Summary Card ──
    summaryCard: {
      borderRadius: normalize(20),
      padding: normalize(16),
      borderWidth: 1,
      marginBottom: hp(1.5),
    },
    summaryGrid: {
      marginTop: hp(1.2),
      flexDirection: "row",
      flexWrap: "wrap",
      gap: normalize(10),
    },
    summaryGridItem: {
      width: "47%" as any,
      borderRadius: normalize(14),
      padding: normalize(12),
    },
    summaryGridIcon: {
      width: normalize(32),
      height: normalize(32),
      borderRadius: normalize(10),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hp(0.6),
    },
    summaryGridLabel: {
      fontSize: normalize(11),
      fontFamily: Fonts.regular,
      marginBottom: hp(0.2),
    },
    summaryGridValue: {
      fontSize: normalize(14),
      fontFamily: Fonts.bold,
    },

    // --- Menu Dropdown ---
    menuDropdown: {
      position: 'absolute',
      top: hp(6),
      right: wp(4),
      borderRadius: normalize(14),
      paddingVertical: normalize(6),
      minWidth: normalize(160),
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 1000,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: normalize(16),
      paddingVertical: normalize(12),
      gap: normalize(12),
    },
    menuItemText: { fontSize: normalize(14), fontFamily: Fonts.medium },
    menuDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: normalize(12) },
  });

export default PaybookDetailScreen;
