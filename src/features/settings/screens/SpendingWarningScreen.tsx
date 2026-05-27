import AppHeader from '@/components/base/AppHeader';
import AppIcon from '@/components/base/AppIcon';
import CustomText from '@/components/base/CustomText';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotification } from '@/contexts/NotificationContext';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useCategory } from '@/hooks/useCategory';
import { styles } from '../styles/SpendingWarningScreen.styles';

const SpendingWarningScreen = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { advancedLimits: limits, loading, fetchAdvancedLimits, deleteLimit } = useSpendingLimit();
  const { showNotification } = useNotification();
  const { appInfo } = useContext(GlobalContext);
  const contractNumber = appInfo?.contract_number || "";

  const { wallets } = useWallet();
  const { categories } = useCategory({ autoFetch: true });

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
        fetchAdvancedLimits(contractNumber);
      }
    }, [fetchAdvancedLimits, contractNumber])
  );

  const handleOpenCreate = () => {
    router.push({
      pathname: '/(protected)/spending-limit-detail',
      params: { 
        contractNumber: contractNumber,
        initialPeriod: 'Month',
        availablePeriods: JSON.stringify(ALL_PERIODS)
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
        const result = await deleteLimit(item.spending_limit_id!, contractNumber, true);
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

  const getWalletInfo = (walletId?: number | null) => {
    if (!walletId) return { name: t('budget.all_wallets', 'Tất cả các ví'), icon: 'layer-group', color: colors.border };
    const wallet = wallets.find(w => w.walletId === walletId);
    return wallet 
      ? { name: wallet.name, icon: wallet.icon || 'wallet', color: wallet.color || colors.tint } 
      : { name: t('budget.all_wallets', 'Tất cả các ví'), icon: 'layer-group', color: colors.border };
  };

  const getCategoryInfo = (categoryCode?: string | null) => {
    if (!categoryCode) return { name: t('settings.all_categories', 'Tất cả danh mục'), icon: 'grid', color: colors.border };
    const cat = categories.find(c => c.category_code === categoryCode);
    if (cat) {
      let displayName = cat.category_name;
      try {
         const parsed = JSON.parse(cat.category_name);
         displayName = parsed.vi || parsed.en || cat.category_name;
      } catch {}
      return { name: displayName, icon: cat.icon || 'grid', color: cat.color || colors.tint };
    }
    return { name: t('settings.all_categories', 'Tất cả danh mục'), icon: 'grid', color: colors.border };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderItem = ({ item }: { item: SpendingLimit }) => {
    const isOverLimit = item.used_amount !== undefined && item.used_amount > item.limit_amount;
    const progressPercent = item.used_amount !== undefined 
      ? Math.min((item.used_amount / item.limit_amount) * 100, 100) 
      : 0;

    const walletInfo = getWalletInfo(item.wallet_id);
    const categoryInfo = getCategoryInfo(item.category_code);

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
            <View style={styles.periodBadge}>
              <CustomText style={styles.periodBadgeText}>{getPeriodLabel(item.period)}</CustomText>
            </View>
            {item.is_active === false && (
               <View style={[styles.periodBadge, { backgroundColor: colors.border, marginLeft: normalize(8) }]}>
                 <CustomText style={[styles.periodBadgeText, { color: colors.icon }]}>{t('common.inactive', 'Ngừng hoạt động')}</CustomText>
               </View>
            )}
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
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <View style={[styles.iconContainer, { backgroundColor: walletInfo.color === colors.border ? colors.border : walletInfo.color }]}>
                 <AppIcon name={walletInfo.icon as any} size={normalize(12)} color={walletInfo.color === colors.border ? colors.icon : '#fff'} />
              </View>
              <CustomText style={[styles.detailText, { color: colors.text }]} numberOfLines={1}>
                {walletInfo.name}
              </CustomText>
            </View>
            <View style={styles.detailItem}>
              <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color === colors.border ? colors.border : categoryInfo.color }]}>
                 <AppIcon name={categoryInfo.icon as any} size={normalize(12)} color={categoryInfo.color === colors.border ? colors.icon : '#fff'} />
              </View>
              <CustomText style={[styles.detailText, { color: colors.text }]} numberOfLines={1}>
                {categoryInfo.name}
              </CustomText>
            </View>
            {(item as any).period_start && (item as any).period_end && (
               <View style={styles.detailItem}>
                 <View style={[styles.iconContainer, { backgroundColor: 'transparent' }]}>
                   <Ionicons name="calendar-outline" size={normalize(14)} color={colors.icon} />
                 </View>
                 <CustomText style={[styles.detailText, { color: colors.text }]} numberOfLines={1}>
                   {formatDate((item as any).period_start)} - {formatDate((item as any).period_end)}
                 </CustomText>
               </View>
            )}
          </View>

          <View style={styles.amountContainer}>
            <View style={styles.amountHeader}>
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

            {item.used_amount !== undefined && (
               <View style={styles.progressContainer}>
                 <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                   <View 
                     style={[
                       styles.progressBarFill, 
                       { 
                         width: `${progressPercent}%`, 
                         backgroundColor: isOverLimit ? '#FF3B30' : colors.tint 
                       }
                     ]} 
                   />
                 </View>
                 <View style={styles.usedAmountRow}>
                   <CustomText style={[styles.usedAmountText, { color: colors.icon }]}>
                     {t('settings.used_amount', 'Đã dùng')}: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: item.currency_code || 'VND' }).format(item.used_amount)}
                   </CustomText>
                   <CustomText style={[styles.remainingText, { color: isOverLimit ? '#FF3B30' : colors.text }]}>
                     {isOverLimit 
                       ? t('settings.over_limit', 'Vượt hạn mức') 
                       : `${t('settings.remaining_amount', 'Còn lại')}: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: item.currency_code || 'VND' }).format(item.limit_amount - item.used_amount)}`}
                   </CustomText>
                 </View>
               </View>
            )}
          </View>
        </View>
      </View>
    );
  };

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
          onRefresh={() => contractNumber && fetchAdvancedLimits(contractNumber)}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
};

export default SpendingWarningScreen;