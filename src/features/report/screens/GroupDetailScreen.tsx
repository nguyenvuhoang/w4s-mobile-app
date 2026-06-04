import AppHeader from '@/components/base/AppHeader';
import AppIcon from '@/components/base/AppIcon';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useWalletIncomeExpenseSummary } from '@/features/home/hooks/Usefinancesummary';
import { useInfiniteTransactions } from '@/features/home/hooks/useInfiniteTransactions';
import { useTransaction } from '@/features/transaction/hooks/useTransaction';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useCategory } from '@/hooks/useCategory';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { PERIOD_TYPE } from '@/constants/PeriodType';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../styles/GroupDetailScreen.styles';
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

type GroupType = 'EXPENSE' | 'INCOME';

interface TimePeriod {
  id: string;
  label: string;
  date: string;
}

interface ScreenData {
  summary: {
    total: number;
    changePercent: number;
    savingAmount: number;
  };
  transactions: any[];
  chartBars: { label: string; amount: number }[];
}

const parseCategoryName = (nameJson: string, lang = 'vi'): string => {
  try {
    const parsed = JSON.parse(nameJson);
    return parsed[lang] || parsed['en'] || nameJson;
  } catch {
    return nameJson;
  }
};

const generateTimePeriods = (t: any): TimePeriod[] => {
  const periods: TimePeriod[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const isCurrentMonth = i === 0;
    let label = '';
    if (isCurrentMonth) {
      label = t('report.this_month');
    } else {
      const month = d.getMonth() + 1;
      const year = d.getFullYear().toString().slice(-2);
      label = `${t('report.month_short')} ${month.toString().padStart(2, '0')}/${year}`;
    }
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    periods.push({ id: i.toString(), label, date: `${year}-${month}-01` });
  }
  return periods;
};

/**
 * Prepares the 3 months required for the trend chart:
 * [T-2, T-1, T_selected] — where the last element is the selected month.
 */
const buildChartMonths = (
  anchorDate: string,
  t: any,
): { date: string; label: string }[] => {
  const today = new Date();
  const anchor = new Date(anchorDate);
  const result: { date: string; label: string }[] = [];

  for (let i = 2; i >= 0; i--) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const date = `${year}-${month}-01`;

    const isCurrentMonth =
      d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    const label = isCurrentMonth
      ? t('report.this_month')
      : `${t('report.month_short')} ${month}/${year.toString().slice(-2)}`;

    result.push({ date, label });
  }
  return result;
};

