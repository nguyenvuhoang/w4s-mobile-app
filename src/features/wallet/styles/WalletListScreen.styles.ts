import { hp, normalize, wp } from "@/utils/layout";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  sectionTitle: {
    fontSize: normalize(16),
    paddingHorizontal: wp(5),
    marginTop: hp(2),
    marginBottom: hp(1.5),
  },
  walletList: {
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },
  walletItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: normalize(16),
    borderRadius: normalize(16),
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    flex: 1,
  },
  walletIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    justifyContent: "center",
    alignItems: "center",
  },
  walletInfo: { flex: 1 },
  walletName: { fontSize: normalize(16) },
  walletType: {
    fontSize: normalize(13),
    marginTop: normalize(4),
  },
  optionsButton: { padding: normalize(8) },

  // 🔹 DEFAULT TAG
  defaultTag: {
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(2),
    borderRadius: normalize(6),
  },
  defaultTagText: {
    fontSize: normalize(10),
    color: "#fff",
  },

  bottomButton: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  addButton: {
    flexDirection: "row",
    gap: normalize(8),
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: normalize(16),
    borderRadius: normalize(30),
  },
  addButtonText: {
    fontSize: normalize(16),
    color: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(10),
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: hp(6),
  },
  retryButton: {
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: wp(5),
  },
  modalContent: {
    borderRadius: normalize(16),
    padding: normalize(20),
    maxHeight: hp(70),
  },
  modalTitle: {
    fontSize: normalize(18),
    marginBottom: normalize(10),
  },
  modalDesc: {
    fontSize: normalize(14),
    marginBottom: normalize(16),
  },
  transactionsScrollView: {
    maxHeight: hp(40),
    marginBottom: normalize(20),
  },
  transactionItemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(12),
    borderBottomWidth: 1,
    gap: normalize(12),
  },
  transactionPreviewIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionPreviewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionPreviewAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: normalize(12),
  },
  modalCancelBtn: {
    padding: normalize(12),
  },
  modalConfirmBtn: {
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(8),
  },
  walletCardWrap: {
    width: "100%",
  },

  walletCard: {
    borderRadius: normalize(18),
    paddingHorizontal: normalize(18),
    paddingVertical: normalize(18),
    minHeight: normalize(110),
    justifyContent: "space-between",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  leftTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
  },

  typeText: {
    color: "#fff",
    fontSize: normalize(14),
  },

  nameText: {
    color: "#fff",
    fontSize: normalize(15),
    maxWidth: "45%",
    textAlign: "right",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  balanceText: {
    color: "#fff",
    fontSize: normalize(18),
  },

  primaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(6),
    gap: normalize(4),
  },

  primaryText: {
    color: "#E53935",
    fontSize: normalize(12),
  },
});
