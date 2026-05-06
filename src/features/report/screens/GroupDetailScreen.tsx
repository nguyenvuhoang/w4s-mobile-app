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
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ================= TYPES ================= */

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

/* ================= HELPERS ================= */

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
 * Tạo thông tin 3 tháng cần fetch cho biểu đồ:
 * [T-2, T-1, T_selected] — tháng cuối chính là tháng đang xem.
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

/* ================= SCREEN ================= */

const GroupDetailScreen = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { wallets, defaultWallet } = useWallet();
  const { defaultCurrency } = useDefaultCurrency();
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

  // ─── Hooks chỉ dùng để lấy hàm fetch, không dùng state của hook ───
  const { advancedSearchTransactions } = useTransaction();
  const { fetchWalletSummary } = useWalletIncomeExpenseSummary();
  const { categories: allCategories } = useCategory();

  // ─── Toàn bộ data màn hình nằm trong 1 state ───
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

  // Tránh stale closure trong cleanup
  const abortRef = useRef<boolean>(false);

  // ─── Sync wallet từ params (chỉ chạy khi wallets loaded lần đầu) ───
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(
        wallets.find(w => w.walletId === Number(params.wallet_id)) || defaultWallet || wallets[0],
      );
    }
  }, [wallets]);

  // Tự động cuộn đến phần tử đang chọn
  useEffect(() => {
    if (selectedPeriod && scrollRef.current) {
      const index = timePeriods.findIndex(p => p.id === selectedPeriod.id);
      if (index !== -1) {
        scrollRef.current.scrollTo({
          x: index * normalize(90), // Xấp xỉ chiều rộng mỗi tab + gap
          animated: true
        });
      }
    }
  }, [selectedPeriod?.id, timePeriods]);

  /**
   * Load toàn bộ data 1 lần duy nhất theo wallet + period + group.
   *
   * Chiến lược:
   * - Promise.all 4 task song song: summary tháng hiện tại, transactions,
   *   summary T-2, summary T-1 (2 tháng còn lại của biểu đồ).
   * - Tháng hiện tại đã có từ Call 1 nên biểu đồ chỉ cần thêm 2 call nữa.
   * - Sau khi tất cả resolve → 1 lần setState duy nhất → không nhấp nháy.
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
        fetchWalletSummary({ wallet_id: walletId, anchor_date: anchorDate, period_type: 'M' }),
        fetchWalletSummary({
          wallet_id: walletId,
          anchor_date: chartMonths[0].date,
          period_type: 'M',
        }),
        fetchWalletSummary({
          wallet_id: walletId,
          anchor_date: chartMonths[1].date,
          period_type: 'M',
        }),
      ]);

      if (abortRef.current) return;

      // ── Xử lý summary ──
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

      // ── Xử lý chart bars ──
      const extractAmount = (res: any) =>
        isExpense ? (res?.expense?.total ?? 0) : (res?.income?.total ?? 0);

      const chartBars = [
        { label: chartMonths[0].label, amount: extractAmount(chartMonth0Res) },
        { label: chartMonths[1].label, amount: extractAmount(chartMonth1Res) },
        { label: chartMonths[2].label, amount: currentTotal }, // dùng lại Call 1
      ];

      // ── 1 lần setState duy nhất ──
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
  }, [selectedWallet, selectedPeriod, activeGroup, fetchWalletSummary, t]);

  // Trigger load khi dependency thay đổi
  useEffect(() => {
    loadData();
    return () => {
      // Đánh dấu abort để tránh setState sau khi unmount / params đổi
      abortRef.current = true;
    };
  }, [loadData]);

  /* ─── Derived values ─── */
  const { summary, chartBars } = screenData;
  const groupLabel = activeGroup === 'EXPENSE' ? t('report.expense_items') : t('report.income_items');

  const formatCurrency = useCallback(
    (v: number) => v.toLocaleString('vi-VN') + ' ' + (selectedWallet?.currency || defaultCurrency.symbol),
    [selectedWallet, defaultCurrency.symbol],
  );

  // Group transactions by date (copy logic from TransactionHistoryScreen)
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
      {/* ===== FILTERS ===== */}
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

      {/* ===== PERIOD TABS ===== */}
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

      {/* ===== LOADING OVERLAY ===== */}
      {(loadingSummary || (loadingTransactions && transactions.length === 0)) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.tint} />
        </View>
      )}

      {/* ===== SUMMARY SECTION ===== */}
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

      {/* ===== CHART SECTION ===== */}
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

      {/* ===== TRANSACTION HISTORY TITLE ===== */}
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

  /* ─── Render ─── */
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

      {/* ===== GROUP MODAL ===== */}
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

      {/* ===== WALLET MODAL ===== */}
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

