import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import type {
  LoanStatus,
  ScheduleStatus
} from "@/features/paybook/types";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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

// ─── Status configs ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  LoanStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  ACTIVE: { label: "Đang hoạt động", color: "#B45309", bgColor: "#FEF3C7", icon: "clock" },
  COMPLETED: { label: "Đã tất toán", color: "#15803D", bgColor: "#DCFCE7", icon: "check" },
  OVERDUE: { label: "Quá hạn", color: "#DC2626", bgColor: "#FEE2E2", icon: "triangle-exclamation" },
  CANCELLED: { label: "Đã huỷ", color: "#6B7280", bgColor: "#F3F4F6", icon: "ban" },
};

const SCHEDULE_STATUS_CONFIG: Record<
  ScheduleStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  PENDING: { label: "Chờ thanh toán", color: "#B45309", bgColor: "#FEF3C7", icon: "clock" },
  PAID: { label: "Đã thanh toán", color: "#15803D", bgColor: "#DCFCE7", icon: "check" },
  OVERDUE: { label: "Quá hạn", color: "#DC2626", bgColor: "#FEE2E2", icon: "triangle-exclamation" },
  PARTIAL: { label: "Thanh toán 1 phần", color: "#7C3AED", bgColor: "#EDE9FE", icon: "circle-half-stroke" },
};

const INTEREST_CALC_LABELS: Record<string, string> = {
  REDUCING: "Dư nợ giảm dần",
  FLAT: "Lãi phẳng",
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  INSTALLMENT: "Trả góp",
  BULLET: "Trả 1 lần",
};

// ─── Component ───────────────────────────────────────────────────────────────

