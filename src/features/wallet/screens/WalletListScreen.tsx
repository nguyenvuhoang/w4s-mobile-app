import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Wallet {
  id: string;
  name: string;
  balance: number;
  icon: string;
  iconColor: string;
  isDefault?: boolean;
}

interface WalletListScreenProps {
  mode?: 'select' | 'manage'; // select: chọn ví, manage: quản lý ví
  onSelectWallet?: (wallet: Wallet) => void;
}

const WalletListScreen: React.FC<WalletListScreenProps> = ({ 
  mode = 'select',
  onSelectWallet 
}) => {
  const { colors } = useAppTheme();
  
  const [wallets, setWallets] = useState<Wallet[]>([
    {
      id: '1',
      name: 'Tiền mặt',
      balance: 2547000,
      icon: 'cash',
      iconColor: '#22C55E',
      isDefault: true,
    },
    {
      id: '2',
      name: 'Ngân hàng A',
      balance: 5892000,
      icon: 'business',
      iconColor: '#3B82F6',
    },
    {
      id: '3',
      name: 'Ngân hàng B',
      balance: 8234000,
      icon: 'business',
      iconColor: '#EF4444',
    },
    {
      id: '4',
      name: 'Thẻ tín dụng',
      balance: 12456000,
      icon: 'card',
      iconColor: '#F59E0B',
    },
    {
      id: '5',
      name: 'Tiết kiệm',
      balance: 3685000,
      icon: 'wallet',
      iconColor: '#8B5CF6',
    },
  ]);

  const handleSelectWallet = (wallet: Wallet) => {
    if (mode === 'select') {
      onSelectWallet?.(wallet);
      router.back();
    }
  };

  const handleWalletOptions = (wallet: Wallet) => {
    Alert.alert(
      wallet.name,
      'Chọn hành động',
      [
        { text: 'Chỉnh sửa', onPress: () => handleEditWallet(wallet) },
        { text: 'Xóa', onPress: () => handleDeleteWallet(wallet), style: 'destructive' },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  const handleEditWallet = (wallet: Wallet) => {
    // TODO: Navigate to edit wallet screen
    console.log('Edit wallet:', wallet);
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa ví "${wallet.name}"?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setWallets(wallets.filter(w => w.id !== wallet.id));
          },
        },
      ]
    );
  };

  const handleCreateWallet = () => {
    router.push('/(protected)/select-wallet-type');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader 
        title={mode === 'select' ? 'Chọn nguồn tiền' : 'Quản lý ví'}
        showBackButton
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Title */}
        <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
          Ví của tôi
        </CustomText>

        {/* Wallet List */}
        <View style={styles.walletList}>
          {wallets.map((wallet) => (
            <WalletItem
              key={wallet.id}
              wallet={wallet}
              colors={colors}
              onPress={() => handleSelectWallet(wallet)}
              onOptionsPress={() => handleWalletOptions(wallet)}
              mode={mode}
            />
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: hp(10) }} />
      </ScrollView>

      {/* Add Wallet Button */}
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

// Wallet Item Component
interface WalletItemProps {
  wallet: Wallet;
  colors: any;
  onPress: () => void;
  onOptionsPress: () => void;
  mode: 'select' | 'manage';
}

const WalletItem: React.FC<WalletItemProps> = ({
  wallet,
  colors,
  onPress,
  onOptionsPress,
  mode,
}) => {
  return (
    <TouchableOpacity
      style={[styles.walletItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.walletLeft}>
        {/* Icon */}
        <View
          style={[
            styles.walletIcon,
            { backgroundColor: wallet.iconColor },
          ]}
        >
          <Ionicons name={wallet.icon as any} size={normalize(24)} color="#fff" />
        </View>

        {/* Info */}
        <View style={styles.walletInfo}>
          <View style={styles.walletNameRow}>
            <CustomText style={[styles.walletName, { color: colors.text }]}>
              {wallet.name}
            </CustomText>
            {wallet.isDefault && (
              <View style={styles.defaultBadge}>
                <Ionicons name="star" size={normalize(12)} color="#3B82F6" />
                <CustomText style={styles.defaultText}>CHÍNH</CustomText>
              </View>
            )}
          </View>
          <CustomText style={[styles.walletBalance, { color: colors.icon }]}>
            {wallet.balance.toLocaleString('vi-VN')} đ
          </CustomText>
        </View>
      </View>

      {/* Options Button */}
      <TouchableOpacity
        style={styles.optionsButton}
        onPress={(e) => {
          e.stopPropagation();
          onOptionsPress();
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="ellipsis-vertical" size={normalize(20)} color={colors.icon} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: normalize(16),
    borderRadius: normalize(16),
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: normalize(12),
  },
  walletIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    flex: 1,
  },
  walletNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    marginBottom: normalize(4),
  },
  walletName: {
    fontSize: normalize(16),
    fontWeight: '600',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    backgroundColor: '#DBEAFE',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
    borderRadius: normalize(12),
  },
  defaultText: {
    fontSize: normalize(10),
    fontWeight: '600',
    color: '#3B82F6',
  },
  walletBalance: {
    fontSize: normalize(14),
  },
  optionsButton: {
    padding: normalize(8),
  },
  bottomButton: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    paddingVertical: normalize(16),
    borderRadius: normalize(16),
  },
  addButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#fff',
  },
});

export default WalletListScreen;