import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import BottomActionModal, {
  ActionItem,
} from "@/components/modals/BottomActionModal";
import STORAGE_KEY from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useWalletTracker } from "@/features/wallet/hooks/useWalletTracker";
import StorageService from "@/services/StorageService";
import { WalletSummary } from "@/types/wallet";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface WalletListScreenProps {
  onSelectWallet?: (wallet: WalletSummary) => void;
}

const WalletListScreen: React.FC<WalletListScreenProps> = ({
  onSelectWallet,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  // ✅ Lấy mode từ route params
  const params = useLocalSearchParams();
  const mode = (params.mode as "select" | "manage" | "viewOnly") || "select";

  const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(
    null
  );
  const [showActionModal, setShowActionModal] = useState(false);
  const [transactionsToDelete, setTransactionsToDelete] = useState<any[] | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { showNotification } = useNotification();

  // ✅ GLOBAL WALLET
  const {
    wallets,
    loading,
    error,
    refresh,
    defaultWalletId,
    setDefaultWalletId,
  } = useWallet();

  // ✅ WALLET TRACKER (create / delete)
  const { deleteWalletTracker, deleting } = useWalletTracker();

  const handleSelectWallet = async (wallet: WalletSummary) => {
    if (mode === "viewOnly") return;

    if (mode === "select") {
      // Mode select: Lưu vào storage và quay lại
      try {
        console.log('[WalletList] Saving wallet to storage:', wallet.walletId);
        await StorageService.setAsyncItem(
          STORAGE_KEY.TEMP_WALLET_STORAGE,
          JSON.stringify({ walletId: wallet.walletId })
        );
        console.log('[WalletList] Wallet saved successfully');
        onSelectWallet?.(wallet);
        router.back();
      } catch (error) {
        console.error('[WalletList] Failed to save wallet:', error);
        showNotification(t("wallet.error_save"), "error");
      }
    } else {
      // Mode manage: mở modal options
      console.log("Selected wallet for management:", wallet);
      setSelectedWallet(wallet);
      setShowActionModal(true);
    }
  };

  const handleDeleteWallet = async () => {
    if (!selectedWallet) return;
    setShowActionModal(false);

    const response = await deleteWalletTracker(selectedWallet.walletId, false);

    if (response) {
      const data = response.data || (typeof response.getData === 'function' ? response.getData() : {}) || {};
      const transactions = Array.isArray(data) ? data : (data.wallet_transactions || data.transactions || data.list || data.transactions_list);

      if (transactions && Array.isArray(transactions) && transactions.length > 0) {
        setTransactionsToDelete(transactions);
        setShowConfirmModal(true);
      } else if (response.isSuccess && !response.isSuccess()) {
        showNotification(response.getError?.() || "Không thể xóa ví. Vui lòng thử lại.", "error");
      } else {
        handleDeleteSuccess();
      }
    } else {
      showNotification("Không thể xóa ví. Vui lòng thử lại.", "error");
    }
  };

  const confirmDeleteWallet = async () => {
    if (!selectedWallet) return;
    setShowConfirmModal(false);

    const response = await deleteWalletTracker(selectedWallet.walletId, true);
    if (response && response.isSuccess && response.isSuccess()) {
      handleDeleteSuccess();
    } else {
      showNotification(response?.getError?.() || "Không thể xóa ví. Vui lòng thử lại.", "error");
    }
  };

  const handleDeleteSuccess = async () => {
    await refresh();
    showNotification("Đã xóa ví thành công!", "success");
    if (selectedWallet && defaultWalletId === selectedWallet.walletId) {
      setDefaultWalletId(null);
    }
    setTransactionsToDelete(null);
  };

  const handleEditWallet = () => {
    setShowActionModal(false);
    // TODO: Navigate to edit screen with selectedWallet
    setTimeout(() => {
      showNotification("Chức năng chỉnh sửa đang được phát triển", "warning");
    }, 300);
  };

  const handleTransferMoney = () => {
    setShowActionModal(false);
    // TODO: Navigate to transfer screen with selectedWallet
    setTimeout(() => {
      showNotification("Chức năng chuyển tiền đang được phát triển", "warning");
    }, 300);
  };

  const handleSetDefault = () => {
    if (!selectedWallet) return;
    setDefaultWalletId(selectedWallet.walletId);
    setShowActionModal(false);
  };

  const handleCreateWallet = () => {
    router.push("/(protected)/wallet/select-wallet-type");
  };

  // ✅ Dynamic actions based on selected wallet
  const walletActions: ActionItem[] = useMemo(
    () => [
      {
        id: "set-default",
        icon: "star-outline",
        label: t("wallet.set_default"),
        onPress: handleSetDefault,
        hide: selectedWallet?.walletId === defaultWalletId, // Ẩn nếu đã là default
      },
      {
        id: "edit",
        icon: "create-outline",
        label: t("wallet.edit"),
        onPress: handleEditWallet,
      },
      {
        id: "transfer",
        icon: "swap-horizontal-outline",
        label: t("wallet.transfer"),
        onPress: handleTransferMoney,
      },
      {
        id: "delete",
        icon: "trash-outline",
        label: t("wallet.delete_wallet"),
        onPress: handleDeleteWallet,
        destructive: true,
      },
    ],
    [selectedWallet, defaultWalletId]
  );

  /* -------------------- UI STATES -------------------- */

  if (loading || deleting) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title={t("wallet.my_wallets")} showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText style={{ marginTop: normalize(12) }} type="regular">
            {t("common.loading_data")}
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title={t("wallet.my_wallets")} showBackButton />
        <View style={styles.centerContainer}>
          <CustomText
            style={{ textAlign: "center", marginBottom: normalize(16) }}
            type="regular"
          >
            {error}
          </CustomText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={refresh}
          >
            <CustomText style={{ color: "#fff" }} type="semiBold">
              {t("common.retry")}
            </CustomText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader
        title={
          mode === "select"
            ? t("wallet.select_source")
            : mode === "manage"
              ? t("wallet.manage_wallets")
              : t("wallet.my_wallets")
        }
        showBackButton
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <CustomText
          style={[styles.sectionTitle, { color: colors.text }]}
          type="semiBold"
        >
          {t("wallet.my_wallets")}
        </CustomText>

        {wallets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CustomText style={{ color: colors.icon }} type="regular">
              {t("wallet.no_wallets")}
            </CustomText>
          </View>
        ) : (
          <View style={styles.walletList}>
            {wallets.map((wallet) => (
              <WalletItem
                key={wallet.walletId}
                wallet={wallet}
                isDefault={wallet.walletId === defaultWalletId}
                colors={colors}
                mode={mode}
                onPress={() => handleSelectWallet(wallet)}
              />
            ))}
          </View>
        )}

        <View style={{ height: hp(10) }} />
      </ScrollView>

      <View
        style={[styles.bottomButton, { backgroundColor: colors.background }]}
      >
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={handleCreateWallet}
        >
          <Ionicons name="add" size={normalize(24)} color="#fff" />
          <CustomText style={styles.addButtonText} type="semiBold">
            {t("wallet.add_new_wallet")}
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* -------------------- ACTION MODAL -------------------- */}
      <BottomActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={selectedWallet?.name}
        subtitle={getWalletTypeLabel(selectedWallet?.type || "")}
        actions={walletActions}
        colors={colors}
        cancelText={t("common.cancel")}
      />

      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <CustomText type="semiBold" style={[styles.modalTitle, { color: colors.text }]}>
              Xác nhận xóa ví
            </CustomText>
            <CustomText style={[styles.modalDesc, { color: colors.text }]}>
              Ví này đang có {transactionsToDelete?.length} giao dịch. Xóa ví sẽ xóa luôn các giao dịch này. Bạn có chắc chắn muốn xóa?
            </CustomText>
            <ScrollView style={styles.transactionsScrollView}>
              {transactionsToDelete?.map((tx, idx) => {
                const title = tx.transactionname || tx.trandesc || tx.title || tx.transaction_name || tx.description || 'Giao dịch';
                const amount = tx.nu_m01 || tx.amount || 0;
                return (
                  <View key={idx} style={[styles.transactionItemPreview, { borderBottomColor: colors.border }]}>
                    <CustomText style={{ color: colors.text }} numberOfLines={1}>
                      {title} • {amount.toLocaleString('vi-VN')}
                    </CustomText>
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={styles.modalCancelBtn}>
                <CustomText style={{ color: colors.icon }}>Hủy</CustomText>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteWallet} style={[styles.modalConfirmBtn, { backgroundColor: '#FF3B30' }]}>
                <CustomText style={{ color: '#fff' }} type="semiBold">Xóa ví</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* -------------------- HELPER -------------------- */

const getWalletTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    cash: "Tiền mặt",
    bank: "Ngân hàng",
    credit_card: "Thẻ tín dụng",
    e_wallet: "Ví điện tử",
    investment: "Đầu tư",
    other: "Khác",
  };
  return typeMap[type] || type;
};

/* -------------------- WALLET ITEM -------------------- */

interface WalletItemProps {
  wallet: WalletSummary;
  isDefault: boolean;
  colors: any;
  mode: "select" | "manage" | "viewOnly";
  onPress: () => void;
}

const WalletItem: React.FC<WalletItemProps> = ({
  wallet,
  isDefault,
  colors,
  mode,
  onPress,
}) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.walletItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={mode === "viewOnly"}
    >
      <View style={styles.walletLeft}>
        <View style={[styles.walletIcon, { backgroundColor: wallet.color }]}>
          <FontAwesome6
            name={wallet.icon as any}
            size={normalize(24)}
            color="#fff"
          />
        </View>

        <View style={styles.walletInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <CustomText
              style={[styles.walletName, { color: colors.text }]}
              type="semiBold"
            >
              {wallet.name}
            </CustomText>

            {isDefault && (
              <View
                style={[styles.defaultTag, { backgroundColor: colors.tint }]}
              >
                <CustomText style={styles.defaultTagText} type="semiBold">
                  {t("wallet.default")}
                </CustomText>
              </View>
            )}
          </View>

          <CustomText
            style={[styles.walletType, { color: colors.icon }]}
            type="regular"
          >
            {getWalletTypeLabel(wallet.type)} •{" "}
            {wallet.balance.toLocaleString("vi-VN")} {wallet.currency}
          </CustomText>
        </View>
      </View>

      {mode === "manage" && (
        <View style={styles.optionsButton}>
          <Ionicons
            name="chevron-forward"
            size={normalize(20)}
            color={colors.icon}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
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
    borderRadius: normalize(16),
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
    paddingVertical: normalize(10),
    borderBottomWidth: 1,
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
});

export default WalletListScreen;