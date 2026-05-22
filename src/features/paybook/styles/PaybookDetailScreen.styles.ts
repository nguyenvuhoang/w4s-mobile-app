import { StyleSheet } from 'react-native';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';

export const createStyles = (colors: any) =>
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
