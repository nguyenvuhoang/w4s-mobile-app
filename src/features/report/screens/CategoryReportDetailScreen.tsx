import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { CategoryAnalyzeItem, useCategory } from '@/hooks/useCategory';
import { WalletSummary } from '@/types/wallet';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ================= TYPES ================= */

type PeriodType = 'W' | 'M' | 'Q' | 'Y';

interface PeriodOption {
  label: string;
  anchor_date: string;
}

/* ================= HELPERS ================= */

const parseCategoryName = (nameJson: string, lang = 'vi'): string => {
  try {
    const parsed = JSON.parse(nameJson);
    return parsed[lang] || parsed['en'] || nameJson;
  } catch {
    return nameJson;
  }
};

// Removed static PERIOD_TYPES and CATEGORY_TABS to generate inside component

/** Build anchor date options for each period type (current + 5 past) */
const buildPeriodOptions = (periodType: PeriodType, t: any): PeriodOption[] => {
  const today = new Date();
  const options: PeriodOption[] = [];

  switch (periodType) {
    case 'W': {
      // Last 6 weeks
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
    case 'M': {
      // Last 12 months
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
    case 'Q': {
      // Last 8 quarters
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
    case 'Y': {
      // Last 5 years
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

/* ================= SCREEN ================= */

const CategoryReportDetailScreen = () => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { wallets, defaultWallet } = useWallet();

  const PERIOD_TYPES: { id: PeriodType; label: string }[] = useMemo(() => [
    { id: 'W', label: t('report.week') },
    { id: 'M', label: t('report.month') },
    { id: 'Q', label: t('report.quarter') },
    { id: 'Y', label: t('report.year') },
  ], [t]);

  const CATEGORY_TABS = useMemo(() => [
    { id: 'EXPENSE' as const, label: t('report.expense') },
    { id: 'INCOME' as const, label: t('report.income') },
  ], [t]);

  // Đối tượng "Tất cả ví"
  const allWalletOption = useMemo(() => ({
    walletId: 0,
    name: t('report.all_wallets'),
    icon: 'layer-group',
    color: colors.tint,
    balance: wallets.reduce((acc, w) => acc + (w.balance || 0), 0),
    currency: '',
  } as WalletSummary), [wallets, colors.tint, t]);

  const walletOptions = useMemo(() => [allWalletOption, ...wallets], [allWalletOption, wallets]);

  const params = useLocalSearchParams<{
    wallet_id: string;
    anchor_date: string;
    period_type: string;
    currency: string;
    wallet_name: string;
    active_tab?: 'EXPENSE' | 'INCOME';
  }>();

  const { analyzeCategory, categoryAnalysis, analyzing } = useCategory({ autoFetch: false });

  // ---- Filter state ----
  const initWallet = useMemo(() => {
    if (params.wallet_id === '0') return allWalletOption;
    const found = wallets.find(w => w.walletId === Number(params.wallet_id));
    return found || defaultWallet || wallets[0] || allWalletOption;
  }, [params.wallet_id, wallets, defaultWallet, allWalletOption]);

  const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(initWallet);
  const [periodType, setPeriodType] = useState<PeriodType>(
    (params.period_type as PeriodType) || 'M'
  );
  const periodOptions = useMemo(() => buildPeriodOptions(periodType, t), [periodType, t]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(periodOptions[0]);

  // When period type changes, reset to "current" option
  useEffect(() => {
    const opts = buildPeriodOptions(periodType, t);
    setSelectedPeriod(opts[0]);
  }, [periodType, t]);

  // When wallets loaded, sync initial wallet from params
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      if (params.wallet_id === '0') {
        setSelectedWallet(allWalletOption);
      } else {
        const found = wallets.find(w => w.walletId === Number(params.wallet_id));
        setSelectedWallet(found || defaultWallet || wallets[0] || allWalletOption);
      }
    }
  }, [wallets, params.wallet_id, allWalletOption]);

  // Fetch data whenever filters change
  useEffect(() => {
    if (selectedWallet && selectedPeriod) {
      analyzeCategory({
        wallet_id: selectedWallet.walletId,
        anchor_date: selectedPeriod.anchor_date,
        period_type: periodType,
      });
    }
  }, [selectedWallet, selectedPeriod, periodType]);

  // ---- Modal state ----
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  // ---- Tab state ----
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>(params.active_tab || 'EXPENSE');

  const currency = selectedWallet?.currency || params.currency || 'đ';

  const filteredCategories = categoryAnalysis.filter(c => c.category_group === activeTab);
  const totalAmount = filteredCategories.reduce((s, c) => s + c.total_amount, 0);

  const formatCurrency = (v: number) => v.toLocaleString('vi-VN') + ' ' + currency;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('report.category_detail')} showBackButton />

      {/* ===== FILTER ROW ===== */}
      <View style={styles.filterRow}>
        {/* Wallet selector */}
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

        {/* Period selector */}
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

      {/* ===== PERIOD TYPE PILLS ===== */}
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

      {/* ===== TABS: EXPENSE / INCOME ===== */}
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

      {/* ===== CONTENT ===== */}
      {analyzing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText size={14} style={{ color: colors.text, marginTop: normalize(12) }}>
            {t('common.loading')}
          </CustomText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Summary */}
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

          {/* Category list */}
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
                  key={item.id}
                  item={item}
                  currency={currency}
                  colors={colors}
                  rank={index + 1}
                  onPress={() => {
                    router.push({
                      pathname: '/(protected)/category-detail',
                      params: {
                        category: JSON.stringify({
                          category_id: item.id,
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

      {/* ===== WALLET MODAL ===== */}
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
                {w.walletId === 0
                  ? t('report.all_wallets_summary')
                  : `${w.balance?.toLocaleString('vi-VN')} ${w.currency}`}
              </CustomText>
            </View>
            {selectedWallet?.walletId === w.walletId && (
              <FontAwesome6 name="check" size={normalize(14)} color={colors.tint} />
            )}
          </TouchableOpacity>
        ))}
      </BottomSheetModal>

      {/* ===== PERIOD MODAL ===== */}
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

/* ================= BOTTOM SHEET MODAL ================= */

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

/* ================= CATEGORY ITEM ================= */

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

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginTop: hp(1.5),
    gap: normalize(10),
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(10),
    borderRadius: normalize(12),
  },
  filterChipText: { flex: 1 },

  periodTypeRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginTop: hp(1.5),
    gap: normalize(8),
  },
  periodPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
  },
  periodPillActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: wp(5),
    marginTop: hp(1.5),
    marginBottom: hp(1.5),
    gap: normalize(8),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(10),
    alignItems: 'center',
  },
  tabBtnActive: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: wp(5) },

  summaryCard: {
    padding: normalize(16),
    borderRadius: normalize(14),
    marginBottom: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: normalize(12) },
  summaryIconBg: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(8),
    borderRadius: normalize(12),
  },

  emptyCard: {
    padding: normalize(40),
    borderRadius: normalize(14),
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
  },

  categoryList: { gap: normalize(12) },
  categoryCard: { padding: normalize(14), borderRadius: normalize(14) },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: normalize(10),
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
    flex: 1,
  },
  categoryIconWrap: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRight: { alignItems: 'flex-end', gap: normalize(4) },
  percentBadge: {
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
    borderRadius: normalize(20),
  },
  progressBg: { height: normalize(6), borderRadius: normalize(3), overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: normalize(3) },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    paddingTop: normalize(12),
    paddingHorizontal: wp(5),
  },
  modalHandle: {
    width: normalize(40),
    height: normalize(4),
    borderRadius: normalize(2),
    alignSelf: 'center',
    marginBottom: normalize(12),
  },
  modalTitle: {
    marginBottom: normalize(16),
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(4),
    borderRadius: normalize(10),
    marginBottom: normalize(4),
  },
  modalItemIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CategoryReportDetailScreen;