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

interface TrackerWalletType {
  id: 'basic' | 'debt' | 'saving';
  name: string;
  icon: string;
  description: string;
  nextRoute: string;
}

const TRACKER_WALLET_TYPES: TrackerWalletType[] = [
  {
    id: 'basic',
    name: 'Ví cơ bản',
    icon: 'wallet-outline',
    description: 'Theo dõi thu chi hằng ngày.',
    nextRoute: '/(protected)/wallet/tracker/create-basic',
  },
  {
    id: 'debt',
    name: 'Ví công nợ',
    icon: 'swap-horizontal-outline',
    description: 'Theo dõi vay – cho vay.',
    nextRoute: '/(protected)/wallet/tracker/create-debt-wallet',
  },
  {
    id: 'saving',
    name: 'Ví tiết kiệm',
    icon: 'trending-up-outline',
    description: 'Theo dõi tiền tiết kiệm và mục tiêu.',
    nextRoute: '/(protected)/wallet/tracker/create-saving-wallet',
  },
];

const SelectTrackerWalletTypeScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const [selected, setSelected] =
    useState<TrackerWalletType | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    router.push(selected.nextRoute);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Loại ví theo dõi" showBackButton />

      <ScrollView style={styles.content}>
        <View style={{ alignItems: 'center' }}>
          <CustomText style={[styles.subtitle, { color: colors.icon }]}>
            Chọn loại ví theo dõi bạn muốn tạo.
          </CustomText>
        </View>

        <View style={styles.typeList}>
          {TRACKER_WALLET_TYPES.map((item) => {
            const active = selected?.id === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => setSelected(item)}
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
                      name={item.icon as any}
                      size={normalize(28)}
                      color="#fff"
                    />
                  </LinearGradient>

                  <CustomText
                    style={[styles.typeName, { color: colors.text }]}
                  >
                    {item.name}
                  </CustomText>
                </View>

                <View style={styles.rightContent}>
                  <CustomText
                    style={[
                      styles.typeDescription,
                      { color: colors.icon },
                    ]}
                  >
                    {item.description}
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
          disabled={!selected}
          onPress={handleContinue}
          style={styles.continueButton}
        >
          <LinearGradient
            colors={
              selected
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

export default SelectTrackerWalletTypeScreen;
