import { StyleSheet } from "react-native";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";

export const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      flexGrow: 1,
    },
    listContainer: {
      paddingHorizontal: wp(4),
      paddingTop: hp(2),
      gap: hp(1.5),
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: normalize(16),
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    accentBar: {
      width: normalize(4),
      alignSelf: "stretch",
    },
    iconWrapper: {
      width: normalize(46),
      height: normalize(46),
      borderRadius: normalize(12),
      alignItems: "center",
      justifyContent: "center",
      marginLeft: wp(3),
      marginVertical: normalize(14),
    },
    infoBlock: {
      flex: 1,
      marginLeft: wp(3),
      paddingVertical: normalize(14),
      gap: hp(0.4),
    },
    billName: {
      fontSize: normalize(14),
      color: colors.text,
      fontFamily: Fonts.semiBold,
    },
    recurringChip: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: normalize(20),
      gap: wp(1),
      marginTop: hp(0.3),
    },
    recurringLabel: {
      fontSize: normalize(10),
      fontFamily: Fonts.semiBold,
    },
    dayPillRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: wp(1),
      marginTop: hp(0.4),
    },
    dayPill: {
      paddingHorizontal: wp(1.5),
      paddingVertical: hp(0.15),
      borderRadius: normalize(4),
      borderWidth: 1,
    },
    dayPillText: {
      fontSize: normalize(9),
      fontFamily: Fonts.semiBold,
    },
    rightBlock: {
      alignItems: "flex-end",
      paddingRight: wp(4),
      paddingVertical: normalize(14),
      gap: hp(0.3),
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(1.5),
    },
    amountText: {
      fontSize: normalize(15),
      fontFamily: Fonts.bold,
    },
    currencyBadge: {
      paddingHorizontal: wp(1.5),
      paddingVertical: hp(0.2),
      borderRadius: normalize(4),
    },
    currencyCode: {
      fontSize: normalize(10),
      fontFamily: Fonts.semiBold,
    },
    dueDateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(1),
      marginTop: hp(0.3),
    },
    dueDateText: {
      fontSize: normalize(10),
      color: colors.icon,
      fontFamily: Fonts.regular,
    },
    bottomContainer: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    createButton: {
      paddingVertical: hp(1.8),
      borderRadius: normalize(25),
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: wp(2),
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    createButtonText: {
      fontSize: normalize(16),
      color: "#fff",
      fontFamily: Fonts.semiBold,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: hp(15),
    },
    emptyText: {
      fontSize: normalize(15),
      color: colors.icon,
      fontFamily: Fonts.regular,
      marginTop: hp(2),
    },
  });
