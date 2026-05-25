import AppHeader from "@/components/base/AppHeader";
import CustomButton from "@/components/base/CustomButton";
import CustomText from "@/components/base/CustomText";
import BottomActionModal, {
  ActionItem,
} from "@/components/modals/BottomActionModal";
import STORAGE_KEY from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useWalletTracker } from "@/features/wallet/hooks/useWalletTracker";
import { useCategory } from "@/hooks/useCategory";
import StorageService from "@/services/StorageService";
import { WalletSummary } from "@/types/wallet";
import { lightenColor } from "@/utils/colorsHepper";
import { hp, normalize } from "@/utils/layout";
import AppIcon from "@/components/base/AppIcon";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { t } from "i18next";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/WalletListScreen.styles";

interface WalletListScreenProps {
  onSelectWallet?: (wallet: WalletSummary) => void;
}

const WalletListScreen: React.FC<WalletListScreenProps> = ({
  onSelectWallet,
}) => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();

  // ✅ Lấy mode từ route params
  const params = useLocalSearchParams();
  const mode = (params.mode as "select" | "manage" | "viewOnly") || "select";
  const allowAllWallets = params.allowAllWallets === "true";

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
    setPrimaryWallet,
  } = useWallet();

  // ✅ WALLET TRACKER (create / delete)
  const { deleteWalletTracker, deleting } = useWalletTracker();

  // ✅ CATEGORY
  const { categories } = useCategory();

  const handleSelectWallet = async (wallet: WalletSummary) => {
    if (mode === "viewOnly") return;

    if (mode === "select") {
      // Mode select: Lưu vào storage và quay lại
      try {
        console.log('[WalletList] Saving wallet to storage:', wallet.walletId);
        await StorageService.setItem(
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
    if (!selectedWallet) return;
    setShowActionModal(false);
    setTimeout(() => {
      router.push({
        pathname: '/(protected)/wallet/tracker/edit-basic',
        params: {
          wallet_id: String(selectedWallet.walletId),
          wallet_name: selectedWallet.name,
          wallet_type: selectedWallet.type,
          default_currency: selectedWallet.currency,
          wallet_balance: String(selectedWallet.balance),
          is_primary: String(selectedWallet.walletId === defaultWalletId),
          status: selectedWallet.status ?? 'A',
          icon: selectedWallet.icon ?? 'wallet',
          color: selectedWallet.color ?? '#3B82F6',
          currency_symbol: selectedWallet.currency === 'VND' ? 'đ' : selectedWallet.currency,
          currency_name: selectedWallet.currency,
        },
      });
    }, 300);
  };

  const handleTransferMoney = () => {
    setShowActionModal(false);
    // TODO: Navigate to transfer screen with selectedWallet
    setTimeout(() => {
      showNotification("Chức năng chuyển tiền đang được phát triển", "warning");
    }, 300);
  };

  const handleSetDefault = async () => {
    if (!selectedWallet) return;
    try {
      await setPrimaryWallet(selectedWallet.walletId);
      setShowActionModal(false);
      showNotification(t("wallet.set_primary_success") || "Đặt ví mặc định thành công", "success");
    } catch (error) {
      showNotification(t("wallet.set_primary_error") || "Lỗi khi đặt ví mặc định", "error");
    }
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
          <CustomButton
            title={t("common.retry")}
            onPress={refresh}
            useGradient
            style={styles.retryButton}
          />
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
            {allowAllWallets && mode === "select" && (
              <WalletItem
                wallet={
                  {
                    walletId: 0,
                    name: "Tất cả các ví",
                    type: "all_wallets",
                    balance: wallets.reduce((sum, w) => sum + w.balance, 0),
                    currency: "VNĐ",
                    icon: "layer-group",
                    color: colors.tint,
                  } as unknown as WalletSummary
                }
                isDefault={false}
                colors={colors}
                mode={mode}
                onPress={() =>
                  handleSelectWallet({
                    walletId: 0,
                    name: "Tất cả các ví",
                    type: "all_wallets",
                    balance: 0, // Not really used when selecting
                    currency: "VNĐ",
                    icon: "layer-group",
                    color: colors.tint,
                  } as unknown as WalletSummary)
                }
              />
            )}
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
        <CustomButton
          title={t("wallet.add_new_wallet")}
          onPress={handleCreateWallet}
          useGradient
          showIcon
          iconName="plus"
          style={styles.addButton}
        />
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

                const category = categories.find((c) => c.id === tx.category_id);
                let categoryName = '';

                if (category?.category_name) {
                  try {
                    const parsedName = JSON.parse(category.category_name);
                    const lang = i18n.language?.split('-')[0] || 'vi';
                    categoryName = parsedName[lang] || parsedName['vi'] || parsedName['en'] || category.category_name;
                  } catch (e) {
                    categoryName = category.category_name;
                  }
                }

                const primaryText = categoryName ? categoryName : title;
                const secondaryText = categoryName ? title : '';

                const isIncome = category?.category_group === 'INCOME' || tx.entry_type === 'CREDIT';
                const isExpense = category?.category_group === 'EXPENSE' || tx.entry_type === 'DEBIT';
                const amountColor = isIncome ? '#4CAF50' : (isExpense ? '#F44336' : colors.text);
                const prefix = isIncome ? '+' : (isExpense ? '-' : '');
                const currency = tx.currency_code || tx.currency || 'VND';

                return (
                  <View key={idx} style={[styles.transactionItemPreview, { borderBottomColor: colors.border }]}>
                    <View style={[styles.transactionPreviewIcon, { backgroundColor: `${category?.color || colors.tint}15` }]}>
                      <AppIcon name={category?.icon as any || "file-invoice-dollar"} size={normalize(18)} color={category?.color || colors.tint} />
                    </View>

                    <View style={styles.transactionPreviewInfo}>
                      <CustomText style={{ color: colors.text, fontSize: normalize(14) }} type="semiBold" numberOfLines={1}>
                        {primaryText}
                      </CustomText>
                      {secondaryText ? (
                        <CustomText style={{ color: colors.icon, fontSize: normalize(12), marginTop: normalize(2) }} numberOfLines={1}>
                          {secondaryText}
                        </CustomText>
                      ) : null}
                    </View>

                    <View style={styles.transactionPreviewAmount}>
                      <CustomText style={{ color: amountColor, fontSize: normalize(14) }} type="semiBold" numberOfLines={1}>
                        {prefix}{amount.toLocaleString('vi-VN')} {currency}
                      </CustomText>
                    </View>
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
    TWCR: t("wallet.type_tracking_name"),
  };
  return typeMap[type] || type;
};

const getGradientColors = (wallet: WalletSummary): [string, string] => {
  if (wallet.color) {
    const lighter = lightenColor(wallet.color, 30);
    return [wallet.color, lighter];
  }
  return ["#3B82F6", lightenColor("#3B82F6", 30)];
};

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
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.86}
      style={styles.walletCardWrap}
    >
      <LinearGradient
        colors={getGradientColors(wallet)}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.walletCard}
      >
        {/* TOP ROW */}
        <View style={styles.topRow}>
          <View style={styles.leftTop}>
            <AppIcon
              name={(wallet.icon as any) || "wallet"}
              size={normalize(14)}
              color="#fff"
            />

            <CustomText style={styles.typeText} numberOfLines={1}>
              {getWalletTypeLabel(wallet.type)}
            </CustomText>
          </View>

          <CustomText style={styles.nameText} numberOfLines={1} type="bold">
            {wallet.name}
          </CustomText>
        </View>

        {/* BOTTOM ROW */}
        <View style={styles.bottomRow}>
          <View>
            {isDefault && (
              <View style={styles.primaryBadge}>
                <AppIcon name="star" size={10} color="#E53935" forceVector />
                <CustomText style={styles.primaryText}>
                  Ví chính
                </CustomText>
              </View>
            )}
          </View>

          <CustomText style={styles.balanceText} type="bold">
            {wallet.balance.toLocaleString("vi-VN")}{" "}
            {wallet.currency === "VND" ? "đ" : wallet.currency}
          </CustomText>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};



export default WalletListScreen;
