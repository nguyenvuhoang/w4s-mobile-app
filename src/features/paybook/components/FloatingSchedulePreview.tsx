/**
 * FloatingSchedulePreview
 * ─────────────────────────────────────────────────────────────────────────
 * Shared component dùng chung cho CreatePaybookScreen.
 * Render bảng preview lịch lãi suất khi chọn chế độ lãi thả nổi.
 *
 * Props:
 *   floatingRates   – danh sách giai đoạn lãi (from_installment, rate)
 *   totalInstallments – tổng số kỳ
 *   principalAmount   – số tiền gốc
 *   interestCalcMethod – REDUCING | FLAT
 *   periodUnit        – đơn vị kỳ (DAY | WEEK | MONTH | QUARTER | YEAR)
 *   colors            – theme colors
 *   accentColor       – tint color
 */

import CustomText from "@/components/base/CustomText";
import { Fonts } from "@/core/theme/font";
import type { FloatingRatePeriod, InterestCalcMethod, PeriodUnit } from "@/services/repositories/paybook.repository";
import { FontAwesome6 } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { hp, normalize, wp } from "@/utils/layout";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleRow {
  installment: number;
  annualRate: number;
  principalDue: number;
  interest: number;
  balance: number;
}

interface Props {
  floatingRates: FloatingRatePeriod[];
  totalInstallments: number;
  principalAmount: number;
  interestCalcMethod: InterestCalcMethod;
  periodUnit: PeriodUnit;
  colors: any;
  accentColor: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIOD_MONTHS: Record<PeriodUnit, number> = {
  DAY: 1 / 30,
  WEEK: 7 / 30,
  MONTH: 1,
  QUARTER: 3,
  YEAR: 12,
};

const PERIOD_LABEL: Record<PeriodUnit, string> = {
  DAY: "ngày",
  WEEK: "tuần",
  MONTH: "tháng",
  QUARTER: "quý",
  YEAR: "năm",
};

const fmt = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

function getRateForInstallment(
  installment: number,
  floatingRates: FloatingRatePeriod[]
): number {
  let rate = floatingRates[0]?.rate ?? 0;
  for (const fr of floatingRates) {
    if (installment >= fr.from_installment) rate = fr.rate;
    else break;
  }
  return rate;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: normalize(14),
    overflow: "hidden",
    marginTop: hp(1.2),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.2),
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: normalize(13),
    fontFamily: Fonts.semiBold,
  },
  totalInterest: {
    fontSize: normalize(12),
    fontFamily: Fonts.semiBold,
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.8),
  },
  th: {
    fontSize: normalize(11),
    fontFamily: Fonts.medium,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  td: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(1.5),
    paddingVertical: hp(1.2),
    borderTopWidth: 1,
  },
  expandLabel: {
    fontSize: normalize(12),
    fontFamily: Fonts.semiBold,
  },
  hint: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    paddingHorizontal: wp(3.5),
    paddingBottom: hp(1),
    paddingTop: hp(0.5),
    fontStyle: "italic",
  },
});

// ─── Row renderer ─────────────────────────────────────────────────────────────

