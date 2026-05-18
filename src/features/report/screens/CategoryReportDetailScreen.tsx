import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { CategoryAnalyzeItem, useCategory } from '@/hooks/useCategory';
import { WalletSummary } from '@/types/wallet';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PERIOD_TYPE, PeriodType } from '@/constants/PeriodType';
import { styles } from '../styles/CategoryReportDetailScreen.styles';

interface PeriodOption {
  label: string;
  anchor_date: string;
}

const parseCategoryName = (nameJson: string, lang = 'vi'): string => {
  try {
    const parsed = JSON.parse(nameJson);
    return parsed[lang] || parsed['en'] || nameJson;
  } catch {
    return nameJson;
  }
};

const buildPeriodOptions = (periodType: PeriodType, t: any): PeriodOption[] => {
  const today = new Date();
  const options: PeriodOption[] = [];

  switch (periodType) {
    case PERIOD_TYPE.WEEK: {
      for (let i = 0; i <= 5; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i * 7);
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        options.push({
          label: i === 0 ? t('report.this_week') : `${t('report.week')} ${dd}/${mm}/${yy}`,
          anchor_date: `${yy}-${mm}-${dd}`,
        });
      }
      break;
    }
    case PERIOD_TYPE.MONTH: {
      for (let i = 0; i <= 11; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        options.push({
          label: i === 0 ? t('report.this_month') : `${t('report.month')} ${mm}/${yy}`,
          anchor_date: `${yy}-${mm}-01`,
        });
      }
      break;
    }
    case PERIOD_TYPE.QUARTER: {
      const currentQ = Math.floor(today.getMonth() / 3);
      for (let i = 0; i <= 7; i++) {
        let q = currentQ - i;
        let y = today.getFullYear();
        while (q < 0) { q += 4; y--; }
        const startMonth = String(q * 3 + 1).padStart(2, '0');
        options.push({
          label: i === 0 ? t('report.this_quarter') : `Q${q + 1}/${y}`,
          anchor_date: `${y}-${startMonth}-01`,
        });
      }
      break;
    }
    case PERIOD_TYPE.YEAR: {
      for (let i = 0; i <= 4; i++) {
        const y = today.getFullYear() - i;
        options.push({
          label: i === 0 ? t('report.this_year') : `${t('report.year')} ${y}`,
          anchor_date: `${y}-01-01`,
        });
      }
      break;
    }
  }
  return options;
};

