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
  id: 'tracking' | 'fiat' | 'defi';
  name: string;
  icon: string;
  description: string;
  nextRoute: string;
}

const WALLET_TYPES: WalletType[] = [
  {
    id: 'tracking',
    name: 'Ví Theo dõi',
    icon: 'wallet-outline',
    description:
      'Theo dõi tài sản, thu chi, công nợ và tiết kiệm.',
    nextRoute: '/(protected)/wallet/tracker/select-subtype',
  },
  {
    id: 'fiat',
    name: 'Ví Fiat',
    icon: 'cash-outline',
    description:
      'Ví lưu trữ tiền pháp định như VND, USD.',
    nextRoute: '/(protected)/wallet/create-fiat-wallet',
  },
  {
    id: 'defi',
    name: 'Ví DeFi',
    icon: 'cube-outline',
    description:
      'Ví tiền điện tử phi tập trung, kiểm soát hoàn toàn tài sản crypto.',
    nextRoute: '/(protected)/wallet/create-defi-wallet',
  },
];

const SelectWalletTypeScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const [selectedType, setSelectedType] =
    useState<WalletType | null>(null);

  const handleContinue = () => {
    if (!selectedType) return;
    router.replace(selectedType.nextRoute);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Loại ví bạn muốn?" showBackButton />

      <ScrollView style={styles.content}>
        <View style={{ alignItems: 'center' }}>
          <CustomText style={[styles.subtitle, { color: colors.icon }]}>
            Chọn loại ví phù hợp với nhu cầu quản lý tài chính của bạn.
          </CustomText>
        </View>

        <View style={styles.typeList}>
          {WALLET_TYPES.map((type) => {
            const active = selectedType?.id === type.id;

            return (
              <TouchableOpacity
                key={type.id}
                activeOpacity={0.7}
                onPress={() => setSelectedType(type)}
                style={[
                  styles.typeCard,
                  { backgroundColor: colors.card },
                  active && {
                    borderColor: colors.tint,
                    borderWidth: 2,
                  },
                ]}
              >
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

                <View style={styles.rightContent}>
                  <CustomText
                    style={[
                      styles.typeDescription,
                      { color: colors.icon },
                    ]}
                  >
                    {type.description}
                  </CustomText>
                </View>
              </TouchableOpacity>
            );
          })}
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
          onPress={handleContinue}
          disabled={!selectedType}
          style={styles.continueButton}
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
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: wp(5) },
  subtitle: {
    fontSize: normalize(14),
    marginTop: hp(1),
    marginBottom: hp(2),
    lineHeight: normalize(20),
    textAlign: 'center',
    maxWidth: wp(70),
  },
  typeList: { gap: normalize(16) },
  typeCard: {
    flexDirection: 'row',
    padding: normalize(16),
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  leftContent: {
    width: '30%',
    alignItems: 'center',
    gap: normalize(8),
  },
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
  continueButton: { borderRadius: normalize(16) },
  continueButtonGradient: {
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