function renderRow(
  row: ScheduleRow,
  idx: number,
  isRateChange: boolean,
  colors: any,
  accentColor: string
) {
  return (
    <View
      key={row.installment}
      style={[
        s.row,
        { borderBottomColor: colors.border },
        isRateChange && { backgroundColor: `${accentColor}08` },
      ]}
    >
      <CustomText style={[s.td, { color: colors.text, width: normalize(36) }]}>
        {row.installment}
      </CustomText>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: wp(0.5) }}>
        {isRateChange && (
          <FontAwesome6 name="rotate" size={normalize(9)} color={accentColor} solid />
        )}
        <CustomText
          style={[
            s.td,
            {
              color: isRateChange ? accentColor : colors.text,
              fontFamily: isRateChange ? Fonts.semiBold : Fonts.regular,
            },
          ]}
        >
          {row.annualRate}%
        </CustomText>
      </View>
      <CustomText
        style={[s.td, { color: colors.icon, flex: 1.4, textAlign: "right" }]}
        numberOfLines={1}
      >
        {fmt(row.principalDue)}
      </CustomText>
      <CustomText
        style={[s.td, { color: accentColor, flex: 1.4, textAlign: "right" }]}
        numberOfLines={1}
      >
        {fmt(row.interest)}
      </CustomText>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FloatingSchedulePreview: React.FC<Props> = ({
  floatingRates,
  totalInstallments,
  principalAmount,
  interestCalcMethod,
  periodUnit,
  colors,
  accentColor,
}) => {
  const [expanded, setExpanded] = useState(false);

  const schedule = useMemo<ScheduleRow[]>(() => {
    if (totalInstallments <= 0 || principalAmount <= 0) return [];
    const monthsPerPeriod = PERIOD_MONTHS[periodUnit] ?? 1;
    const basePrincipalDue = Math.round(principalAmount / totalInstallments);
    const rows: ScheduleRow[] = [];
    let balance = principalAmount;

    for (let i = 1; i <= totalInstallments; i++) {
      const annualRate = getRateForInstallment(i, floatingRates);
      const periodicRate = (annualRate / 100 / 12) * monthsPerPeriod;
      const currentPrincipalDue = i === totalInstallments ? balance : basePrincipalDue;

      const interest =
        interestCalcMethod === "FLAT"
          ? (principalAmount * periodicRate)
          : (balance * periodicRate);

      rows.push({
        installment: i,
        annualRate,
        principalDue: currentPrincipalDue,
        interest,
        balance: Math.max(balance - currentPrincipalDue, 0),
      });
      balance = Math.max(balance - currentPrincipalDue, 0);
    }
    return rows;
  }, [floatingRates, totalInstallments, principalAmount, interestCalcMethod, periodUnit]);

  if (schedule.length === 0) return null;

  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
  // Collapsed: show first 5 rows; Expanded: scrollable with maxHeight
  const COLLAPSED_COUNT = 5;
  const needsExpand = schedule.length > COLLAPSED_COUNT;
  const collapsedRows = schedule.slice(0, COLLAPSED_COUNT);

  return (
    <View style={[s.container, { backgroundColor: colors.card, borderColor: `${accentColor}40` }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <FontAwesome6 name="table-list" size={normalize(13)} color={accentColor} solid style={{ marginRight: wp(1.5) }} />
        <CustomText style={[s.headerTitle, { color: colors.text }]}>
          Xem trước lịch lãi
        </CustomText>
        <CustomText style={[s.totalInterest, { color: accentColor }]}>
          Tổng lãi ≈ {fmt(totalInterest)} đ
        </CustomText>
      </View>

      {/* Table header */}
      <View style={[s.tableHeader, { backgroundColor: `${accentColor}10` }]}>
        <CustomText style={[s.th, { color: colors.icon, width: normalize(36) }]}>Kỳ</CustomText>
        <CustomText style={[s.th, { color: colors.icon, flex: 1 }]}>Lãi suất</CustomText>
        <CustomText style={[s.th, { color: colors.icon, flex: 1.4, textAlign: "right" }]}>Gốc/kỳ</CustomText>
        <CustomText style={[s.th, { color: colors.icon, flex: 1.4, textAlign: "right" }]}>Tiền lãi</CustomText>
      </View>

      {/* Rows — collapsed (5 rows) or expanded (all rows, parent ScrollView handles scroll) */}
      <View>
        {(expanded ? schedule : collapsedRows).map((row, idx, arr) =>
          renderRow(
            row,
            idx,
            idx > 0 && row.annualRate !== arr[idx - 1].annualRate,
            colors,
            accentColor
          )
        )}
      </View>

      {/* Expand / Collapse button */}
      {needsExpand && (
        <TouchableOpacity
          style={[s.expandBtn, { borderTopColor: colors.border }]}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <CustomText style={[s.expandLabel, { color: accentColor }]}>
            {expanded ? "Thu gọn" : `Xem thêm ${schedule.length - COLLAPSED_COUNT} kỳ nữa`}
          </CustomText>
          <FontAwesome6
            name={expanded ? "chevron-up" : "chevron-down"}
            size={normalize(11)}
            color={accentColor}
          />
        </TouchableOpacity>
      )}

      {/* Footer hint */}
      <CustomText style={[s.hint, { color: colors.icon }]}>
        * Số tiền lãi tính theo {PERIOD_LABEL[periodUnit]} — mang tính tham khảo
      </CustomText>
    </View>
  );
};

export default FloatingSchedulePreview;
