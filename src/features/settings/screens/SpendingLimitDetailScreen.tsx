import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import FormattedMoneyInput from '@/components/base/FormattedMoneyInput';
import BottomActionModal, { ActionItem } from '@/components/modals/BottomActionModal';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useSpendingLimit } from '@/hooks/useSpendingLimit';
import { SpendingLimit } from '@/services/repositories/spendingLimit.repository';
import StorageService from '@/services/StorageService';
import { normalize } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SpendingLimitDetailScreen = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { createLimit, updateLimit, loading } = useSpendingLimit();
  const { showNotification } = useNotification();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [amount, setAmount] = useState(0);
  const [period, setPeriod] = useState('');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState({ id: 'VND', symbol: 'đ' });
  const [editingLimit, setEditingLimit] = useState<SpendingLimit | null>(null);
  const [contractNumber, setContractNumber] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);

  const ALL_PERIODS = [
    { id: 'Day', labelKey: 'settings.daily' },
    { id: 'Week', labelKey: 'settings.weekly' },
    { id: 'Month', labelKey: 'settings.monthly' },
    { id: 'Quarter', labelKey: 'settings.quarterly' },
    { id: 'Year', labelKey: 'settings.yearly' },
  ];

  const { item: itemParam, contractNumber: cnParam, initialPeriod, availablePeriods: apParam } = params;

  useEffect(() => {
    if (itemParam) {
      try {
        const item: SpendingLimit = JSON.parse(itemParam as string);
        if (item.spending_limit_id !== editingLimit?.spending_limit_id) {
          setEditingLimit(item);
          setPeriod(item.period);
          setAmount(item.limit_amount);
          setSelectedCurrency({
            id: item.currency_code,
            symbol: item.currency_code === 'VND' ? 'đ' : item.currency_code,
          });
          setContractNumber(item.contract_number);
        }
      } catch (e) {
        console.error('Failed to parse item param', e);
      }
    } else if (cnParam) {
      if (cnParam !== contractNumber) {
        setContractNumber(cnParam as string);
      }
      if (initialPeriod && initialPeriod !== period) {
        setPeriod(initialPeriod as string);
      }
      if (apParam) {
        try {
          const parsed = JSON.parse(apParam as string);
          if (JSON.stringify(parsed) !== JSON.stringify(availablePeriods)) {
            setAvailablePeriods(parsed);
          }
        } catch (e) {
          console.error('Failed to parse availablePeriods param', e);
        }
      }
    }
  }, [itemParam, cnParam, initialPeriod, apParam]);

  useFocusEffect(
    useCallback(() => {
      const checkCurrency = async () => {
        try {
          const stored = await StorageService.getItem('temp_selected_currency');
          if (stored) {
            const data = JSON.parse(stored);
            setSelectedCurrency({ id: data.currencyId, symbol: data.symbol });
            await StorageService.removeItem('temp_selected_currency');
          }
        } catch (error) {
          console.error('Error checking selected currency:', error);
        }
      };
      checkCurrency();
    }, [])
  );

  const handleCurrencyPress = () => {
    router.push('/(protected)/select-currency');
  };

  const getPeriodLabel = (p: string) => {
    const periodObj = ALL_PERIODS.find(ap => ap.id.toLowerCase() === p.toLowerCase());
    return periodObj ? t(periodObj.labelKey) : p;
  };

  const getAvailablePeriods = () => {
    if (editingLimit) {
      return ALL_PERIODS.filter(p => p.id === editingLimit.period);
    }
    return availablePeriods.length > 0 ? availablePeriods : ALL_PERIODS;
  };

  const periodActions: ActionItem[] = getAvailablePeriods().map(p => ({
    id: p.id,
    label: t(p.labelKey),
    onPress: () => { setPeriod(p.id); setShowPeriodModal(false); },
    icon: 'calendar-outline',
  }));

  const handleSubmit = async () => {
    if (amount <= 0) {
      showNotification(t('validation.amount_required', 'Vui lòng nhập số tiền hợp lệ'), 'error');
      return;
    }

    if (editingLimit) {
      const result = await updateLimit({
        spending_limit_id: editingLimit.spending_limit_id!,
        period: period,
        limit_amount: amount,
        currency_code: selectedCurrency.id,
        is_active: editingLimit.is_active ?? true,
      }, contractNumber);

      if (result.success) {
        showNotification(t('common.success'), 'success');
        router.back();
      } else {
        showNotification(result.message || t('common.error'), 'error');
      }
    } else {
      const result = await createLimit({
        contract_number: contractNumber,
        period: period,
        limit_amount: amount,
        currency_code: selectedCurrency.id,
      });

      if (result.success) {
        showNotification(t('common.success'), 'success');
        router.back();
      } else {
        showNotification(result.message || t('common.error'), 'error');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={editingLimit ? t('settings.edit_spending_warning', 'Chỉnh sửa hạn mức') : t('settings.create_spending_warning')}
        showBackButton
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + normalize(20) }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <CustomText style={[styles.fieldLabel, { color: colors.text }]}>
              {t('settings.spending_warning_period')}
            </CustomText>
            <TouchableOpacity
              style={[
                styles.selector,
                {
                  backgroundColor: editingLimit ? colors.border : colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowPeriodModal(true)}
              disabled={!!editingLimit}
            >
              <CustomText style={{ color: editingLimit ? colors.icon : colors.text }}>
                {getPeriodLabel(period)}
              </CustomText>
              {!editingLimit && (
                <Ionicons name="chevron-down" size={normalize(20)} color={colors.icon} />
              )}
            </TouchableOpacity>

            <CustomText style={[styles.fieldLabel, { color: colors.text, marginTop: normalize(20) }]}>
              {t('settings.spending_warning_limit')}
            </CustomText>
            <FormattedMoneyInput
              value={amount}
              onChange={setAmount}
              currency={selectedCurrency.symbol}
              onCurrencyPress={handleCurrencyPress}
              containerStyle={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + normalize(16), backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <CustomText style={styles.submitButtonText}>
                {editingLimit ? t('common.update', 'Cập nhật') : t('common.create')}
              </CustomText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <BottomActionModal
        visible={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        title={t('settings.spending_warning_period')}
        actions={periodActions}
        colors={colors}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: normalize(20) },
  card: {
    padding: normalize(20),
    borderRadius: normalize(16),
  },
  fieldLabel: {
    fontSize: normalize(14),
    fontWeight: '600',
    marginBottom: normalize(8),
  },
  selector: {
    height: normalize(52),
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputContainer: {
    height: normalize(52),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  footer: {
    padding: normalize(20),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    height: normalize(52),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: normalize(16),
    fontWeight: '700',
  },
});

export default SpendingLimitDetailScreen;
