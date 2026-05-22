import { StyleSheet } from "react-native";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";

export const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Tabs
    tabs: {
      flexDirection: "row",
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      gap: wp(3),
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: wp(1.5),
      paddingVertical: hp(1.2),
      borderRadius: normalize(25),
      backgroundColor: colors.card,
      overflow: "hidden", // Ensure gradient doesn't bleed out
    },
    tabText: { fontSize: normalize(13), color: colors.text, fontFamily: Fonts.regular },
    tabTextActive: { color: "#fff", fontFamily: Fonts.semiBold },
    badge: {
      borderRadius: normalize(10),
      paddingHorizontal: wp(1.5),
      minWidth: normalize(18),
      alignItems: "center",
    },
    badgeText: { fontSize: normalize(10), color: "#fff", fontFamily: Fonts.bold },

    // List
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: wp(4), paddingTop: hp(2), gap: hp(1.5), flexGrow: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: hp(15) },
    emptyText: { fontSize: normalize(14), fontFamily: Fonts.regular, marginTop: hp(2), textAlign: "center" },

    // Card
    card: {
      backgroundColor: colors.card,
      borderRadius: normalize(16),
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    accentBar: { width: normalize(4), alignSelf: "stretch" },
    iconWrap: {
      width: normalize(44),
      height: normalize(44),
      borderRadius: normalize(12),
      alignItems: "center",
      justifyContent: "center",
      marginLeft: wp(3),
      marginVertical: normalize(14),
    },
    info: {
      flex: 1,
      marginLeft: wp(3),
      paddingVertical: normalize(12),
      gap: hp(0.5),
    },
    billTitle: { fontSize: normalize(14), color: colors.text, fontFamily: Fonts.semiBold },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: normalize(20),
      gap: wp(1),
    },
    chipText: { fontSize: normalize(10), fontFamily: Fonts.semiBold },
    right: {
      alignItems: "flex-end",
      paddingRight: wp(3),
      paddingVertical: normalize(12),
      gap: hp(0.4),
    },
    amountRow: { flexDirection: "row", alignItems: "center", gap: wp(1.5) },
    amount: { fontSize: normalize(14), fontFamily: Fonts.bold, color: "#EF4444" },
    ccyBadge: { backgroundColor: "#EF444418", paddingHorizontal: wp(1.5), paddingVertical: hp(0.2), borderRadius: normalize(4) },
    ccyText: { fontSize: normalize(10), fontFamily: Fonts.semiBold, color: "#EF4444" },
    dateRow: { flexDirection: "row", alignItems: "center", gap: wp(1) },
    dateText: { fontSize: normalize(10), color: colors.icon, fontFamily: Fonts.regular },
    payBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(1),
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.55),
      borderRadius: normalize(20),
      marginTop: hp(0.3),
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    payBtnText: { fontSize: normalize(10), color: "#fff", fontFamily: Fonts.semiBold },

    // Bottom bar
    bottomBar: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    fab: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: wp(2),
      paddingVertical: hp(1.8),
      borderRadius: normalize(25),
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    fabText: { fontSize: normalize(16), color: "#fff", fontFamily: Fonts.semiBold },

    // Pay modal
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: normalize(24),
      borderTopRightRadius: normalize(24),
      paddingTop: hp(1.5),
      paddingBottom: hp(4),
      paddingHorizontal: wp(5),
    },
    handle: {
      width: normalize(40),
      height: normalize(4),
      borderRadius: normalize(2),
      alignSelf: "center",
      marginBottom: hp(2),
    },
    sheetTitle: {
      fontSize: normalize(17),
      fontFamily: Fonts.bold,
      textAlign: "center",
      marginBottom: hp(2),
    },

    // Bill summary inside modal
    billCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(3),
      borderRadius: normalize(14),
      padding: normalize(14),
      marginBottom: hp(2.5),
    },
    billCardIcon: {
      width: normalize(44),
      height: normalize(44),
      borderRadius: normalize(12),
      alignItems: "center",
      justifyContent: "center",
    },
    billCardTitle: { fontSize: normalize(14), fontFamily: Fonts.semiBold, marginBottom: hp(0.3) },
    billCardSub: { fontSize: normalize(11), fontFamily: Fonts.regular },
    billCardAmount: { fontSize: normalize(16), fontFamily: Fonts.bold },
    billCardCcy: { fontSize: normalize(11), fontFamily: Fonts.regular, marginTop: hp(0.2) },

    sectionLabel: {
      fontSize: normalize(11),
      fontFamily: Fonts.semiBold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: hp(1),
    },

    // Wallet list
    walletRow: { gap: wp(2.5), paddingVertical: hp(0.5), paddingHorizontal: 2 },
    walletChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(2),
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(1.3),
      borderRadius: normalize(14),
      borderWidth: 1.5,
      minWidth: wp(44),
      marginBottom: hp(2),
    },
    walletDot: { width: normalize(10), height: normalize(10), borderRadius: normalize(5) },
    walletName: { fontSize: normalize(13), fontFamily: Fonts.semiBold },
    walletBalance: { fontSize: normalize(11), fontFamily: Fonts.regular, marginTop: hp(0.2) },

    // Confirm / cancel
    confirmBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: wp(2),
      paddingVertical: hp(1.8),
      borderRadius: normalize(25),
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      marginBottom: hp(0.5),
    },
    confirmText: { fontSize: normalize(16), color: "#fff", fontFamily: Fonts.semiBold },
    cancelBtn: { alignItems: "center", paddingVertical: hp(1.2) },
    cancelText: { fontSize: normalize(15), fontFamily: Fonts.regular },
  });
