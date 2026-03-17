import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { Tokens } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useSpendingLimit } from '@/hooks/useSpendingLimit';
import { SpendingLimit } from '@/services/repositories/spendingLimit.repository';
import { normalize } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { GlobalContext } from '@/contexts/GlobalContext';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotification } from '@/contexts/NotificationContext';

const SpendingWarningScreen = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { limits, loading, fetchLimits, deleteLimit } = useSpendingLimit();
  const { showNotification } = useNotification();
  const { appInfo } = useContext(GlobalContext);
  const contractNumber = appInfo?.contract_number || "";

  const ALL_PERIODS = [
    { id: 'Day', labelKey: 'settings.daily' },
    { id: 'Week', labelKey: 'settings.weekly' },
    { id: 'Month', labelKey: 'settings.monthly' },
    { id: 'Quarter', labelKey: 'settings.quarterly' },
    { id: 'Year', labelKey: 'settings.yearly' },
  ];



  useFocusEffect(
    useCallback(() => {
      if (contractNumber) {
        fetchLimits(contractNumber);
      }
    }, [fetchLimits, contractNumber])
  );

  const getAvailablePeriods = () => {
    const existingPeriods = limits.map(l => l.period);
    return ALL_PERIODS.filter(p => !existingPeriods.includes(p.id));
  };

  const handleOpenCreate = () => {
    const available = getAvailablePeriods();
    if (available.length === 0) {
      showNotification(
        t('settings.all_periods_set', 'Tất cả chu kỳ đã được thiết lập hạn mức.'), 'warning'
      );
      return;
    }
    router.push({
      pathname: '/(protected)/spending-limit-detail',
      params: { 
        contractNumber: contractNumber,
        initialPeriod: available[0].id,
        availablePeriods: JSON.stringify(available)
      }
    });
  };

  const handleOpenEdit = (item: SpendingLimit) => {
    router.push({
      pathname: '/(protected)/spending-limit-detail',
      params: { item: JSON.stringify(item) }
    });
  };

  const handleDelete = (item: SpendingLimit) => {
    if (!item.spending_limit_id) {
      showNotification(t('settings.error_no_id', 'Không tìm thấy ID hạn mức'), 'error');
      return;
    }
    showNotification(t('settings.confirm_delete_warning'), "warning", undefined, undefined,
      async () => {
        const result = await deleteLimit(item.spending_limit_id!, contractNumber);
        if (result.success) {
          showNotification(t('common.success'), 'success');
        } else {
          showNotification(result.message || t('common.error'), 'error');
        }
      }
    );
  };

  const getPeriodLabel = (p: string) => {
    const period = ALL_PERIODS.find(ap => ap.id.toLowerCase() === p.toLowerCase());
    return period ? t(period.labelKey) : p;
  };

  const renderItem = ({ item }: { item: SpendingLimit }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <View style={styles.periodBadge}>
          <CustomText style={styles.periodBadgeText}>{getPeriodLabel(item.period)}</CustomText>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleOpenEdit(item)}>
            <Ionicons name="create-outline" size={normalize(22)} color={colors.tint} style={{ marginRight: normalize(12) }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={normalize(20)} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View>
          <CustomText style={[styles.amountLabel, { color: colors.icon }]}>
            {t('settings.spending_warning_limit')}
          </CustomText>
          <CustomText style={[styles.amountValue, { color: colors.text }]}>
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: item.currency_code || 'VND',
            }).format(item.limit_amount)}
          </CustomText>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={t('settings.spending_warning_title')}
        rightComponent={
          <TouchableOpacity onPress={handleOpenCreate}>
            <Ionicons name="add-circle-outline" size={normalize(28)} color={colors.tint} />
          </TouchableOpacity>
        }
      />

      {loading && limits.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <FlatList
          data={[...limits].sort((a, b) => {
            const order = ['Day', 'Week', 'Month', 'Quarter', 'Year'];
            return order.indexOf(a.period) - order.indexOf(b.period);
          })}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.spending_limit_id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={normalize(64)} color={colors.border} />
              <CustomText style={[styles.emptyText, { color: colors.icon }]}>
                {t('settings.no_spending_warnings')}
              </CustomText>
            </View>
          }
          onRefresh={() => contractNumber && fetchLimits(contractNumber)}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: normalize(20), gap: normalize(16) },
  card: {
    borderRadius: normalize(16),
    padding: normalize(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  periodBadge: {
    backgroundColor: Tokens.colors.foundation.primary['primary-1'],
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
  },
  periodBadgeText: {
    color: Tokens.colors.foundation.primary['primary-6'],
    fontSize: normalize(12),
    fontWeight: '700',
  },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  amountLabel: { fontSize: normalize(12), marginBottom: normalize(4) },
  amountValue: { fontSize: normalize(20), fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: normalize(100) },
  emptyText: { marginTop: normalize(16), fontSize: normalize(16) },
});

export default SpendingWarningScreen;