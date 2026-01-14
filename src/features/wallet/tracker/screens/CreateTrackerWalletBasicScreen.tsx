import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useWalletTracker } from '@/features/wallet/hooks/useWalletTracker';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
import StorageService from '@/services/StorageService';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
      alert('Vui lòng nhập tên ví');
      return;
    }

    const newWallet = {
      type: walletType,
      name: walletName,
      icon,
      iconColor,
      currency,
      balance: parseFloat(initialBalance) || 0,
      includeInReport,
    };

    console.log('[CreateWallet] Creating wallet:', newWallet);

    try {
      await createWalletTracker({
        currency,
        color: iconColor,
        icon,
        isIncludeReport: includeInReport,
        walletType,
      });
      await refresh();
      router.replace('/(protected)/wallet/wallet-list');
    } catch (error) {
      console.error('[CreateWallet] Create wallet failed:', error);
      alert('Không thể tạo ví lúc này. Vui lòng thử lại.');
    }
  };

  const handleSelectIcon = () => {
    router.push({
      pathname: '/(protected)/select-icon',
      params: { 
        color: iconColor,
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

  // Format number with thousand separator
  const formatNumber = (value: string): string => {
    if (!value) return '';
    const number = parseFloat(value.replace(/,/g, ''));
    if (isNaN(number)) return '';
    return number.toLocaleString('en-US');
  };

  // Handle balance input change
  const handleBalanceChange = (text: string) => {
    // Remove all non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    
    setInitialBalance(cleaned);
  };

  // Get formatted balance display
  const getBalanceDisplay = (): string => {
    if (!initialBalance) return '';
    const number = parseFloat(initialBalance);
    if (isNaN(number)) return '';
    return `${number.toLocaleString('en-US')} ${currencySymbol}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Tạo ví theo dõi cơ bản" showBackButton />

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
              <CustomText style={[styles.selectorLabel, { color: colors.text }]}>Màu sắc</CustomText>
              <View style={styles.selectorValue}>
                <View style={[styles.colorDot, { backgroundColor: iconColor }]} />
                <FontAwesome6 name="chevron-right" size={normalize(14)} color={colors.icon} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Wallet Name */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
              Tên Ví
            </CustomText>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Tiền mặt"
                placeholderTextColor={colors.icon}
                value={walletName}
                onChangeText={setWalletName}
              />
            </View>
          </View>

          {/* Currency */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
              Đơn vị tiền tệ
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

          {/* Initial Balance */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
              Số tiền khởi tạo
            </CustomText>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={`0 ${currencySymbol}`}
                placeholderTextColor={colors.icon}
                value={initialBalance}
                onChangeText={handleBalanceChange}
                keyboardType="decimal-pad"
              />
              {initialBalance && !isNaN(parseFloat(initialBalance)) ? (
                <CustomText style={[styles.balanceDisplay, { color: colors.text }]} type="semiBold">
                  {getBalanceDisplay()}
                </CustomText>
              ) : null}
            </View>
            <CustomText style={[styles.helperText, { color: colors.icon }]} type="regular">
              Nhập số tiền ban đầu trong ví này
            </CustomText>
          </View>

          {/* Include in Report Toggle */}
          <View style={styles.section}>
            <View style={[styles.toggleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.toggleLeft}>
                <CustomText style={[styles.toggleLabel, { color: colors.text }]} type="semiBold">
                  Tính vào báo cáo
                </CustomText>
                <CustomText style={[styles.toggleDescription, { color: colors.icon }]} type="regular">
                  Bao gồm số dư ví này trong tổng tài sản
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

          {/* Bottom spacing */}
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
              Hủy
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
              {creatingWallet ? 'Đang tạo...' : 'Tạo'}
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