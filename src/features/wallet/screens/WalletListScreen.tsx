import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { WalletSummary } from "@/types/wallet";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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
  mode?: "select" | "manage";
  onSelectWallet?: (wallet: WalletSummary) => void;
}

const WalletListScreen: React.FC<WalletListScreenProps> = ({
  mode = "select",
  onSelectWallet,
}) => {
  const { colors } = useAppTheme();

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
    // 🔹 set default khi user chọn
    setDefaultWalletId(wallet.walletId);

    if (mode === "select") {
      onSelectWallet?.(wallet);
      router.back();
    }
  };

  const handleDeleteWallet = (wallet: WalletSummary) => {
    Alert.alert("Xác nhận xóa", `Bạn có chắc muốn xóa ví "${wallet.name}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            // TODO: call delete API
            await refresh();
          } catch {
            Alert.alert("Lỗi", "Không thể xóa ví");
          }
        },
      },
    ]);
  };

  const handleWalletOptions = (wallet: WalletSummary) => {
    Alert.alert(wallet.name, "Chọn hành động", [
      {
        text: "Đặt làm mặc định",
        onPress: () => setDefaultWalletId(wallet.walletId),
      },
      { text: "Chỉnh sửa", onPress: () => {} },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => handleDeleteWallet(wallet),
      },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const handleCreateWallet = () => {
    router.push("/(protected)/select-wallet-type");
  };

  /* -------------------- UI STATES -------------------- */

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Ví của tôi" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText style={{ marginTop: normalize(12) }}>
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
          >
            {error}
          </CustomText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={refresh}
          >
            <CustomText style={{ color: "#fff", fontWeight: "600" }}>
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
        <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
          Ví của tôi
        </CustomText>

        {wallets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CustomText style={{ color: colors.icon }}>
              Chưa có ví nào
            </CustomText>
          </View>
        ) : (
          <View style={styles.walletList}>
            {wallets.map((wallet) => (
              <WalletItem
                key={wallet.walletId}
                wallet={wallet}
                isDefault={wallet.walletId === defaultWalletId} // ✅ NEW
                colors={colors}
                onPress={() => handleSelectWallet(wallet)}
                onOptionsPress={() => handleWalletOptions(wallet)}
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
          <CustomText style={styles.addButtonText}>Thêm ví mới</CustomText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/* -------------------- ITEM -------------------- */

interface WalletItemProps {
  wallet: WalletSummary;
  isDefault: boolean;
  colors: any;
  onPress: () => void;
  onOptionsPress: () => void;
}

const WalletItem: React.FC<WalletItemProps> = ({
  wallet,
  isDefault,
  colors,
  onPress,
  onOptionsPress,
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
            <CustomText style={[styles.walletName, { color: colors.text }]}>
              {wallet.name}
            </CustomText>

            {isDefault && (
              <View
                style={[styles.defaultTag, { backgroundColor: colors.tint }]}
              >
                <CustomText style={styles.defaultTagText}>Mặc định</CustomText>
              </View>
            )}
          </View>

          <CustomText style={[styles.walletBalance, { color: colors.icon }]}>
            {wallet.balance.toLocaleString("vi-VN")} {wallet.currency}
          </CustomText>
        </View>
      </View>

      <TouchableOpacity
        style={styles.optionsButton}
        onPress={(e) => {
          e.stopPropagation();
          onOptionsPress();
        }}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={normalize(20)}
          color={colors.icon}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: "600",
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
  walletName: { fontSize: normalize(16), fontWeight: "600" },
  walletBalance: { fontSize: normalize(14) },
  optionsButton: { padding: normalize(8) },

  // 🔹 DEFAULT TAG
  defaultTag: {
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(2),
    borderRadius: normalize(6),
  },
  defaultTagText: {
    fontSize: normalize(10),
    fontWeight: "600",
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
    fontWeight: "600",
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
