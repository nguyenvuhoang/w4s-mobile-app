import { hp, normalize, wp } from "@/utils/layout";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: normalize(50),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(5),
    paddingVertical: normalize(16),
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  avatar: {
    width: normalize(50),
    height: normalize(50),
    borderRadius: normalize(25),
  },
  greeting: {
    fontSize: normalize(18),
    fontWeight: "600",
  },
  date: {
    fontSize: normalize(12),
    marginTop: normalize(2),
  },
  balanceCard: {
    borderRadius: normalize(24),
    paddingTop: normalize(20),
    paddingBottom: normalize(24),
    paddingHorizontal: normalize(24),
    marginHorizontal: wp(5),
    marginBottom: hp(2.5),
    alignItems: "center",
    overflow: "hidden",
  },
  /* Top-left concentric circles */
  balanceDecorOuterTL: {
    position: "absolute",
    width: normalize(140),
    height: normalize(140),
    borderRadius: normalize(70),
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    top: normalize(-45),
    left: normalize(-45),
  },
  balanceDecorInnerTL: {
    position: "absolute",
    width: normalize(90),
    height: normalize(90),
    borderRadius: normalize(45),
    backgroundColor: "rgba(255,255,255,0.10)",
    top: normalize(-20),
    left: normalize(-20),
  },
  /* Bottom-right concentric circles */
  balanceDecorOuterBR: {
    position: "absolute",
    width: normalize(120),
    height: normalize(120),
    borderRadius: normalize(60),
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    bottom: normalize(-40),
    right: normalize(-40),
  },
  balanceDecorInnerBR: {
    position: "absolute",
    width: normalize(75),
    height: normalize(75),
    borderRadius: normalize(37.5),
    backgroundColor: "rgba(255,255,255,0.10)",
    bottom: normalize(-15),
    right: normalize(-15),
  },
  balanceLabelPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: normalize(20),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(5),
    marginBottom: normalize(12),
  },
  balanceLabel: {
    fontSize: normalize(13),
    color: "#fff",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  balanceAmount: {
    fontSize: normalize(34),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: normalize(20),
    letterSpacing: -0.5,
  },
  balanceDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: normalize(4),
  },
  balanceItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: normalize(36),
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  balanceSubLabel: {
    fontSize: normalize(12),
    color: "rgba(255,255,255,0.75)",
    marginBottom: normalize(4),
  },
  incomeAmount: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: "#fff",
  },
  expenseAmount: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: "#fff",
  },
  month: {
    fontSize: normalize(12),
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: normalize(12),
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: wp(5),
    marginBottom: hp(3),
  },
  actionButton: {
    alignItems: "center",
    gap: normalize(8),
  },
  actionIcon: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(16),
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: normalize(12),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(5),
    marginBottom: normalize(16),
  },
  sectionTitle: {
    fontSize: normalize(18),
    fontWeight: "600",
  },
  seeMore: {
    fontSize: normalize(14),
  },
  categoryList: {
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },
  categoryItem: {
    borderRadius: normalize(16),
    padding: normalize(16),
    position: "relative",
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    marginBottom: normalize(8),
  },
  categoryIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: normalize(16),
    fontWeight: "600",
  },
  categoryTransactions: {
    fontSize: normalize(12),
    marginTop: normalize(2),
  },
  categoryAmount: {
    position: "absolute",
    right: normalize(16),
    top: normalize(24),
    fontSize: normalize(16),
    fontWeight: "600",
  },
  progressBarContainer: {
    height: normalize(6),
    borderRadius: normalize(3),
    overflow: "hidden",
    marginTop: normalize(8),
  },
  progressBar: {
    height: "100%",
    borderRadius: normalize(3),
  },
  transactionList: {
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },
  transactionItem: {
    borderRadius: normalize(16),
    padding: normalize(16),
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  transactionIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: normalize(16),
    fontWeight: "600",
  },
  transactionTime: {
    fontSize: normalize(12),
    marginTop: normalize(2),
  },
  transactionAmount: {
    fontSize: normalize(16),
    fontWeight: "600",
  },
  expenseText: {
    color: "#FF3B30",
  },
  incomeText: {
    color: "#34C759",
  },
  changePercent: {
    fontSize: normalize(12),
    marginTop: normalize(2),
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "rgba(0,0,0,0.05)",
    // backgroundColor: "#fff",
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    borderRadius: normalize(12),
    marginRight: normalize(12),
    gap: normalize(8),
  },
  searchPlaceholder: {
    fontSize: normalize(14),
    opacity: 1,
  },
});