const GroupDetailScreen = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { wallets, defaultWallet } = useWallet();
  const { defaultCurrency } = useDefaultCurrency();
  const { convert } = useExchangeRate();
  const params = useLocalSearchParams<{
    wallet_id?: string;
    anchor_date?: string;
    type?: GroupType;
  }>();

  const [activeGroup, setActiveGroup] = useState<GroupType>(params.type || 'EXPENSE');
  const [selectedWallet, setSelectedWallet] = useState<any>(() => {
    if (params.wallet_id && wallets.length > 0) {
      return wallets.find(w => w.walletId === Number(params.wallet_id)) || defaultWallet || wallets[0];
    }
    return defaultWallet || wallets[0] || null;
  });

  const timePeriods = useMemo(() => generateTimePeriods(t), [t]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(() => {
    if (params.anchor_date) {
      const found = timePeriods.find(p => p.date === params.anchor_date);
      if (found) return found;
    }
    return timePeriods[timePeriods.length - 1];
  });

  const { advancedSearchTransactions } = useTransaction();
  const { fetchWalletSummary } = useWalletIncomeExpenseSummary();
  const { categories: allCategories } = useCategory();

  const [screenData, setScreenData] = useState<Omit<ScreenData, 'transactions'>>({
    summary: { total: 0, changePercent: 0, savingAmount: 0 },
    chartBars: [],
  });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const fromToDate = useMemo(() => {
    if (!selectedPeriod) return { fromDate: '', toDate: '' };
    const anchorDt = new Date(selectedPeriod.date);
    const year = anchorDt.getFullYear();
    const month = anchorDt.getMonth();
    const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { fromDate, toDate };
  }, [selectedPeriod]);

  const {
    transactions,
    loading: loadingTransactions,
    loadingMore,
    hasMore,
    refresh,
    loadMore,
  } = useInfiniteTransactions(
    20,
    selectedWallet?.walletId,
    undefined,
    activeGroup === 'EXPENSE' ? '02' : '01',
    fromToDate.fromDate,
    fromToDate.toDate
  );

  const scrollRef = useRef<ScrollView>(null);
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(
        wallets.find(w => w.walletId === Number(params.wallet_id)) || defaultWallet || wallets[0],
      );
    }
  }, [wallets]);

  // Automatically scroll to the selected time period tab
  useEffect(() => {
    if (selectedPeriod && scrollRef.current) {
      const index = timePeriods.findIndex(p => p.id === selectedPeriod.id);
      if (index !== -1) {
        scrollRef.current.scrollTo({
          x: index * normalize(90),
          animated: true
        });
      }
    }
  }, [selectedPeriod?.id, timePeriods]);

  /**
   * Loads all required data in parallel using Promise.all:
   * - Monthly summary for selected month
   * - Monthly summaries for selected month - 1 and month - 2 (for trend chart)
   * All updates are batched into a single state update to prevent UI flickering.
   */
  const loadData = useCallback(async () => {
    if (!selectedWallet || !selectedPeriod) return;

    abortRef.current = false;
    setLoadingSummary(true);

    try {
      const walletId = selectedWallet.walletId;
      const anchorDate = selectedPeriod.date;
      const chartMonths = buildChartMonths(anchorDate, t);

      const [
        currentSummaryRes,
        chartMonth0Res,
        chartMonth1Res,
      ] = await Promise.all([
        fetchWalletSummary({ wallet_id: walletId, anchor_date: anchorDate, period_type: PERIOD_TYPE.MONTH }),
        fetchWalletSummary({
          wallet_id: walletId,
          anchor_date: chartMonths[0].date,
          period_type: PERIOD_TYPE.MONTH,
        }),
        fetchWalletSummary({
          wallet_id: walletId,
          anchor_date: chartMonths[1].date,
          period_type: PERIOD_TYPE.MONTH,
        }),
      ]);

      if (abortRef.current) return;

      const isExpense = activeGroup === 'EXPENSE';
      const currentTotal: number = isExpense
        ? (currentSummaryRes?.expense?.total ?? 0)
        : (currentSummaryRes?.income?.total ?? 0);
      const changePercent: number = isExpense
        ? (currentSummaryRes?.expense?.change_percent ?? 0)
        : (currentSummaryRes?.income?.change_percent ?? 0);
      const incomeTotal: number = currentSummaryRes?.income?.total ?? 0;
      const expenseTotal: number = currentSummaryRes?.expense?.total ?? 0;
      const savingAmount: number = incomeTotal > expenseTotal ? incomeTotal - expenseTotal : 0;

      const extractAmount = (res: any) =>
        isExpense ? (res?.expense?.total ?? 0) : (res?.income?.total ?? 0);

      const chartBars = [
        { label: chartMonths[0].label, amount: extractAmount(chartMonth0Res) },
        { label: chartMonths[1].label, amount: extractAmount(chartMonth1Res) },
        { label: chartMonths[2].label, amount: currentTotal },
      ];

      setScreenData({
        summary: { total: currentTotal, changePercent, savingAmount },
        chartBars,
      });
    } catch (err) {
      if (!abortRef.current) {
        console.error('[GroupDetailScreen] loadData error:', err);
      }
    } finally {
      if (!abortRef.current) {
        setLoadingSummary(false);
      }
    }
  }, [selectedWallet, selectedPeriod, activeGroup, fetchWalletSummary, defaultCurrency?.currencyId, t]);

  useEffect(() => {
    loadData();
    return () => {
      abortRef.current = true;
    };
  }, [loadData]);

  const { summary, chartBars } = screenData;
  const groupLabel = activeGroup === 'EXPENSE' ? t('report.expense_items') : t('report.income_items');

  const formatCurrency = useCallback(
    (v: number) => v.toLocaleString('vi-VN') + ' ' + defaultCurrency.symbol,
    [defaultCurrency.symbol],
  );

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (date >= today) {
      return t('home.today');
    } else if (date >= yesterday) {
      return t('home.yesterday');
    } else {
      return date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: any[] } = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.occurred_at);
      const dateKey = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).toISOString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });

    const sortedKeys = Object.keys(groups).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    return sortedKeys.map((key) => ({
      title: formatDateLabel(key),
      data: groups[key],
    }));
  }, [transactions, i18n.language, t]);

  const barData = useMemo(() => {
    const activeColor = activeGroup === 'EXPENSE' ? '#FF6B6B' : '#4CAF50';
    return chartBars.map((item, index) => ({
      value: item.amount,
      label: item.label,
      frontColor: index === chartBars.length - 1 ? activeColor : activeColor + '88',
      labelComponent: () => (
        <View style={{ width: normalize(75), alignItems: 'center', marginTop: normalize(2) }}>
          <CustomText size={9} style={{ color: colors.text, textAlign: 'center' }} numberOfLines={1}>
            {item.label}
          </CustomText>
        </View>
      ),
    }));
  }, [chartBars, activeGroup, colors.icon]);

  const renderHeader = () => (
    <View>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: colors.card }]}
          onPress={() => setShowGroupModal(true)}
        >
          <CustomText type="medium" size={14}>{groupLabel}</CustomText>
          <FontAwesome6 name="chevron-down" size={normalize(12)} color={colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: colors.card }]}
          onPress={() => setShowWalletModal(true)}
        >
          <AppIcon
            name={selectedWallet?.icon || 'wallet'}
            size={normalize(14)}
            color={selectedWallet?.color || colors.tint}
          />
          <CustomText type="medium" size={14} numberOfLines={1} style={{ flex: 1, marginHorizontal: normalize(6) }}>
            {selectedWallet?.name || t('report.select_wallet')}
          </CustomText>
          <FontAwesome6 name="chevron-down" size={normalize(12)} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.periodScroll}
        contentContainerStyle={styles.periodRow}
      >
        {timePeriods.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.periodTab,
              { backgroundColor: colors.card },
              selectedPeriod.id === p.id && [styles.periodTabActive, { backgroundColor: colors.tint }],
            ]}
            onPress={() => setSelectedPeriod(p)}
          >
            <CustomText
              type="medium"
              size={12}
              style={{ color: selectedPeriod.id === p.id ? '#fff' : colors.text }}
            >
              {p.label}
            </CustomText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {(loadingSummary || (loadingTransactions && transactions.length === 0)) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.tint} />
        </View>
      )}

      <View style={styles.sectionTitleContainer}>
        <CustomText type="bold" size={18}>
          {activeGroup === 'EXPENSE' ? t('budget.detail.spending_trend') : t('report.income_items')}
        </CustomText>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <View style={styles.summaryHeader}>
          <View style={[styles.summaryIcon, { backgroundColor: activeGroup === 'EXPENSE' ? '#FFE4E1' : '#E8F5E9' }]}>
            <FontAwesome6
              name={activeGroup === 'EXPENSE' ? 'arrow-trend-down' : 'arrow-trend-up'}
              size={normalize(18)}
              color={activeGroup === 'EXPENSE' ? '#F44336' : '#4CAF50'}
            />
          </View>
          <CustomText size={15}>
            {activeGroup === 'EXPENSE' ? t('report.expense') : t('report.income')}
          </CustomText>
        </View>

        <View style={styles.summaryContent}>
          <CustomText type="bold" size={28}>
            {formatCurrency(summary.total)}
          </CustomText>
          <View style={styles.trendRow}>
            <FontAwesome6
              name={summary.changePercent >= 0 ? 'arrow-up' : 'arrow-down'}
              size={normalize(10)}
              color={summary.changePercent >= 0 ? '#F44336' : '#4CAF50'}
            />
            <CustomText
              size={12}
              style={{ color: summary.changePercent >= 0 ? '#F44336' : '#4CAF50', marginLeft: normalize(4) }}
            >
              {Math.abs(summary.changePercent)}% {t('report.previous_month')}
            </CustomText>

            {activeGroup === 'EXPENSE' && summary.savingAmount > 0 && (
              <CustomText size={12} style={{ color: colors.icon, marginLeft: normalize(12) }}>
                {t('report.saving')}: {formatCurrency(summary.savingAmount)}
              </CustomText>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        {barData.length > 0 && (
          <BarChart
            data={barData}
            barWidth={normalize(45)}
            noOfSections={3}
            barBorderRadius={normalize(25)}
            spacing={normalize(40)}
            initialSpacing={normalize(25)}
            frontColor="lightgray"
            yAxisThickness={0}
            xAxisThickness={0}
            hideRules
            yAxisLabelPrefix=""
            yAxisLabelSuffix=""
            formatYLabel={(v) => {
              const num = Number(v);
              if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)}tr`;
              if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
              return v;
            }}
            xAxisLabelTextStyle={{ color: colors.text, fontSize: normalize(10) }}
            yAxisTextStyle={{ color: colors.text, fontSize: normalize(10) }}
            height={normalize(160)}
          />
        )}
      </View>

      <View style={styles.sectionTitleContainer}>
        <CustomText type="bold" size={18}>{t('paybook.transaction_history')}</CustomText>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: hp(5) }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('home.category_detail_title')} showBackButton />

      <FlatList
        data={groupedTransactions}
        keyExtractor={(item, index) => `group-${index}`}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        renderItem={({ item: group }) => (
          <View style={styles.transactionList}>
            <View style={styles.sectionHeader}>
              <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
                {group.title}
              </CustomText>
            </View>
            {group.data.map((txn: any) => (
              <TransactionItem
                key={txn.transaction_id}
                item={txn}
                colors={colors}
                lang={i18n.language}
                allCategories={allCategories}
                formatCurrency={formatCurrency}
                convert={convert}
                defaultCurrency={defaultCurrency}
              />
            ))}
          </View>
        )}
        onEndReached={() => {
          if (hasMore && !loadingMore && !loadingTransactions) {
            loadMore();
          }
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={loadingSummary || (loadingTransactions && transactions.length === 0)}
            onRefresh={() => {
              loadData();
              refresh();
            }}
            tintColor={colors.tint}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <BottomSheetModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title={t('report.group_report')}
        colors={colors}
      >
        {(['EXPENSE', 'INCOME'] as GroupType[]).map(g => (
          <TouchableOpacity
            key={g}
            style={[
              styles.modalItem,
              activeGroup === g && { backgroundColor: colors.tint + '15' }
            ]}
            onPress={() => { setActiveGroup(g); setShowGroupModal(false); }}
          >
            <View style={[styles.modalItemIcon, { backgroundColor: (g === 'EXPENSE' ? '#F44336' : '#4CAF50') + '15' }]}>
              <FontAwesome6
                name={g === 'EXPENSE' ? 'arrow-trend-down' : 'arrow-trend-up'}
                size={normalize(16)}
                color={g === 'EXPENSE' ? '#F44336' : '#4CAF50'}
              />
            </View>
            <CustomText type={activeGroup === g ? 'bold' : 'regular'} style={{ flex: 1 }}>
              {g === 'EXPENSE' ? t('report.expense_items') : t('report.income_items')}
            </CustomText>
            {activeGroup === g && (
              <FontAwesome6 name="check" size={normalize(14)} color={colors.tint} />
            )}
          </TouchableOpacity>
        ))}
      </BottomSheetModal>

      <BottomSheetModal
        visible={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        title={t('report.select_wallet')}
        colors={colors}
      >
        {wallets.map(w => (
          <TouchableOpacity
            key={w.walletId}
            style={[
              styles.modalItem,
              selectedWallet?.walletId === w.walletId && { backgroundColor: colors.tint + '15' }
            ]}
            onPress={() => { setSelectedWallet(w); setShowWalletModal(false); }}
          >
            <View style={[styles.modalItemIcon, { backgroundColor: (w.color || colors.tint) + '15' }]}>
              <AppIcon
                name={w.icon || 'wallet'}
                size={normalize(16)}
                color={w.color || colors.tint}
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText type={selectedWallet?.walletId === w.walletId ? 'bold' : 'regular'}>{w.name}</CustomText>
              <CustomText size={11} style={{ color: colors.icon }}>
                {w.balance?.toLocaleString('vi-VN')} {w.currency || defaultCurrency.symbol}
              </CustomText>
            </View>
            {selectedWallet?.walletId === w.walletId && (
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

const TransactionItem = ({ item, colors, lang, allCategories, formatCurrency, convert, defaultCurrency }: any) => {
  const isExpense = item.type === 'EXPENSE';
  const iconName = item.icon || 'receipt';
  const iconColor = item.color || colors.tint;

  const txnCurrency = item.currency || 'VND';
  const defaultCurrencyCode = defaultCurrency?.currencyId || 'VND';
  let displayAmount = Math.abs(item.amount);

  if (txnCurrency !== defaultCurrencyCode && convert) {
    const converted = convert(Math.abs(item.amount), txnCurrency, defaultCurrencyCode);
    if (converted !== null) {
      displayAmount = converted;
    }
  }

  const parseText = (text: string | null | undefined): string => {
    if (!text) return '';
    try {
      const parsed = JSON.parse(text);
      return parsed[lang] || parsed.vi || parsed.en || text;
    } catch {
      return text;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.transactionCard, { backgroundColor: colors.card }]}
      onPress={() => {
        const detailData = {
          transactionid: item.transaction_id,
          transactiondate: item.occurred_at,
          transactionname: parseText(item.title),
          transactioncode: item.type === "INCOME" ? "01" : "02",
          nu_m01: item.amount,
          nu_m02: 0,
          ccyid: item.currency || "VND",
          cha_r01: "",
          cha_r02: "",
          sourcetranref: "",
          sourceid: "",
          trandesc: parseText(item.description || item.title),
          status: "Completed",
          icon: iconName,
          color: iconColor,
        };
        router.push({
          pathname: '/(protected)/transaction-detail',
          params: { transaction: JSON.stringify(detailData) },
        });
      }}
    >
      <View style={[styles.iconBox, { backgroundColor: iconColor + '20' }]}>
        <AppIcon
          name={iconName}
          size={normalize(18)}
          color={iconColor}
        />
      </View>
      <View style={{ flex: 1 }}>
        <CustomText type="bold" size={15} numberOfLines={1}>
          {parseText(item.title)}
        </CustomText>
        <CustomText size={12} style={{ color: colors.icon }}>
          {parseText(item.category_name) || 'Khác'}
        </CustomText>
        {item.description && (
          <CustomText size={11} style={{ color: colors.icon, marginTop: 2 }}>
            {parseText(item.description)}
          </CustomText>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <CustomText type="bold" size={15} style={{ color: isExpense ? '#F44336' : '#4CAF50' }}>
          {isExpense ? '-' : '+'}{formatCurrency(displayAmount)}
        </CustomText>
        <CustomText size={11} style={{ color: colors.icon }}>
          {new Date(item.occurred_at).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </CustomText>
        <CustomText size={11} style={{ color: colors.icon }}>
          {new Date(item.occurred_at).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </CustomText>
      </View>
    </TouchableOpacity>
  );
};

export default GroupDetailScreen;