import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useWalletTracker } from '@/features/wallet/hooks/useWalletTracker';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StorageService from '@/services/StorageService';

const EditTrackerWalletScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const params = useLocalSearchParams();

  // Parse params from navigation
  const walletId = Number(params.wallet_id);
  const walletBalance = Number(params.wallet_balance ?? 0);
  const walletType = params.wallet_type as string;
  const walletStatus = (params.status as string) ?? 'A';
  const isPrimary = params.is_primary === 'true';

  const { refresh } = useWallet();
  const { updateWalletProfile, updating } = useWalletTracker();

  const [icon, setIcon] = useState((params.icon as string) || 'wallet');
  const [iconColor, setIconColor] = useState((params.color as string) || '#3B82F6');
  const [walletName, setWalletName] = useState((params.wallet_name as string) || '');
  const [currency, setCurrency] = useState((params.default_currency as string) || 'VND');
  const [currencySymbol, setCurrencySymbol] = useState((params.currency_symbol as string) || 'đ');
  const [currencyName, setCurrencyName] = useState((params.currency_name as string) || 'Vietnamese Dong');

  // Load icon/color/currency từ temp storage (picker screens)
  useFocusEffect(
    useCallback(() => {
      const loadSelectedData = async () => {
        try {
          const selectedIcon = await StorageService.getItem('temp_selected_icon');
          if (selectedIcon) {
            setIcon(selectedIcon);
            await StorageService.removeItem('temp_selected_icon');
          }

          const selectedColor = await StorageService.getItem('temp_selected_color');
          if (selectedColor) {
            setIconColor(selectedColor);
            await StorageService.removeItem('temp_selected_color');
          }

          const selectedCurrencyStr = await StorageService.getItem('temp_selected_currency');
          if (selectedCurrencyStr) {
            try {
              const selectedCurrency = JSON.parse(selectedCurrencyStr);
              setCurrency(selectedCurrency.currencyId || 'VND');
              setCurrencySymbol(selectedCurrency.symbol || 'đ');
              setCurrencyName(selectedCurrency.name || 'Vietnamese Dong');
              await StorageService.removeItem('temp_selected_currency');
            } catch (parseError) {
              console.error('[EditWallet] Failed to parse currency:', parseError);
            }
          }
        } catch (error) {
          console.error('[EditWallet] Failed to load selected data:', error);
        }
      };

      loadSelectedData();
    }, [])
  );

  const handleSave = async () => {
    if (!walletName.trim()) {
      showNotification(t('wallet.error_wallet_name_required'), 'error');
      return;
    }

    try {
      await updateWalletProfile({
        wallet_id: walletId,
        wallet_balance: walletBalance,
        wallet_name: walletName.trim(),
        wallet_type: walletType,
        default_currency: currency,
        is_primary: isPrimary,
        status: walletStatus,
        icon: icon || null,
        color: iconColor || null,
      });

      await refresh();
      showNotification(t('wallet.update_success'), 'success');
      router.back();
    } catch (error) {
      console.error('[EditWallet] Update wallet failed:', error);
      showNotification(t('wallet.error_update_wallet'), 'error');
    }
  };

  const handleSelectIcon = () => {
    router.push({
      pathname: '/(protected)/select-icon',
      params: { color: iconColor },
    });
  };

  const handleSelectColor = () => {
    router.push({
      pathname: '/(protected)/select-color',
      params: { icon },
    });
  };

  const handleSelectCurrency = () => {
    router.push({
      pathname: '/(protected)/select-currency',
      params: { selectedCurrencyId: currency },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('wallet.edit_wallet_title')} showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview Icon */}
          <View style={styles.iconPreview}>
            <View style={[styles.iconCircle, { backgroundColor: iconColor }]}>
              <FontAwesome6 name={icon as any} size={normalize(33)} color="#fff" />
            </View>
          </View>

          {/* Icon & Color pickers */}
          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={[styles.selectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSelectIcon}
            >
              <CustomText style={[styles.selectorLabel, { color: colors.text }]}>Icon</CustomText>
              <View style={styles.selectorValue}>
                <FontAwesome6 name={icon as any} size={normalize(20)} color={colors.text} />
                <FontAwesome6 name="chevron-right" size={normalize(14)} color={colors.icon} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.selectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSelectColor}
            >
              <CustomText style={[styles.selectorLabel, { color: colors.text }]}>{t('wallet.color')}</CustomText>
              <View style={styles.selectorValue}>
                <View style={[styles.colorDot, { backgroundColor: iconColor }]} />
                <FontAwesome6 name="chevron-right" size={normalize(14)} color={colors.icon} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Wallet Name */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
              {t('wallet.wallet_name')}
            </CustomText>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('wallet.wallet_name_placeholder')}
                placeholderTextColor={colors.icon}
                value={walletName}
                onChangeText={setWalletName}
              />
            </View>
          </View>

          {/* Currency */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
              {t('wallet.currency')}
            </CustomText>
            <TouchableOpacity
              style={[styles.currencySelector, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSelectCurrency}
            >
              <View style={styles.currencyLeft}>
                <View style={styles.currencyIconWrapper}>
                  <CustomText style={[styles.currencySymbolText, { color: colors.tint }]} type="bold">
                    {currencySymbol}
                  </CustomText>
                </View>
                <View style={styles.currencyInfo}>
                  <CustomText style={[styles.currencyNameText, { color: colors.icon }]} type="regular" numberOfLines={1}>
                    {currencyName}
                  </CustomText>
                  <CustomText style={[styles.currencyCode, { color: colors.text }]} type="semiBold">
                    {currency}
                  </CustomText>
                </View>
              </View>
              <FontAwesome6 name="chevron-right" size={normalize(14)} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={{ height: hp(2) }} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomButtons, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={updating}
          >
            <CustomText style={[styles.cancelButtonText, { color: colors.text }]} type="semiBold">
              {t('common.cancel')}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.tint,
                opacity: updating || !walletName.trim() ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={updating || !walletName.trim()}
          >
            <CustomText style={styles.saveButtonText} type="bold">
              {updating ? t('common.saving') : t('common.save')}
            </CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  iconPreview: {
    alignItems: 'center',
    paddingVertical: hp(3),
  },
  iconCircle: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    gap: normalize(12),
    marginTop: hp(1),
  },
  selectorCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: normalize(16),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  selectorLabel: { fontSize: normalize(15) },
  selectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  colorDot: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  section: {
    paddingHorizontal: wp(5),
    marginTop: hp(2.5),
  },
  label: {
    fontSize: normalize(14),
    marginBottom: normalize(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
    padding: 0,
    fontFamily: 'Quicksand-Regular',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: normalize(5),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyIconWrapper: {
    width: normalize(48),
    height: normalize(48),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
  },
  currencySymbolText: { fontSize: normalize(24) },
  currencyInfo: { flex: 1 },
  currencyCode: {
    fontSize: normalize(14),
    marginBottom: normalize(2),
  },
  currencyNameText: { fontSize: normalize(13) },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(12),
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
    borderWidth: 1.5,
  },
  cancelButtonText: { fontSize: normalize(16) },
  saveButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: normalize(16),
    color: '#fff',
  },
});

export default EditTrackerWalletScreen;
