import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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


const SelectWalletTypeScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [selectedType, setSelectedType] =
    useState<WalletType | null>(null);

  const WALLET_TYPES: WalletType[] = [
    {
      id: 'tracking',
      name: t('wallet.type_tracking_name'),
      icon: 'wallet-outline',
      description: t('wallet.type_tracking_desc'),
      // nextRoute: '/(protected)/wallet/tracker/select-subtype',
      nextRoute: '/(protected)/wallet/tracker/create-basic',
    },
    {
      id: 'fiat',
      name: t('wallet.type_fiat_name'),
      icon: 'cash-outline',
      description: t('wallet.type_fiat_desc'),
      nextRoute: '/(protected)/wallet/create-fiat-wallet',
    },
    {
      id: 'defi',
      name: t('wallet.type_defi_name'),
      icon: 'cube-outline',
      description: t('wallet.type_defi_desc'),
      nextRoute: '/(protected)/wallet/create-defi-wallet',
    },
  ];

  const handleContinue = () => {
    if (!selectedType) return;

    if (selectedType.id === 'tracking') {
      router.replace(selectedType.nextRoute);
    } else {
      showNotification(t('common.feature_developing'), 'warning');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title={t("wallet.select_type_title")} showBackButton />

      <ScrollView style={styles.content}>
        <View style={{ alignItems: 'center' }}>
          <CustomText style={[styles.subtitle, { color: colors.icon }]}>
            {t("wallet.select_type_subtitle")}
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
                </View>

                <View style={styles.rightContent}>
                  <CustomText
                    style={[styles.typeName, { color: colors.text }]}
                  >
                    {type.name}
                  </CustomText>
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
              {t("common.continue")}
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
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContent: {
    width: '80%',
    justifyContent: 'center',
    paddingLeft: normalize(12),
    gap: normalize(4),
  },
  iconContainer: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeName: {
    fontSize: normalize(16),
    fontWeight: '700',
    textAlign: 'left',
  },
  typeDescription: {
    fontSize: normalize(13),
    lineHeight: normalize(18),
    textAlign: 'left',
  },
  bottomButton: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
  },
  continueButton: { borderRadius: normalize(25) },
  continueButtonGradient: {
    paddingVertical: normalize(16),
    borderRadius: normalize(25),
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#fff',
  },
});

export default SelectWalletTypeScreen;
