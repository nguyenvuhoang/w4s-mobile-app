import { hp, normalize, wp } from "@/utils/layout";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: normalize(50) },

  // ── Balance Card ──
  balanceCard: {
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    paddingHorizontal: normalize(20),
    paddingTop: normalize(18),
    paddingBottom: normalize(22),
    borderRadius: normalize(20),
    overflow: "hidden",
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(14),
  },
  balanceIconCircle: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  innerGradientCircle: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  balanceAmount: {
    color: "#fff",
    letterSpacing: -0.5,
    textAlign: "right",
  },

  // ── Wallet Stacked Cards ──
  walletStackContainer: {
    marginHorizontal: wp(5),
    marginBottom: normalize(20),
    position: "relative",
  },
  walletStackCard: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: normalize(16),
    paddingHorizontal: normalize(16),
    paddingTop: normalize(18),
    paddingBottom: normalize(12),
    justifyContent: "space-between",
  },
  walletStackRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletStackIconWrap: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(10),
  },
  walletStackLabel: {
    color: "#fff",
    flex: 1,
  },
  walletStackCurrency: {
    color: "#fff",
    textAlign: "right",
  },
  walletStackBalance: {
    color: "#fff",
    textAlign: "right",
    marginTop: normalize(8),
  },

  sectionHeader: {
    paddingHorizontal: wp(5),
    marginBottom: normalize(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  chartCard: {
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    padding: normalize(16),
    borderRadius: normalize(16),
  },
  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(12),
  },
  legendDot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
    marginRight: normalize(8),
  },

  categoryList: {
    paddingHorizontal: wp(5),
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48.5%',
    padding: normalize(12),
    borderRadius: normalize(16),
    marginBottom: normalize(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    // Android Shadow
    elevation: 2,
    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryCardLeft: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardPct: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardRight: {
    flex: 1,
    justifyContent: 'center',
  },

  frequentList: { paddingHorizontal: wp(5), gap: normalize(12) },
  frequentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: normalize(12),
    borderRadius: normalize(12),
    gap: normalize(12),
  },
  frequentIcon: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
});
