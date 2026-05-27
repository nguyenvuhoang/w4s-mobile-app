import { StyleSheet } from 'react-native';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';

export const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    headerSearchWrapper: {
      flex: 1,
      marginHorizontal: wp(2),
    },
    headerSearchInput: {
      fontSize: normalize(15),
      fontFamily: Fonts.regular,
      height: hp(5),
    },
    headerIconButton: {
      width: normalize(40),
      height: normalize(40),
      alignItems: 'center',
      justifyContent: 'center',
    },

    content: { flex: 1 },

    summaryCard: {
      marginHorizontal: wp(4),
      marginTop: hp(2),
      borderRadius: normalize(16),
      padding: normalize(14),
      flexDirection: 'row',
      borderWidth: 1,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryIconWrapper: {
      width: normalize(38),
      height: normalize(38),
      borderRadius: normalize(11),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(0.8),
    },
    summaryDivider: { width: 1, marginHorizontal: wp(1) },
    summaryLabel: {
      fontSize: normalize(11),
      fontFamily: Fonts.regular,
      marginBottom: hp(0.3),
      textAlign: 'center',
    },
    summaryAmount: { fontSize: normalize(13), fontFamily: Fonts.bold, textAlign: 'center' },

    filterSection: { paddingHorizontal: wp(4), paddingTop: hp(2.5) },
    filterSectionTitle: {
      fontSize: normalize(16),
      fontFamily: Fonts.semiBold,
      marginBottom: hp(1.5),
    },
    filterContainer: { flexDirection: 'row', gap: wp(2) },
    filterTab: {
      borderRadius: normalize(12),
      borderWidth: 1,
      overflow: 'hidden',
    },
    filterTabGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(1),
      gap: wp(1.5),
    },
    filterTabInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(1),
      gap: wp(1.5),
    },
    filterTabText: { fontSize: normalize(13), fontFamily: Fonts.medium },
    filterBadge: {
      paddingHorizontal: wp(1.5),
      paddingVertical: hp(0.1),
      borderRadius: normalize(20),
    },
    filterBadgeText: { fontSize: normalize(10), fontFamily: Fonts.semiBold },

    listContainer: { paddingHorizontal: wp(4), paddingTop: hp(2) },

    card: {
      backgroundColor: colors.card,
      borderRadius: normalize(16),
      padding: normalize(14),
      marginTop: hp(1.5),
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: hp(1.2) },
    avatar: {
      width: normalize(40),
      height: normalize(40),
      borderRadius: normalize(12),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3),
    },
    cardMeta: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginBottom: hp(0.3) },
    cardName: { fontSize: normalize(15), fontFamily: Fonts.semiBold, flex: 1 },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: normalize(6),
    },
    typeBadgeText: { fontSize: normalize(10), fontFamily: Fonts.semiBold },
    cardDesc: { fontSize: normalize(12), fontFamily: Fonts.regular },

    amountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: hp(1),
    },
    amountLabel: { fontSize: normalize(10), fontFamily: Fonts.regular, marginBottom: hp(0.2) },
    remainingAmount: { fontSize: normalize(18), fontFamily: Fonts.bold },
    principalAmount: { fontSize: normalize(13), fontFamily: Fonts.medium },

    progressTrack: {
      height: normalize(4),
      borderRadius: normalize(2),
      overflow: 'hidden',
      marginBottom: hp(0.5),
    },
    progressFill: { height: '100%', borderRadius: normalize(2) },
    progressLabel: { fontSize: normalize(11), fontFamily: Fonts.regular, marginBottom: hp(1) },

    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: hp(1),
    },
    footerLeft: { flexDirection: 'row', alignItems: 'center' },
    footerItem: { flexDirection: 'row', alignItems: 'center' },
    footerText: { fontSize: normalize(11), fontFamily: Fonts.regular },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.4),
      borderRadius: normalize(8),
    },
    statusText: { fontSize: normalize(10), fontFamily: Fonts.semiBold },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: hp(1.2),
      paddingVertical: hp(0.9),
      borderRadius: normalize(10),
    },
    actionBtnText: { fontSize: normalize(13), fontFamily: Fonts.semiBold },

    loadingContainer: {
      alignItems: 'center',
      paddingVertical: hp(8),
      gap: hp(1.5),
    },
    loadingText: { fontSize: normalize(14), fontFamily: Fonts.regular },

    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(8),
    },
    emptyIconBg: {
      width: normalize(100),
      height: normalize(100),
      borderRadius: normalize(30),
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(2),
    },
    emptyTitle: {
      fontSize: normalize(18),
      fontFamily: Fonts.semiBold,
      marginBottom: hp(0.5),
    },
    emptySubtitle: {
      fontSize: normalize(14),
      fontFamily: Fonts.regular,
      textAlign: 'center',
    },

    bottomContainer: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      paddingBottom: hp(3),
      borderTopWidth: 1,
    },
    createButton: {
      borderRadius: normalize(16),
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    gradientBg: {
      paddingVertical: hp(1.8),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    createButtonText: {
      fontSize: normalize(16),
      color: '#fff',
      fontFamily: Fonts.semiBold,
    },
  });
