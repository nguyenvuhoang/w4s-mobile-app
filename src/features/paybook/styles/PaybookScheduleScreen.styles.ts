import { StyleSheet } from 'react-native';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';

export const createStyles = (colors: any) =>
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
