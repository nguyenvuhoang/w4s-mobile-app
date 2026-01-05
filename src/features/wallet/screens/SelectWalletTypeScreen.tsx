import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface WalletType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const WALLET_TYPES: WalletType[] = [
  {
    id: 'tracking',
    name: 'Ví Theo dõi',
    icon: 'wallet-outline',
    description:
      'Ví theo dõi là ví dùng để theo dõi số dư và biến động tài sản, không dùng để giao dịch hay chuyển tiền.',
  },
  {
    id: 'fiat',
    name: 'Ví Fiat',
    icon: 'cash-outline',
    description:
      'Ví Fiat là ví dùng để lưu trữ tiền pháp định (tiền do nhà nước phát hành).',
  },
  {
    id: 'defi',
    name: 'Ví DeFi',
    icon: 'cube-outline',
    description:
      '(Decentralized Finance Wallet) là ví tiền điện tử phi tập trung, cho phép bạn toàn quyền kiểm soát tài sản crypto của mình.',
  },
];

const SelectWalletTypeScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedType) return;

    router.push({
      pathname: '/(protected)/create-wallet-details',
      params: { walletType: selectedType },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Loại ví bạn muốn?" showBackButton />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Subtitle căn giữa */}
        <View style={{ alignItems: 'center' }}>
          <CustomText style={[styles.subtitle, { color: colors.icon }]}>
            Chọn loại ví bạn muốn tạo để theo dõi và quản lý một cách dễ dàng.
          </CustomText>
        </View>

        <View style={styles.typeList}>
          {WALLET_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                { backgroundColor: colors.card },
                selectedType === type.id && {
                  borderColor: colors.tint,
                  borderWidth: 2,
                },
              ]}
              onPress={() => setSelectedType(type.id)}
              activeOpacity={0.7}
            >
              {/* LEFT - Icon + Name (30%) */}
              <View style={styles.leftContent}>
                <LinearGradient
                  colors={colors.gradianBase}
                  style={styles.iconContainer}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={normalize(28)}
                    color="#fff"
                  />
                </LinearGradient>

                <CustomText
                  style={[styles.typeName, { color: colors.text }]}
                >
                  {type.name}
                </CustomText>
              </View>

              {/* RIGHT - Description (70%) */}
              <View style={styles.rightContent}>
                <CustomText
                  style={[styles.typeDescription, { color: colors.icon }]}
                >
                  {type.description}
                </CustomText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: hp(10) }} />
      </ScrollView>

      <View
        style={[
          styles.bottomButton,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={!selectedType}
        >
          <LinearGradient
            colors={
              selectedType
                ? colors.gradianBase
                : [colors.border, colors.border]
            }
            style={styles.continueButtonGradient}
          >
            <CustomText style={styles.continueButtonText}>
              Tiếp tục
            </CustomText>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  subtitle: {
    fontSize: normalize(14),
    marginTop: hp(1),
    marginBottom: hp(2),
    lineHeight: normalize(20),
    textAlign: 'center',
    maxWidth: wp(70),
  },
  typeList: {
    gap: normalize(16),
  },
  typeCard: {
    flexDirection: 'row',
    padding: normalize(16),
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: 'transparent',
  },

  /** LEFT 30% */
  leftContent: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
  },

  /** RIGHT 70% */
  rightContent: {
    width: '70%',
    justifyContent: 'center',
    paddingLeft: normalize(8),
  },

  iconContainer: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeName: {
    fontSize: normalize(14),
    fontWeight: '700',
    textAlign: 'center',
  },

  typeDescription: {
    fontSize: normalize(13),
    lineHeight: normalize(18),
    textAlign: 'center',
  },

  bottomButton: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
  },
  continueButton: {
    borderRadius: normalize(16),
  },
  continueButtonGradient: {
    width: '100%',
    paddingVertical: normalize(16),
    borderRadius: normalize(16),
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#fff',
  },
});

export default SelectWalletTypeScreen;
