import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useWalletTracker } from '@/features/wallet/hooks/useWalletTracker';
import { Wallet } from '@/services/repositories/walletTracker.repository';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface WalletListScreenProps {
  mode?: 'select' | 'manage';
  onSelectWallet?: (wallet: Wallet) => void;
}

const WalletListScreen: React.FC<WalletListScreenProps> = ({
  mode = 'select',
  onSelectWallet,
}) => {
  const { colors } = useAppTheme();

  const { wallets, loading, error, refetch } = useWalletTracker({
    autoFetch: true,
  });

  const handleSelectWallet = (wallet: Wallet) => {
    if (mode === 'select') {
      onSelectWallet?.(wallet);
      router.back();
    }
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa ví "${wallet.wallet_name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              // await walletRepository.deleteWallet(wallet.id);
              refetch();
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể xóa ví');
            }
          },
        },
      ]
    );
  };

  const handleWalletOptions = (wallet: Wallet) => {
    Alert.alert(wallet.wallet_name, 'Chọn hành động', [
      { text: 'Chỉnh sửa', onPress: () => {} },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => handleDeleteWallet(wallet),
      },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const handleCreateWallet = () => {
    router.push('/(protected)/select-wallet-type');
  };

  /* -------------------- UI STATES -------------------- */

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Ví của tôi" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText style={{ marginTop: normalize(12) }}>Đang tải...</CustomText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Ví của tôi" showBackButton />
        <View style={styles.centerContainer}>
          <CustomText style={{ textAlign: 'center', marginBottom: normalize(16) }}>
            {error}
          </CustomText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={refetch}
          >
            <CustomText style={{ color: '#fff', fontWeight: '600' }}>
              Thử lại
            </CustomText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={mode === 'select' ? 'Chọn nguồn tiền' : 'Quản lý ví'}
        showBackButton
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                key={wallet.wallet_id}
                wallet={wallet}
                colors={colors}
                mode={mode}
                onPress={() => handleSelectWallet(wallet)}
                onOptionsPress={() => handleWalletOptions(wallet)}
              />
            ))}
          </View>
        )}

        <View style={{ height: hp(10) }} />
      </ScrollView>

      <View style={[styles.bottomButton, { backgroundColor: colors.background }]}>
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
  wallet: Wallet;
  colors: any;
  mode: 'select' | 'manage';
  onPress: () => void;
  onOptionsPress: () => void;
}

const WalletItem: React.FC<WalletItemProps> = ({
  wallet,
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
        <View style={[styles.walletIcon, { backgroundColor: wallet.wallet_color }]}>
          <Ionicons name={wallet.wallet_icon as any} size={normalize(24)} color="#fff" />
        </View>

        <View style={styles.walletInfo}>
          <CustomText style={[styles.walletName, { color: colors.text }]}>
            {wallet.wallet_name}
          </CustomText>
          <CustomText style={[styles.walletBalance, { color: colors.icon }]}>
            {wallet.balance.toLocaleString('vi-VN')} đ
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
    fontWeight: '600',
    paddingHorizontal: wp(5),
    marginTop: hp(2),
    marginBottom: hp(1.5),
  },
  walletList: {
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },
  walletItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: normalize(16),
    borderRadius: normalize(16),
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    flex: 1,
  },
  walletIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletInfo: { flex: 1 },
  walletName: { fontSize: normalize(16), fontWeight: '600' },
  walletBalance: { fontSize: normalize(14) },
  optionsButton: { padding: normalize(8) },
  bottomButton: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  addButton: {
    flexDirection: 'row',
    gap: normalize(8),
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(16),
    borderRadius: normalize(16),
  },
  addButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: hp(6),
  },
  retryButton: {
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
  },
});

export default WalletListScreen;