const PaybookDetailScreen = () => {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showMenu, setShowMenu] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { loading, loanDetail, getLoanDetail } = usePaybookDetail();

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

  // ── Formatters (must be before any early return — Rules of Hooks) ────────────
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(amount));
  }, []);

  const formatCurrencyShort = useCallback((amount: number) => {
    if (amount >= 1_000_000_000)
      return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} Tỷ`;
    if (amount >= 1_000_000)
      return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")} Tr`;
    return new Intl.NumberFormat("vi-VN").format(Math.round(amount));
  }, []);

  // ── Early return: loading / no data ─────────────────────────────────────────
  if (loading || !loan) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <AppHeader title="Chi tiết sổ nợ" />
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
      return new Date(iso).toLocaleDateString("vi-VN", {
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
        "📄 CHI TIẾT SỔ NỢ",
        `-------------------------`,
        `👤 Đối tác: ${loan.counterparty_name}`,
        `🔹 Loại: ${isLend ? "Cho vay" : "Đi vay"}`,
        `💰 Số tiền gốc: ${formatCurrency(loan.principal_amount)} đ`,
        `📉 Còn lại: ${formatCurrency(loan.balance)} đ`,
        `📅 Ngày đáo hạn: ${formatDate(loan.maturity_date)}`,
        `📝 Ghi chú: ${loan.note || "Không có"}`,
        `-------------------------`,
        "Ứng dụng quản lý tài chính W4S",
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
          <FontAwesome6
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
          { icon: 'share-nodes', label: 'Chia sẻ', onPress: onShare, color: colors.text },
          { icon: 'receipt', label: 'Lịch sử giao dịch', onPress: onViewHistory, color: colors.text },
          { icon: 'pen-to-square', label: 'Chỉnh sửa', onPress: onEdit, color: colors.text },
          { icon: 'trash-can', label: 'Xoá sổ nợ', onPress: onDelete, color: '#EF4444' },
        ].map((item, i, arr) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); item.onPress(); }}>
              <FontAwesome6 name={item.icon} size={normalize(15)} color={item.color} />
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
        title="Chi tiết sổ nợ"
        rightComponent={
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={{ padding: normalize(8) }}>
            <FontAwesome6 name="ellipsis-vertical" size={normalize(20)} color={colors.icon} />
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
                <FontAwesome6
                  name={loan.counterparty_type === "MERCHANT" ? "building" : "user"}
                  size={normalize(20)}
                  color={typeColor}
                  solid
                />
              </View>
              <View style={styles.heroMeta}>
                <CustomText style={[styles.heroName, { color: colors.text }]} numberOfLines={1}>
                  {loan.counterparty_name}
                </CustomText>
                <View style={styles.heroSubRow}>
                  <View style={[styles.typeBadge, { backgroundColor: isLend ? "#E8F5E9" : "#FFEBEE" }]}>
                    <FontAwesome6
                      name={isLend ? "arrow-trend-up" : "arrow-trend-down"}
                      size={normalize(9)}
                      color={typeColor}
                      style={{ marginRight: wp(1) }}
                    />
                    <CustomText style={[styles.typeBadgeText, { color: typeColor }]}>
                      {isLend ? "Cho vay" : "Đi vay"}
                    </CustomText>
                  </View>
                  <CustomText style={[styles.loanNo, { color: colors.icon }]}>
                    #{loan.loan_no}
                  </CustomText>
                </View>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <FontAwesome6
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
                Dư nợ hiện tại
              </CustomText>
              <CustomText style={[styles.amountBoxValue, { color: accentColor }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(loan.balance)} đ
              </CustomText>
            </View>
            <View style={[styles.amountBox, { backgroundColor: `${colors.border}40` }]}>
              <CustomText style={[styles.amountBoxLabel, { color: colors.icon }]}>
                Gốc ban đầu
              </CustomText>
              <CustomText style={[styles.amountBoxValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(loan.principal_amount)} đ
              </CustomText>
            </View>
          </View>

          {/* ── Progress ── */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <CustomText style={[styles.progressLabelText, { color: colors.icon }]}>
                Tiến độ thanh toán
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
                Đã trả: {formatCurrencyShort(paidAmount)} đ
              </CustomText>
              <CustomText style={[styles.progressFooterText, { color: colors.icon }]}>
                {isInstallment && loan.total_installments
                  ? `${paidInstallments}/${loan.total_installments} kỳ`
                  : "Trả 1 lần"}
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
                  Kỳ thanh toán tiếp theo
                </CustomText>
              </View>
              <View style={[styles.scheduleBadge, { backgroundColor: "#FEF3C7" }]}>
                <CustomText style={[styles.scheduleBadgeText, { color: "#B45309" }]}>
                  Kỳ {nextSchedule.installment_no}
                </CustomText>
              </View>
            </View>

            <View style={styles.nextPaymentContent}>
              {/* Số tiền cần trả */}
              <View style={[styles.nextPaymentAmount, { backgroundColor: `${accentColor}08`, borderColor: `${accentColor}20` }]}>
                <CustomText style={[styles.nextPaymentAmountLabel, { color: colors.icon }]}>
                  Tổng cần thanh toán
                </CustomText>
                <CustomText style={[styles.nextPaymentAmountVal, { color: accentColor }]}>
                  {formatCurrency(nextSchedule.principal_due_amount + nextSchedule.interest_due_amount)} đ
                </CustomText>
                <View style={styles.nextPaymentBreakdown}>
                  <View style={styles.nextPaymentBreakdownItem}>
                    <CustomText style={[styles.breakdownLabel, { color: colors.icon }]}>
                      Gốc
                    </CustomText>
                    <CustomText style={[styles.breakdownValue, { color: colors.text }]}>
                      {formatCurrency(nextSchedule.principal_due_amount)} đ
                    </CustomText>
                  </View>
                  <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.nextPaymentBreakdownItem}>
                    <CustomText style={[styles.breakdownLabel, { color: colors.icon }]}>
                      Lãi
                    </CustomText>
                    <CustomText style={[styles.breakdownValue, { color: colors.text }]}>
                      {formatCurrency(nextSchedule.interest_due_amount)} đ
                    </CustomText>
                  </View>
                </View>
              </View>

              {/* Ngày đến hạn */}
              <View style={styles.nextPaymentDateRow}>
                <View style={styles.nextPaymentDateItem}>
                  <FontAwesome6
                    name="calendar-days"
                    size={normalize(13)}
                    color={colors.icon}
                    style={{ marginRight: wp(2) }}
                  />
                  <View>
                    <CustomText style={[styles.nextDateLabel, { color: colors.icon }]}>
                      Hạn thanh toán
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
                      <FontAwesome6
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
                          ? `Quá hạn ${Math.abs(daysUntilDue)} ngày`
                          : `Còn ${daysUntilDue} ngày`}
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
                Thông tin khoản vay
              </CustomText>
            </View>
          </View>

          <View style={styles.infoContent}>
            {loan.contract_number ? (
              <InfoRow
                icon="file-contract"
                label="Mã hợp đồng"
                value={loan.contract_number}
              />
            ) : null}
            {loan.description ? (
              <InfoRow
                icon="file-lines"
                label="Mô tả"
                value={loan.description}
              />
            ) : null}
            {hasInterest ? (
              <>
                <InfoRow
                  icon="percent"
                  label="Lãi suất"
                  value={`${loan.interest_rate}%/năm`}
                  valueColor={accentColor}
                />
                <InfoRow
                  icon="calculator"
                  label="Phương thức tính lãi"
                  value={INTEREST_CALC_LABELS[loan.interest_calc_method] || loan.interest_calc_method}
                />
                <InfoRow
                  icon="money-bill-wave"
                  label="Tổng lãi dự kiến"
                  value={`${formatCurrency(totalInterest)} đ`}
                />
              </>
            ) : (
              <InfoRow
                icon="percent"
                label="Lãi suất"
                value="Không tính lãi"
              />
            )}
            <InfoRow
              icon="credit-card"
              label="Hình thức trả"
              value={
                isInstallment && loan.total_installments
                  ? `${PAYMENT_TYPE_LABELS[loan.payment_type]} (${loan.total_installments} kỳ)`
                  : PAYMENT_TYPE_LABELS[loan.payment_type] || loan.payment_type
              }
            />
            <InfoRow
              icon="calendar"
              label="Ngày bắt đầu"
              value={formatDate(loan.start_date)}
            />
            <InfoRow
              icon="calendar-check"
              label="Ngày đáo hạn"
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
                label="Ghi chú"
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
                  Lịch thanh toán
                </CustomText>
              </View>
              <TouchableOpacity
                style={[styles.viewAllButton, { backgroundColor: `${accentColor}15` }]}
                activeOpacity={0.7}
                onPress={handleViewSchedule}
              >
                <CustomText style={[styles.viewAllText, { color: accentColor }]}>
                  Xem tất cả
                </CustomText>
                <FontAwesome6
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
                        <FontAwesome6
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
                          Kỳ {schedule.installment_no}
                        </CustomText>
                        <View style={[styles.timelineStatusBadge, { backgroundColor: schedStatusCfg.bgColor }]}>
                          <CustomText style={[styles.timelineStatusText, { color: schedStatusCfg.color }]}>
                            {schedStatusCfg.label}
                          </CustomText>
                        </View>
                      </View>
                      <View style={styles.timelineRow}>
                        <CustomText style={[styles.timelineDate, { color: colors.icon }]}>
                          Hạn: {formatDate(schedule.due_date)}
                        </CustomText>
                        <CustomText style={[styles.timelineAmount, { color: colors.text }]}>
                          {formatCurrencyShort(totalDue)} đ
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
                  Xem tất cả {schedules.length} kỳ thanh toán
                </CustomText>
                <FontAwesome6
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
                Tổng kết
              </CustomText>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            {/* Gốc đã trả */}
            <View style={[styles.summaryGridItem, { backgroundColor: `${accentColor}08` }]}>
              <View style={[styles.summaryGridIcon, { backgroundColor: `${accentColor}15` }]}>
                <FontAwesome6 name="money-bill-1" size={normalize(14)} color={accentColor} />
              </View>
              <CustomText style={[styles.summaryGridLabel, { color: colors.icon }]}>
                Gốc đã trả
              </CustomText>
              <CustomText style={[styles.summaryGridValue, { color: colors.text }]}>
                {formatCurrencyShort(paidAmount)} đ
              </CustomText>
            </View>

            {/* Lãi dự kiến — chỉ hiển thị khi có lãi */}
            {hasInterest ? (
              <View style={[styles.summaryGridItem, { backgroundColor: `${accentColor}08` }]}>
                <View style={[styles.summaryGridIcon, { backgroundColor: `${accentColor}15` }]}>
                  <FontAwesome6 name="chart-line" size={normalize(14)} color={accentColor} />
                </View>
                <CustomText style={[styles.summaryGridLabel, { color: colors.icon }]}>
                  Tổng lãi dự kiến
                </CustomText>
                <CustomText style={[styles.summaryGridValue, { color: colors.text }]}>
                  {formatCurrencyShort(totalInterest)} đ
                </CustomText>
              </View>
            ) : (
              <View style={[styles.summaryGridItem, { backgroundColor: `${accentColor}08` }]}>
                <View style={[styles.summaryGridIcon, { backgroundColor: `${accentColor}15` }]}>
                  <FontAwesome6 name="percent" size={normalize(14)} color={accentColor} />
                </View>
                <CustomText style={[styles.summaryGridLabel, { color: colors.icon }]}>
                  Lãi suất
                </CustomText>
                <CustomText style={[styles.summaryGridValue, { color: colors.text }]}>
                  Không lãi
                </CustomText>
              </View>
            )}

            {/* Tổng phải trả */}
            <View style={[styles.summaryGridItem, { backgroundColor: `${accentColor}08` }]}>
              <View style={[styles.summaryGridIcon, { backgroundColor: `${accentColor}15` }]}>
                <FontAwesome6 name="coins" size={normalize(14)} color={accentColor} />
              </View>
              <CustomText style={[styles.summaryGridLabel, { color: colors.icon }]}>
                Tổng phải trả
              </CustomText>
              <CustomText style={[styles.summaryGridValue, { color: colors.text }]}>
                {formatCurrencyShort(loan.principal_amount + totalInterest)} đ
              </CustomText>
            </View>

            {/* Còn lại */}
            <View style={[styles.summaryGridItem, { backgroundColor: `${accentColor}08` }]}>
              <View style={[styles.summaryGridIcon, { backgroundColor: `${accentColor}15` }]}>
                <FontAwesome6 name="hourglass-half" size={normalize(14)} color={accentColor} />
              </View>
              <CustomText style={[styles.summaryGridLabel, { color: colors.icon }]}>
                Thời hạn còn lại
              </CustomText>
              <CustomText style={[styles.summaryGridValue, { color: colors.text }]}>
                {daysToMaturity > 0 ? `${daysToMaturity} ngày` : "Đã đáo hạn"}
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
