import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import BottomActionModal, {
  ActionItem,
} from "@/components/modals/BottomActionModal";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { WalletSummary } from "@/types/wallet";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  // ✅ Lấy mode từ route params
  const params = useLocalSearchParams();
  const mode = (params.mode as "select" | "manage") || "select";

  const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(
    null
  );
  const [showActionModal, setShowActionModal] = useState(false);

  // ✅ GLOBAL WALLET
  const {
    wallets,
    loading,
    error,
    refresh,
    defaultWalletId,
    setDefaultWalletId,
  } = useWallet();

  const handleSelectWallet = (wallet: WalletSummary) => {
    if (mode === "select") {
      // Mode select: chọn và quay lại
      setDefaultWalletId(wallet.walletId);
      onSelectWallet?.(wallet);
      router.back();
    } else {
      // Mode manage: mở modal options
      console.log("Selected wallet for management:", wallet);
      setSelectedWallet(wallet);
      setShowActionModal(true);
    }
  };

  const handleDeleteWallet = () => {
    if (!selectedWallet) return;

    setShowActionModal(false);

    setTimeout(() => {
      Alert.alert(
        "Xác nhận xóa",
        `Bạn có chắc muốn xóa ví "${selectedWallet.name}"?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
            style: "destructive",
            onPress: async () => {
              try {
                // TODO: call delete API with selectedWallet.walletId
                await refresh();
              } catch {
                Alert.alert("Lỗi", "Không thể xóa ví");
              }
            },
          },
        ]
      );
    }, 300);
  };

  const handleEditWallet = () => {
    setShowActionModal(false);
    // TODO: Navigate to edit screen with selectedWallet
    setTimeout(() => {
      Alert.alert("Thông báo", "Chức năng chỉnh sửa đang được phát triển");
    }, 300);
  };

  const handleTransferMoney = () => {
    setShowActionModal(false);
    // TODO: Navigate to transfer screen with selectedWallet
    setTimeout(() => {
      Alert.alert("Thông báo", "Chức năng chuyển tiền đang được phát triển");
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
        label: "Đặt làm mặc định",
        onPress: handleSetDefault,
        hide: selectedWallet?.walletId === defaultWalletId, // Ẩn nếu đã là default
      },
      {
        id: "edit",
        icon: "create-outline",
        label: "Chỉnh sửa",
        onPress: handleEditWallet,
      },
      {
        id: "transfer",
        icon: "swap-horizontal-outline",
        label: "Chuyển tiền",
        onPress: handleTransferMoney,
      },
      {
        id: "delete",
        icon: "trash-outline",
        label: "Xóa ví",
        onPress: handleDeleteWallet,
        destructive: true,
      },
    ],
    [selectedWallet, defaultWalletId]
  );

  /* -------------------- UI STATES -------------------- */

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Ví của tôi" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText style={{ marginTop: normalize(12) }} type="regular">
            Đang tải...
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
        <AppHeader title="Ví của tôi" showBackButton />
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
              Thử lại
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
        title={mode === "select" ? "Chọn nguồn tiền" : "Quản lý ví"}
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
          Ví của tôi
        </CustomText>

        {wallets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CustomText style={{ color: colors.icon }} type="regular">
              Chưa có ví nào
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
            Thêm ví mới
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
        cancelText="Hủy"
      />
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
  mode: "select" | "manage";
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
      style={[styles.walletItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.walletLeft}>
        <View style={[styles.walletIcon, { backgroundColor: wallet.color }]}>
          <Ionicons
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
                  Mặc định
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
});

export default WalletListScreen;