/* ================= COMPONENTS ================= */

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

const TransactionItem = ({ item, colors, lang, allCategories, formatCurrency }: any) => {
  const isExpense = item.type === 'EXPENSE';
  const iconName = item.icon || 'receipt';
  const iconColor = item.color || colors.tint;

  return (
    <TouchableOpacity
      style={[styles.transactionCard, { backgroundColor: colors.card }]}
      onPress={() => {
        const detailData = {
          transactionid: item.transaction_id,
          transactiondate: item.occurred_at,
          transactionname: item.title,
          transactioncode: item.type === "INCOME" ? "01" : "02",
          nu_m01: item.amount,
          nu_m02: 0,
          ccyid: item.currency || "VND",
          cha_r01: "",
          cha_r02: "",
          sourcetranref: "",
          sourceid: "",
          trandesc: item.title,
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
          {item.title}
        </CustomText>
        <CustomText size={12} style={{ color: colors.icon }}>
          {item.category_name}
        </CustomText>
        {item.description && (
          <CustomText size={11} style={{ color: colors.icon, marginTop: 2 }}>
            {item.description}
          </CustomText>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <CustomText type="bold" size={15} style={{ color: isExpense ? '#F44336' : '#4CAF50' }}>
          {isExpense ? '-' : '+'}{formatCurrency(Math.abs(item.amount))}
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

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: hp(2) },

  loadingOverlay: {
    alignItems: 'center',
    paddingVertical: normalize(24),
  },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    marginTop: normalize(12),
    gap: normalize(10),
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(10),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },

  periodScroll: {
    marginTop: normalize(16),
  },
  periodRow: {
    paddingHorizontal: wp(5),
    gap: normalize(8),
    flexDirection: 'row',
  },
  periodTab: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
    backgroundColor: 'transparent',
    minWidth: normalize(80),
    alignItems: 'center',
  },
  periodTabActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  sectionTitleContainer: {
    paddingHorizontal: wp(5),
    marginTop: normalize(20),
    marginBottom: normalize(12),
  },

  summaryCard: {
    marginHorizontal: wp(5),
    padding: normalize(16),
    borderRadius: normalize(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
    marginBottom: normalize(12),
  },
  summaryIcon: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: { gap: normalize(4) },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: normalize(4),
  },

  chartContainer: {
    marginHorizontal: wp(5),
    marginTop: normalize(16),
    padding: normalize(16),
    paddingBottom: normalize(32), // Tăng padding bottom để nhãn không bị khuyết
    borderRadius: normalize(20),
    alignItems: 'center',
  },

  transactionList: {
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(12),
    borderRadius: normalize(15),
    gap: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  iconBox: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: normalize(40),
  },
  sectionHeader: {
    paddingVertical: normalize(12),
    marginTop: normalize(4),
  },
  sectionTitle: {
    fontSize: normalize(15),
    fontWeight: "600",
    opacity: 0.7,
  },
  footerLoader: {
    paddingVertical: normalize(20),
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    paddingTop: normalize(12),
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(12),
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

export default GroupDetailScreen;