const CategoryReportDetailScreen = () => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { wallets, defaultWallet } = useWallet();
  const { defaultCurrency } = useDefaultCurrency();

  const PERIOD_TYPES: { id: PeriodType; label: string }[] = useMemo(() => [
    { id: PERIOD_TYPE.WEEK, label: t('report.week') },
    { id: PERIOD_TYPE.MONTH, label: t('report.month') },
    { id: PERIOD_TYPE.QUARTER, label: t('report.quarter') },
    { id: PERIOD_TYPE.YEAR, label: t('report.year') },
  ], [t]);

  const CATEGORY_TABS = useMemo(() => [
    { id: 'EXPENSE' as const, label: t('report.expense') },
    { id: 'INCOME' as const, label: t('report.income') },
  ], [t]);

  const walletOptions = wallets;

  const params = useLocalSearchParams<{
    wallet_id: string;
    anchor_date: string;
    period_type: string;
    currency: string;
    wallet_name: string;
    active_tab?: 'EXPENSE' | 'INCOME';
  }>();

  const { analyzeCategory, categoryAnalysis, analyzing } = useCategory({ autoFetch: false });

  const initWallet = useMemo(() => {
    if (params.wallet_id && params.wallet_id !== '0') {
      const found = wallets.find(w => w.walletId === Number(params.wallet_id));
      if (found) return found;
    }
    return defaultWallet || wallets[0] || null;
  }, [params.wallet_id, wallets, defaultWallet]);

  const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(initWallet);
  const [periodType, setPeriodType] = useState<PeriodType>(
    (params.period_type as PeriodType) || PERIOD_TYPE.MONTH
  );
  const periodOptions = useMemo(() => buildPeriodOptions(periodType, t), [periodType, t]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(periodOptions[0]);

  useEffect(() => {
    const opts = buildPeriodOptions(periodType, t);
    setSelectedPeriod(prev => {
      if (prev && prev.anchor_date === opts[0].anchor_date && prev.label === opts[0].label) {
        return prev;
      }
      return opts[0];
    });
  }, [periodType, t]);

  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      if (params.wallet_id && params.wallet_id !== '0') {
        const found = wallets.find(w => w.walletId === Number(params.wallet_id));
        setSelectedWallet(found || defaultWallet || wallets[0] || null);
      } else {
        setSelectedWallet(defaultWallet || wallets[0] || null);
      }
    }
  }, [wallets, params.wallet_id, defaultWallet]);

  useEffect(() => {
    if (selectedWallet && selectedPeriod) {
      analyzeCategory({
        wallet_id: selectedWallet.walletId,
        anchor_date: selectedPeriod.anchor_date,
        period_type: periodType,
      });
    }
  }, [selectedWallet, selectedPeriod, periodType, defaultCurrency.currencyId]);

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>(params.active_tab || 'EXPENSE');

  const currency = defaultCurrency.symbol;
  const filteredCategories = categoryAnalysis.filter(c => c.category_group === activeTab);
  const totalAmount = filteredCategories.reduce((s, c) => s + c.total_amount, 0);
  const formatCurrency = (v: number) => v.toLocaleString('vi-VN') + ' ' + currency;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('report.category_detail')} showBackButton />

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: colors.card }]}
          onPress={() => setShowWalletModal(true)}
          activeOpacity={0.75}
        >
          <FontAwesome6
            name={(selectedWallet?.icon as any) || 'wallet'}
            size={normalize(13)}
            color={selectedWallet?.color || colors.tint}
          />
          <CustomText type="medium" size={13} numberOfLines={1} style={styles.filterChipText}>
            {selectedWallet?.name || t('report.select_wallet')}
          </CustomText>
          <FontAwesome6 name="chevron-down" size={normalize(11)} color={colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: colors.card }]}
          onPress={() => setShowPeriodModal(true)}
          activeOpacity={0.75}
        >
          <FontAwesome6 name="calendar-days" size={normalize(13)} color={colors.tint} />
          <CustomText type="medium" size={13} numberOfLines={1} style={styles.filterChipText}>
            {selectedPeriod.label}
          </CustomText>
          <FontAwesome6 name="chevron-down" size={normalize(11)} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.periodTypeRow}>
        {PERIOD_TYPES.map(pt => (
          <TouchableOpacity
            key={pt.id}
            style={[
              styles.periodPill,
              { backgroundColor: colors.card },
              periodType === pt.id && [styles.periodPillActive, { backgroundColor: colors.tint }],
            ]}
            onPress={() => setPeriodType(pt.id)}
          >
            <CustomText
              type="medium"
              size={12}
              style={periodType === pt.id ? { color: '#fff' } : { color: colors.text }}
            >
              {pt.label}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabRow}>
        {CATEGORY_TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabBtn,
              { backgroundColor: colors.card },
              activeTab === tab.id && [styles.tabBtnActive, { backgroundColor: colors.tint }],
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <CustomText
              type="medium"
              size={13}
              style={activeTab === tab.id ? { color: '#fff' } : { color: colors.text }}
            >
              {tab.label}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      {analyzing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText size={14} style={{ color: colors.text, marginTop: normalize(12) }}>
            {t('common.loading')}
          </CustomText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={styles.summaryLeft}>
              <View style={[
                styles.summaryIconBg,
                { backgroundColor: activeTab === 'EXPENSE' ? '#FFE4E1' : '#E8F5E9' },
              ]}>
                <FontAwesome6
                  name={activeTab === 'EXPENSE' ? 'arrow-trend-down' : 'arrow-trend-up'}
                  size={normalize(20)}
                  color={activeTab === 'EXPENSE' ? '#F44336' : '#4CAF50'}
                />
              </View>
              <View>
                <CustomText size={12} style={{ color: colors.text }}>
                  {t('report.total_income')} {activeTab === 'EXPENSE' ? t('report.expense').toLowerCase() : t('report.income').toLowerCase()}
                </CustomText>
                <CustomText type="bold" size={20}>
                  {formatCurrency(totalAmount)}
                </CustomText>
              </View>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.tint + '18' }]}>
              <CustomText type="bold" size={18} style={{ color: colors.tint }}>
                {filteredCategories.length}
              </CustomText>
              <CustomText size={11} style={{ color: colors.tint }}>{t('report.group_unit')}</CustomText>
            </View>
          </View>

          {filteredCategories.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <FontAwesome6 name="chart-pie" size={normalize(36)} color={colors.icon} />
              <CustomText size={14} style={{ color: colors.text, marginTop: normalize(12) }}>
                {activeTab === 'EXPENSE' ? t('report.no_expense_data') : t('report.no_income_data')}
              </CustomText>
            </View>
          ) : (
            <View style={styles.categoryList}>
              {filteredCategories.map((item, index) => (
                <CategoryItem
                  key={item.category_code}
                  item={item}
                  currency={currency}
                  colors={colors}
                  rank={index + 1}
                  onPress={() => {
                    router.push({
                      pathname: '/(protected)/category-detail',
                      params: {
                        category: JSON.stringify({
                          category_id: item.id || 0,
                          category_code: item.category_code,
                          name: item.category_name,
                          icon: item.icon,
                          color: item.color,
                          transaction_count: 0,
                          total_amount: item.total_amount,
                          percentage: item.percentage / 100
                        }),
                        anchor_date: selectedPeriod.anchor_date,
                        period_type: periodType,
                        wallet_id: selectedWallet?.walletId
                      }
                    });
                  }}
                />
              ))}
            </View>
          )}

          <View style={{ height: hp(8) }} />
        </ScrollView>
      )}

      <BottomSheetModal
        visible={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        title={t('report.select_wallet')}
        colors={colors}
      >
        {walletOptions.map(w => (
          <TouchableOpacity
            key={w.walletId}
            style={[
              styles.modalItem,
              selectedWallet?.walletId === w.walletId && {
                backgroundColor: colors.tint + '15',
              },
            ]}
            onPress={() => { setSelectedWallet(w); setShowWalletModal(false); }}
          >
            <View style={[styles.modalItemIcon, { backgroundColor: (w.color || colors.tint) + '22' }]}>
              <FontAwesome6
                name={(w.icon as any) || 'wallet'}
                size={normalize(16)}
                color={w.color || colors.tint}
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText type="medium" size={14}>{w.name}</CustomText>
              <CustomText size={12} style={{ color: colors.text }}>
                {`${w.balance?.toLocaleString('vi-VN')} ${w.currency}`}
              </CustomText>
            </View>
            {selectedWallet?.walletId === w.walletId && (
              <FontAwesome6 name="check" size={normalize(14)} color={colors.tint} />
            )}
          </TouchableOpacity>
        ))}
      </BottomSheetModal>

      <BottomSheetModal
        visible={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        title={t('report.select_time_range')}
        colors={colors}
      >
        {periodOptions.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.modalItem,
              selectedPeriod.anchor_date === opt.anchor_date && {
                backgroundColor: colors.tint + '15',
              },
            ]}
            onPress={() => { setSelectedPeriod(opt); setShowPeriodModal(false); }}
          >
            <View style={[styles.modalItemIcon, { backgroundColor: colors.tint + '18' }]}>
              <FontAwesome6 name="calendar-check" size={normalize(15)} color={colors.tint} />
            </View>
            <CustomText type="medium" size={14} style={{ flex: 1 }}>{opt.label}</CustomText>
            {selectedPeriod.anchor_date === opt.anchor_date && (
              <FontAwesome6 name="check" size={normalize(14)} color={colors.tint} />
            )}
          </TouchableOpacity>
        ))}
      </BottomSheetModal>
    </SafeAreaView>
  );
};

