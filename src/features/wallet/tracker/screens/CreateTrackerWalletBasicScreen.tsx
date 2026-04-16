import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import WalletPreviewCard from '@/components/wallet/WalletPreviewCard';
import { useAppTheme } from '@/core/theme/ThemeContext';
import TransactionAmountInput from '@/features/transaction/components/TransactionAmountInput';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useWalletTracker } from '@/features/wallet/hooks/useWalletTracker';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
import StorageService from '@/services/StorageService';
import { hp, normalize, wp } from '@/utils/layout';
import AppIcon from '@/components/base/AppIcon';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CreateWalletDetailsScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const walletType = params.walletType as string;

  const { refresh } = useWallet();
  const { createWalletTracker, loading: creatingWallet } = useWalletTracker();
  const { defaultCurrency, loading: loadingDefaultCurrency } = useDefaultCurrency();

  const [icon, setIcon] = useState('wallet');
  const [iconColor, setIconColor] = useState('#3B82F6');
  const [walletName, setWalletName] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [currencySymbol, setCurrencySymbol] = useState('đ');
  const [currencyName, setCurrencyName] = useState('Vietnamese Dong');
  const [initialBalance, setInitialBalance] = useState('');
  const [includeInReport, setIncludeInReport] = useState(true);

  // Load default currency when component mounts
  useEffect(() => {
    if (!loadingDefaultCurrency && defaultCurrency) {
      console.log('[CreateWallet] Setting default currency:', defaultCurrency);
      setCurrency(defaultCurrency.currencyId);
      setCurrencySymbol(defaultCurrency.symbol);
      setCurrencyName(defaultCurrency.name);
    }
  }, [loadingDefaultCurrency, defaultCurrency]);

  useFocusEffect(
    useCallback(() => {
      const loadSelectedData = async () => {
        try {
          // Load selected icon
          const selectedIcon = await StorageService.getItem('temp_selected_icon');
          if (selectedIcon) {
            setIcon(selectedIcon);
            await StorageService.removeItem('temp_selected_icon');
          }

          // Load selected color
          const selectedColor = await StorageService.getItem('temp_selected_color');
          if (selectedColor) {
            setIconColor(selectedColor);
            await StorageService.removeItem('temp_selected_color');
          }

          // Load selected currency: Storage => String => Parse => Object
          const selectedCurrencyStr = await StorageService.getItem('temp_selected_currency');
          console.log('[CreateWallet] Raw currency from storage:', selectedCurrencyStr);

          if (selectedCurrencyStr) {
            try {
              // String => Object
              const selectedCurrency = JSON.parse(selectedCurrencyStr);
              console.log('[CreateWallet] Parsed currency:', selectedCurrency);

              setCurrency(selectedCurrency.currencyId || 'VND');
              setCurrencySymbol(selectedCurrency.symbol || 'đ');
              setCurrencyName(selectedCurrency.name || 'Vietnamese Dong');

              await StorageService.removeItem('temp_selected_currency');
            } catch (parseError) {
              console.error('[CreateWallet] Failed to parse currency:', parseError);
            }
          }
        } catch (error) {
          console.error('[CreateWallet] Failed to load selected data:', error);
        }
      };

      loadSelectedData();
    }, [])
  );

  const handleCreate = async () => {
    if (!walletName.trim()) {
      alert(t('wallet.error_wallet_name_required'));
      return;
    }

    const finalBalance = parseFloat(initialBalance.replace(/,/g, '')) || 0;

    const newWallet = {
      type: walletType,
      name: walletName,
      icon,
      iconColor,
      currency,
      balance: finalBalance,
      includeInReport,
    };

    console.log('[CreateWallet] Creating wallet:', newWallet);

    try {
      await createWalletTracker({
        walletName,
        currency,
        color: iconColor,
        icon,
        isIncludeReport: includeInReport,
        amount: finalBalance,
        walletType,
      });
      await refresh();
      router.navigate('/(protected)/wallet/wallet-list');
    } catch (error) {
      console.error('[CreateWallet] Create wallet failed:', error);
      alert(t('wallet.error_create_wallet'));
    }
  };

  const handleSelectIcon = () => {
    router.push({
      pathname: '/(protected)/select-icon',
      params: {
        color: iconColor,
        category: 'WALLET',
      }
    });
  };

  const handleSelectColor = () => {
    router.push({
      pathname: '/(protected)/select-color',
      params: {
        icon,
      }
    });
  };

  const handleSelectCurrency = () => {
    router.push({
      pathname: '/(protected)/select-currency',
      params: {
        selectedCurrencyId: currency,
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('wallet.create_basic_wallet_title')} showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview Card */}
          <WalletPreviewCard
            icon={icon}
            color={iconColor}
            walletType="Ví theo dõi"
            walletName={walletName.trim() || t('wallet.wallet_name_placeholder')}
          />

          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={[styles.selectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSelectIcon}
            >
              <CustomText style={[styles.selectorLabel, { color: colors.text }]}>Icon</CustomText>
              <View style={styles.selectorValue}>
                <AppIcon name={icon as any} size={normalize(20)} color={colors.text} />
                <AppIcon name="chevron-right" size={normalize(14)} color={colors.icon} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.selectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSelectColor}
            >
              <CustomText style={[styles.selectorLabel, { color: colors.text }]}>{t('wallet.color')}</CustomText>
              <View style={styles.selectorValue}>
                <View style={[styles.colorDot, { backgroundColor: iconColor }]} />
                <AppIcon name="chevron-right" size={normalize(14)} color={colors.icon} />
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
              <AppIcon name="chevron-right" size={normalize(14)} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Initial Balance */}
          <TransactionAmountInput
            amount={initialBalance}
            onAmountChange={setInitialBalance}
            inputCurrency={{ currencyId: currency, symbol: currencySymbol }}
            walletCurrency={{ currencyId: currency, symbol: currencySymbol }}
            disableCurrencySelect={true}
            label={t('wallet.initial_balance')}
          />
          <View style={{ paddingHorizontal: wp(5) }}>
            <CustomText style={[styles.helperText, { color: colors.icon }]} type="regular">
              {t('wallet.initial_balance_helper')}
            </CustomText>
          </View>

          {/* Include in Report Toggle */}
          <View style={styles.section}>
            <View style={[styles.toggleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.toggleLeft}>
                <CustomText style={[styles.toggleLabel, { color: colors.text }]} type="semiBold">
                  {t('transaction.include_in_report')}
                </CustomText>
              </View>
              <Switch
                value={includeInReport}
                onValueChange={setIncludeInReport}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor="#fff"
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>

          <View style={{ height: hp(2) }} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomButtons, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={creatingWallet}
          >
            <CustomText style={[styles.cancelButtonText, { color: colors.text }]} type="semiBold">
              {t('common.cancel')}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: colors.tint,
                opacity: creatingWallet || !walletName.trim() ? 0.5 : 1
              }
            ]}
            onPress={handleCreate}
            disabled={creatingWallet || !walletName.trim()}
          >
            <CustomText style={styles.createButtonText} type="bold">
              {creatingWallet ? t('wallet.creating') : t('wallet.create')}
            </CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
  selectorLabel: {
    fontSize: normalize(15),
  },
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
  helperText: {
    fontSize: normalize(12),
    marginTop: normalize(6),
    marginLeft: normalize(4),
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
  currencySymbolText: {
    fontSize: normalize(24),
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: normalize(14),
    marginBottom: normalize(2),
  },
  currencyNameText: {
    fontSize: normalize(13),
  },
  balanceDisplay: {
    fontSize: normalize(16),
    marginLeft: normalize(8),
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: normalize(16),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  toggleLeft: {
    flex: 1,
    marginRight: normalize(12),
  },
  toggleLabel: {
    fontSize: normalize(15),
    marginBottom: normalize(4),
  },
  toggleDescription: {
    fontSize: normalize(13),
  },
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
  cancelButtonText: {
    fontSize: normalize(16),
  },
  createButton: {
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
  createButtonText: {
    fontSize: normalize(16),
    color: '#fff',
  },
});

export default CreateWalletDetailsScreen;