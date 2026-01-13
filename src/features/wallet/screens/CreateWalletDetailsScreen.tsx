import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useWalletTracker } from '@/features/wallet/hooks/useWalletTracker';
import StorageService from '@/services/StorageService';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

  const [icon, setIcon] = useState('wallet');
  const [iconColor, setIconColor] = useState('#3B82F6');


  useFocusEffect(
    useCallback(() => {
      const loadSelectedData = async () => {
        // Check for selected icon
        const selectedIcon = await StorageService.getItem('temp_selected_icon');
        if (selectedIcon) {
          setIcon(selectedIcon);
          await StorageService.removeItem('temp_selected_icon');
        }

        // Check for selected color
        const selectedColor = await StorageService.getItem('temp_selected_color');
        if (selectedColor) {
          setIconColor(selectedColor);
          await StorageService.removeItem('temp_selected_color');
        }
      };

      loadSelectedData();
    }, [])
  );
  
  const [walletName, setWalletName] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [initialBalance, setInitialBalance] = useState('');
  const [includeInReport, setIncludeInReport] = useState(true);

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

    console.log('Create wallet:', newWallet);

    try {
      await createWalletTracker({
        currency,
        color: iconColor,
        icon,
        isIncludeReport: includeInReport,
        walletType,
      });
      await refresh();
      router.replace('/(protected)/wallet-list');
    } catch (error) {
      console.error('[CreateWalletDetailsScreen] create wallet failed', error);
      alert('Khong the tao vi luc nay. Vui long thu lai.');
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Tạo ví theo dõi" showBackButton />

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
            <CustomText style={[styles.label, { color: colors.text }]}>
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
            <CustomText style={[styles.label, { color: colors.text }]}>
              Đơn vị tiền tệ
            </CustomText>
            <TouchableOpacity
              style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                // TODO: Open currency picker modal
                console.log('Open currency picker');
              }}
            >
              <CustomText style={[styles.inputText, { color: colors.text }]}>
                {currency}
              </CustomText>
              <CustomText style={[styles.currencyCode, { color: colors.icon }]}>
                đ
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* Initial Balance */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Số tiền khởi tạo
            </CustomText>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="đ"
                placeholderTextColor={colors.icon}
                value={initialBalance}
                onChangeText={setInitialBalance}
                keyboardType="numeric"
              />
              <CustomText style={[styles.balanceDisplay, { color: colors.text }]}>
                {initialBalance ? parseFloat(initialBalance).toFixed(2) : '0.00'}
              </CustomText>
            </View>
          </View>

          {/* Include in Report Toggle */}
          <View style={styles.section}>
            <View style={[styles.toggleCard, { backgroundColor: colors.card }]}>
              <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
                Tính vào báo cáo
              </CustomText>
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
          >
            <CustomText style={[styles.cancelButtonText, { color: colors.text }]}>
              Hủy
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.tint, opacity: creatingWallet ? 0.6 : 1 }]}
            onPress={handleCreate}
            disabled={creatingWallet}
          >
            <CustomText style={styles.createButtonText}>Tạo</CustomText>
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
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(15),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
    fontWeight: '500',
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
  },
  section: {
    paddingHorizontal: wp(5),
    marginTop: hp(2),
  },
  label: {
    fontSize: normalize(14),
    fontWeight: '500',
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
  },
  inputText: {
    flex: 1,
    fontSize: normalize(16),
  },
  currencyCode: {
    fontSize: normalize(16),
    fontWeight: '600',
    marginLeft: normalize(8),
  },
  balanceDisplay: {
    fontSize: normalize(16),
    fontWeight: '600',
    marginLeft: normalize(8),
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: normalize(16),
    borderRadius: normalize(12),
  },
  toggleLabel: {
    fontSize: normalize(15),
    fontWeight: '500',
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
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#fff',
  },
});

export default CreateWalletDetailsScreen;