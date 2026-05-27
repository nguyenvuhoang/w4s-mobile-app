import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { hp, normalize } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/SelectTrackerWalletTypeScreen.styles';

interface TrackerWalletType {
  id: 'basic' | 'debt' | 'saving';
  name: string;
  icon: string;
  description: string;
  nextRoute: string;
}

const SelectTrackerWalletTypeScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [selected, setSelected] =
    useState<TrackerWalletType | null>(null);

  const TRACKER_WALLET_TYPES: TrackerWalletType[] = [
    {
      id: 'basic',
      name: t('wallet.type_basic_name'),
      icon: 'wallet-outline',
      description: t('wallet.type_basic_desc'),
      nextRoute: '/(protected)/wallet/tracker/create-basic',
    },
    {
      id: 'debt',
      name: t('wallet.type_debt_name'),
      icon: 'swap-horizontal-outline',
      description: t('wallet.type_debt_desc'),
      nextRoute: '/(protected)/wallet/tracker/create-debt-wallet',
    },
    {
      id: 'saving',
      name: t('wallet.type_saving_name'),
      icon: 'trending-up-outline',
      description: t('wallet.type_saving_desc'),
      nextRoute: '/(protected)/wallet/tracker/create-saving-wallet',
    },
  ];

  const handleContinue = () => {
    if (!selected) return;

    if (selected.id === 'basic') {
      router.push(selected.nextRoute);
    } else {
      showNotification(t('common.feature_developing'), 'warning');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title={t('wallet.select_tracker_type_title')} showBackButton />

      <ScrollView style={styles.content}>
        <View style={{ alignItems: 'center' }}>
          <CustomText style={[styles.subtitle, { color: colors.icon }]}>
            {t('wallet.select_tracker_type_subtitle')}
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
              {t('common.continue')}
            </CustomText>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};



export default SelectTrackerWalletTypeScreen;