const BottomSheetModal = ({
  visible,
  onClose,
  title,
  children,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  colors: any;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
    <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
      <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
      <CustomText type="bold" size={16} style={styles.modalTitle}>{title}</CustomText>
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: hp(55) }}>
        {children}
        <View style={{ height: hp(3) }} />
      </ScrollView>
    </View>
  </Modal>
);

const CategoryItem = ({
  item,
  currency,
  colors,
  rank,
  onPress,
}: {
  item: CategoryAnalyzeItem;
  currency: string;
  colors: any;
  rank: number;
  onPress: () => void;
}) => {
  const name = parseCategoryName(item.category_name);
  const formatCurrency = (v: number) => v.toLocaleString('vi-VN') + ' ' + currency;

  return (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: colors.card }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.categoryHeaderRow}>
        <View style={styles.categoryLeft}>
          <View style={[styles.categoryIconWrap, { backgroundColor: item.color + '22' }]}>
            <FontAwesome6
              name={(item.icon as any) || 'tag'}
              size={normalize(18)}
              color={item.color}
            />
          </View>
          <View style={{ flex: 1 }}>
            <CustomText type="medium" size={14} numberOfLines={1}>{name}</CustomText>
            <CustomText size={11} style={{ color: colors.text }}>
              #{rank} · {item.category_type.replace(/_/g, ' ').toLowerCase()}
            </CustomText>
          </View>
        </View>
        <View style={styles.categoryRight}>
          <CustomText type="bold" size={15} style={{ color: item.color }}>
            {formatCurrency(item.total_amount)}
          </CustomText>
          <View style={[styles.percentBadge, { backgroundColor: item.color + '22' }]}>
            <CustomText type="medium" size={11} style={{ color: item.color }}>
              {item.percentage}%
            </CustomText>
          </View>
        </View>
      </View>
      <View style={[styles.progressBg, { backgroundColor: colors.border || '#eee' }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(item.percentage, 100)}%` as any, backgroundColor: item.color },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

export default CategoryReportDetailScreen;