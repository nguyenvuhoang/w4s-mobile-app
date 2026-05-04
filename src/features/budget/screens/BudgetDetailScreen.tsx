import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { Fonts } from '@/core/theme/font';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useBudget } from '@/features/budget/hooks/useBudget';
import { useTransaction } from '@/features/transaction/hooks/useTransaction';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View, Pressable } from 'react-native';
import { useNotification } from '@/contexts/NotificationContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polyline, Stop, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────────
// Note: formatMoney removed, using formatAmount from useCurrencyConverter instead

const formatMoneyShort = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const daysBetween = (a: Date, b: Date) => {
  const d1 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const d2 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
};

// ─── Sparkline Chart ─────────────────────────────────────────────────────────────
interface SparklineProps {
  data: { day: number; amount: number }[];
  lineColor: string;
  totalBudget: number;
  maxDay?: number;
  projectionAmount?: number;
}

const SparklineChart: React.FC<SparklineProps> = ({
  data,
  lineColor,
  totalBudget,
  maxDay: propMaxDay,
  projectionAmount,
}) => {
  const { t } = useTranslation();
  const CHART_W = SCREEN_WIDTH - wp(10) - normalize(32);
  const CHART_H = normalize(170);
  const PAD_TOP = normalize(12);
  const PAD_BOTTOM = normalize(8);
  const PAD_LEFT = normalize(52);   // room for Y-axis labels
  const PAD_RIGHT = normalize(10);

  const innerW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;

  if (!data || data.length < 2) {
    return (
      <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
        <CustomText style={{ color: '#888', fontSize: normalize(13) }}>
          {t('budget.detail.no_data')}
        </CustomText>
      </View>
    );
  }

  // ── Dimensions ───────────────────────────────────────────────────────────────
  const maxDay = propMaxDay || data[data.length - 1].day || 1;
  const currentDay = data[data.length - 1].day;          // today's day index

  // Y-axis max: only based on budget & actual data — NOT projectionAmount
  // (projection can exceed budget, but the scale stays anchored to the budget)
  const rawMax = Math.max(
    totalBudget,
    ...data.map(d => d.amount),
  );
  const maxAmount = rawMax * 1.2;   // 20% headroom — budget line sits at ~83% height

  const toX = (day: number) => PAD_LEFT + (day / maxDay) * innerW;
  const toY = (val: number) => PAD_TOP + (1 - val / maxAmount) * innerH;

  const bottomY = PAD_TOP + innerH;

  // ── Solid line (actual) ───────────────────────────────────────────────────────
  const solidPoints = data.map(d => `${toX(d.day)},${toY(d.amount)}`).join(' ');

  // Filled gradient area under solid line
  const solidPathD = data.reduce(
    (acc, d, i) =>
      acc + (i === 0 ? `M ${toX(d.day)} ${toY(d.amount)}` : ` L ${toX(d.day)} ${toY(d.amount)}`),
    '',
  );
  const filledPath = `${solidPathD} L ${toX(currentDay)} ${bottomY} L ${toX(0)} ${bottomY} Z`;

  // ── Budget-limit dashed line ──────────────────────────────────────────────────
  const limitY = toY(totalBudget);

  // ── Projection dashed line (today → end) ─────────────────────────────────────
  const lastPoint = data[data.length - 1];
  const projStartX = toX(lastPoint.day);
  const projStartY = toY(lastPoint.amount);
  const projEndX = toX(maxDay);
  // Clamp projection Y: if estimatedTotal > maxAmount, pin to top of chart
  const clampedProjAmount = projectionAmount !== undefined
    ? Math.min(projectionAmount, maxAmount)
    : undefined;
  const projEndY = clampedProjAmount !== undefined ? toY(clampedProjAmount) : projStartY;
  const projectionD =
    projectionAmount !== undefined && maxDay > currentDay
      ? `M ${projStartX} ${projStartY} L ${projEndX} ${projEndY}`
      : '';

  // ── Today vertical marker ─────────────────────────────────────────────────────
  const todayX = toX(currentDay);
  const todayDotY = toY(lastPoint.amount);

  // ── Y-axis ticks (4 levels) ───────────────────────────────────────────────────
  const yTicks = [0, 0.33, 0.66, 1].map(f => Math.round(maxAmount * f));

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <LinearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lineColor} stopOpacity="0.22" />
          <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* ── Y-axis grid lines + labels ───────────────────────────── */}
      {yTicks.map((tick, i) => {
        const y = toY(tick);
        return (
          <React.Fragment key={i}>
            <Line
              x1={PAD_LEFT}
              y1={y}
              x2={CHART_W - PAD_RIGHT}
              y2={y}
              stroke="#888"
              strokeWidth={0.5}
              strokeOpacity={0.25}
            />
            <SvgText
              x={PAD_LEFT - normalize(5)}
              y={y + normalize(4)}
              fontSize={normalize(9)}
              fill="#888"
              textAnchor="end"
            >
              {formatMoneyShort(tick)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* ── Budget-limit dashed line (red) ───────────────────────── */}
      <Line
        x1={PAD_LEFT}
        y1={limitY}
        x2={CHART_W - PAD_RIGHT}
        y2={limitY}
        stroke="#FF6B6B"
        strokeWidth={1.5}
        strokeDasharray="5,4"
        strokeOpacity={0.75}
      />

      {/* ── Gradient fill under solid line ───────────────────────── */}
      <Path d={filledPath} fill="url(#sparkGrad)" />

      {/* ── Projection dashed line ───────────────────────────────── */}
      {projectionD ? (
        <Path
          d={projectionD}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeDasharray="7,5"
          opacity={0.65}
        />
      ) : null}

      {/* ── Solid actual-spending line ────────────────────────────── */}
      <Polyline
        points={solidPoints}
        fill="none"
        stroke={lineColor}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* ── Today vertical guide ──────────────────────────────────── */}
      <Line
        x1={todayX}
        y1={PAD_TOP}
        x2={todayX}
        y2={bottomY}
        stroke={lineColor}
        strokeWidth={1}
        strokeDasharray="3,3"
        strokeOpacity={0.4}
      />

      {/* ── Today dot ────────────────────────────────────────────── */}
      <Circle cx={todayX} cy={todayDotY} r={normalize(6)} fill={lineColor} fillOpacity={0.2} />
      <Circle cx={todayX} cy={todayDotY} r={normalize(3.5)} fill={lineColor} />
    </Svg>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────────
interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  subColor: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, iconBg, iconColor, textColor, subColor }) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoIconBox, { backgroundColor: iconBg }]}>
      <FontAwesome6 name={icon as any} size={normalize(14)} color={iconColor} />
    </View>
    <View style={{ flex: 1 }}>
      <CustomText style={[styles.infoLabel, { color: subColor }]}>{label}</CustomText>
      <CustomText style={[styles.infoValue, { color: textColor }]}>{value}</CustomText>
    </View>
  </View>
);

interface SummaryBlockProps {
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  subColor: string;
  note: string;
}

const SummaryBlock: React.FC<SummaryBlockProps> = ({ label, value, icon, iconBg, iconColor, textColor, subColor, note }) => (
  <View style={styles.summaryBlock}>
    <View style={[styles.summaryIconBox, { backgroundColor: iconBg }]}>
      <FontAwesome6 name={icon as any} size={normalize(16)} color={iconColor} />
    </View>
    <CustomText style={[styles.summaryLabel, { color: subColor }]}>{label}</CustomText>
    <CustomText style={[styles.summaryValue, { color: textColor }]}>{value}</CustomText>
    <CustomText style={[styles.summaryNote, { color: subColor }]}>{note}</CustomText>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────────
const BudgetDetailScreen = () => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();
  const { getWalletById } = useWallet();
  const { advancedSearchTransactions } = useTransaction();
  const { formatAmount } = useCurrencyConverter();
  const { deleteBudget } = useBudget({ autoFetch: false });
  const { showNotification } = useNotification();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const budget = useMemo(() => {
    try {
      return typeof params.budget === 'string' ? JSON.parse(params.budget) : params.budget;
    } catch {
      return null;
    }
  }, [params.budget]);

  if (!budget) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title={t('budget.detail.title')} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <CustomText style={{ color: colors.icon }}>{t('budget.detail.not_found')}</CustomText>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Computed values ──────────────────────────────────────────────────────────
  const total = Number(budget.total || budget.amount || 0);
  const spent = Number(budget.spent || budget.used_amount || 0);
  const remaining = total - spent;
  const percentage = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const isOverBudget = spent > total;

  const startDate = budget.start_date ? new Date(budget.start_date) : null;
  const endDate = budget.end_date ? new Date(budget.end_date) : null;
  const now = new Date();

  const totalDays = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const daysLeft = endDate ? Math.max(0, daysBetween(now, endDate)) : 0;
  const daysElapsed = totalDays - daysLeft;

  const dailyRecommended = daysLeft > 0 ? Math.max(0, remaining / daysLeft) : 0;
  const dailyPace = daysElapsed > 0 ? spent / daysElapsed : 0;
  const estimatedTotal = dailyPace * totalDays;

  const accentColor = budget.iconColor || colors.tint;
  const progressFillColor = isOverBudget ? '#FF6B6B' : accentColor;

  const walletObj = budget.wallet_id ? getWalletById(Number(budget.wallet_id)) : null;
  // We use formatAmount which automatically uses the user's default currency
  const displayWalletName =
    budget.walletName ||
    budget.wallet_name ||
    walletObj?.name ||
    (budget.wallet_id === 'all'
      ? t('budget.detail.all_wallets')
      : budget.wallet_id
        ? `${t('budget.detail.wallet_prefix')}${budget.wallet_id}`
        : t('budget.detail.all_wallets'));

  // ─── Fetch transactions & build real sparkline ──────────────────────────────
  useEffect(() => {
    if (!budget) return;
    const fetchTransactions = async () => {
      try {
        setChartLoading(true);
        const result = await advancedSearchTransactions({
          wallet_budget_id: budget.id || budget.budget_id || undefined,
          from_transaction_date: budget.start_date || undefined,
          to_transaction_date: budget.end_date || undefined,
          page_index: 1,
          page_size: 200,
        });
        const list: any[] = Array.isArray(result) ? result : (result?.items ?? result?.data ?? []);
        setTransactions(list);
      } catch {
        setTransactions([]);
      } finally {
        setChartLoading(false);
      }
    };
    fetchTransactions();
  }, [budget?.id]);

  // Build cumulative sparkline from real expense transactions
  const sparklineData = useMemo(() => {
    if (!startDate || !endDate || transactions.length === 0) return [];

    const expenses = transactions.filter((t: any) => {
      const type = String(t.type || t.transaction_type || t.name || '').toUpperCase();
      const amount = Number(t.amount ?? 0);
      return type === 'EXPENSE' || type === '02' || amount < 0;
    });

    if (expenses.length === 0) {
      // Fallback: no matching expense transactions but we do have a spent value
      // → draw a straight line from 0 to spent at today's position
      if (spent > 0) {
        const today = now > endDate ? endDate : now;
        const todayIdx = daysBetween(startDate, today);
        return [
          { day: 0, amount: 0 },
          { day: todayIdx, amount: spent },
        ];
      }
      return [];
    }

    const dayMap: Record<number, number> = {};
    expenses.forEach((t: any) => {
      const tDate = new Date(t.recorded_at || t.transaction_date || t.created_at);
      const dayIdx = daysBetween(startDate, tDate);
      dayMap[dayIdx] = (dayMap[dayIdx] || 0) + Math.abs(Number(t.amount ?? 0));
    });

    // Cumulative from day 0 → today (capped at endDate)
    const today = now > endDate ? endDate : now;
    const totalDayCount = daysBetween(startDate, today);
    const points: { day: number; amount: number }[] = [];
    let cumulative = 0;
    for (let i = 0; i <= totalDayCount; i++) {
      cumulative += dayMap[i] || 0;
      points.push({ day: i, amount: cumulative });
    }

    // ── Normalize: pin the final point to budget.spent ──────────────────────
    // Transactions summed independently may differ from the authoritative
    // spent value on the budget object (rounding, type filters, etc.).
    // Scale all points proportionally so the curve shape is preserved
    // but the endpoint always matches reality.
    const rawTotal = points[points.length - 1]?.amount ?? 0;
    if (rawTotal > 0 && Math.abs(rawTotal - spent) > 1) {
      const scale = spent / rawTotal;
      return points.map(p => ({ day: p.day, amount: p.amount * scale }));
    }

    return points;
  }, [transactions, startDate, endDate]);

  const handleDeleteBudget = () => {
    setShowMenu(false);
    showNotification(
      t('event.confirm_delete', { title: budget.categoryName || t('budget.detail.default_budget_name') }),
      'warning',
      undefined,
      undefined,
      async () => {
        const budgetId = budget.budget_id || budget.wallet_budget_id || budget.id;
        if (budgetId) {
          const res = await deleteBudget(Number(budgetId));
          if (res.isSuccess()) {
            showNotification(t('budget.success_delete', { defaultValue: 'Xóa ngân sách thành công' }), 'success');
            router.back();
          } else {
            showNotification(res.getError() || t('budget.error_delete', { defaultValue: 'Xóa ngân sách thất bại' }), 'error');
          }
        }
      }
    );
  };

  const handleEdit = () => {
    setShowMenu(false);
    router.push({
      pathname: '/(protected)/budget/edit-budget',
      params: {
        autofillData: JSON.stringify({
          budget_id: budget.budget_id || budget.wallet_budget_id || budget.id,
          amount: total,
          walletId: Number(budget.wallet_id),
          category: {
            id: budget.category_id,
            category_id: budget.category_id,
            category_code: budget.category_code,
            category_name: budget.categoryName || budget.category_name,
            category_type: budget.category_type || 'EXPENSE',
            icon: budget.icon,
            color: budget.iconColor,
          },
          startDate: budget.start_date,
          endDate: budget.end_date,
          periodType: budget.period_type,
          note: budget.note,
          includeInReport: budget.include_in_report,
          autoRepeat: budget.is_auto_repeat,
        }),
        isEdit: 'true',
      },
    });
  };

  const handleGoToTransactions = () => {
    setShowMenu(false);
    router.push({
      pathname: '/(protected)/budget/budget-transactions',
      params: {
        budgetId: budget.budget_id || budget.wallet_budget_id || budget.id,
        walletId: budget.wallet_id,
        categoryName: budget.categoryName || budget.category_name || t('budget.detail.default_budget_name'),
        fromDate: budget.start_date,
        toDate: budget.end_date,
      },
    });
  };

  const MenuDropdown = () => {
    if (!showMenu) return null;
    return (
      <View style={[styles.menuDropdown, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
          <FontAwesome6 name="pen-to-square" size={normalize(15)} color={colors.text} />
          <CustomText style={[styles.menuItemText, { color: colors.text }]}>{t('common.edit')}</CustomText>
        </TouchableOpacity>
        <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={handleGoToTransactions}>
          <FontAwesome6 name="list-ul" size={normalize(15)} color={colors.text} />
          <CustomText style={[styles.menuItemText, { color: colors.text }]}>{t('budget.detail.transaction_list')}</CustomText>
        </TouchableOpacity>
        <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.menuItem} onPress={handleDeleteBudget}>
          <FontAwesome6 name="trash-can" size={normalize(15)} color="#EF4444" />
          <CustomText style={[styles.menuItemText, { color: '#EF4444' }]}>{t('common.delete')}</CustomText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={t('budget.detail.title')}
        rightComponent={
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            style={{ width: normalize(40), height: normalize(40), alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <FontAwesome6 name="ellipsis-vertical" size={normalize(20)} color={colors.text} />
          </TouchableOpacity>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── 1. Budget Header Card ─────────────────────────────────────────────── */}
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.categoryRow}>
            <View style={[styles.iconCircle, { backgroundColor: accentColor + '22' }]}>
              <FontAwesome6 name={budget.icon || 'wallet'} size={normalize(24)} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText style={[styles.categoryName, { color: colors.text }]}>
                {budget.categoryName || t('budget.detail.default_budget_name')}
              </CustomText>
              {budget.note ? (
                <CustomText style={[styles.noteText, { color: colors.icon }]} numberOfLines={1}>
                  {budget.note}
                </CustomText>
              ) : null}
            </View>
            {isOverBudget && (
              <View style={styles.overBadge}>
                <CustomText style={styles.overBadgeText}>{t('budget.detail.over_limit')}</CustomText>
              </View>
            )}
          </View>

          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: progressFillColor }]} />
          </View>
          <CustomText style={[styles.progressPercent, { color: colors.icon }]}>
            {percentage.toFixed(1)}{t('budget.detail.used_label')}
          </CustomText>

          <View style={[styles.amountRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.amountBlock}>
              <CustomText style={[styles.amountLabel, { color: colors.icon }]}>{t('budget.total_budget')}</CustomText>
              <CustomText style={[styles.amountValue, { color: colors.text }]}>{formatAmount(total)}</CustomText>
            </View>
            <View style={[styles.amountDivider, { backgroundColor: colors.border }]} />
            <View style={styles.amountBlock}>
              <CustomText style={[styles.amountLabel, { color: colors.icon }]}>{t('budget.total_spent')}</CustomText>
              <CustomText style={[styles.amountValue, { color: isOverBudget ? '#FF6B6B' : colors.text }]}>
                {formatAmount(spent)}
              </CustomText>
            </View>
            <View style={[styles.amountDivider, { backgroundColor: colors.border }]} />
            <View style={styles.amountBlock}>
              <CustomText style={[styles.amountLabel, { color: colors.icon }]}>{t('budget.detail.remaining')}</CustomText>
              <CustomText style={[styles.amountValue, { color: remaining >= 0 ? '#27AE60' : '#FF6B6B' }]}>
                {formatAmount(remaining)}
              </CustomText>
            </View>
          </View>
        </View>

        {/* ── 2. Budget Info Card ───────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>{t('budget.detail.info_title')}</CustomText>
          <View style={styles.infoGrid}>
            <InfoRow icon="calendar-day" label={t('budget.detail.start_date')}
              value={startDate ? formatDate(budget.start_date) : '—'}
              iconBg={colors.tint + '18'} iconColor={colors.tint}
              textColor={colors.text} subColor={colors.icon} />
            <InfoRow icon="calendar-check" label={t('budget.detail.end_date')}
              value={endDate ? formatDate(budget.end_date) : '—'}
              iconBg={colors.tint + '18'} iconColor={colors.tint}
              textColor={colors.text} subColor={colors.icon} />
            <InfoRow icon="hourglass-half" label={t('budget.detail.days_remaining_label')}
              value={`${daysLeft} ${t('budget.detail.days_unit')}`}
              iconBg={daysLeft <= 3 ? '#FF6B6B18' : colors.tint + '18'}
              iconColor={daysLeft <= 3 ? '#FF6B6B' : colors.tint}
              textColor={colors.text} subColor={colors.icon} />
            <InfoRow icon={walletObj?.icon || 'wallet'} label={t('budget.detail.wallet')}
              value={displayWalletName}
              iconBg={colors.tint + '18'} iconColor={colors.tint}
              textColor={colors.text} subColor={colors.icon} />
          </View>
        </View>

        {/* ── 3. Spending Chart ─────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header + legend */}
          <View style={styles.chartHeader}>
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>{t('budget.detail.spending_trend')}</CustomText>
            <View style={styles.legendRow}>
              {/* Solid line legend */}
              <View style={[styles.legendLine, { backgroundColor: colors.tint }]} />
              <CustomText style={[styles.legendLabel, { color: colors.icon }]}>{t('budget.detail.actual')}</CustomText>
              {/* Dashed line legend */}
              <View style={styles.legendDashedContainer}>
                <View style={[styles.legendDash, { backgroundColor: colors.tint }]} />
                <View style={[styles.legendDashGap]} />
                <View style={[styles.legendDash, { backgroundColor: colors.tint }]} />
              </View>
              <CustomText style={[styles.legendLabel, { color: colors.icon }]}>{t('budget.detail.prediction')}</CustomText>
              {/* Budget limit legend */}
              <View style={[styles.legendLine, { backgroundColor: '#FF6B6B' }]} />
              <CustomText style={[styles.legendLabel, { color: colors.icon }]}>{t('budget.detail.limit')}</CustomText>
            </View>
          </View>

          {/* Chart */}
          <View style={{ marginTop: normalize(8) }}>
            {chartLoading ? (
              <View style={{ height: normalize(170), alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color={colors.tint} />
              </View>
            ) : (
              <SparklineChart
                data={sparklineData}
                lineColor={colors.tint}
                totalBudget={total}
                maxDay={totalDays}
                projectionAmount={estimatedTotal}
              />
            )}
          </View>

          {/* X-axis labels: Đầu kì — Hôm nay — Cuối kì */}
          <View style={styles.chartAxisRow}>
            <CustomText style={[styles.axisLabel, { color: colors.icon }]}>
              {startDate ? formatDate(budget.start_date) : t('budget.detail.start_period')}
            </CustomText>
            <CustomText style={[styles.axisLabelToday, { color: colors.tint }]}>
              {t('budget.detail.today_dot')}
            </CustomText>
            <CustomText style={[styles.axisLabel, { color: colors.icon }]}>
              {endDate ? formatDate(budget.end_date) : t('budget.detail.end_period')}
            </CustomText>
          </View>
        </View>

        {/* ── 4. Daily Recommendation ─────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.recommendRow}>
            <View style={[styles.recommendIcon, { backgroundColor: colors.tint + '20' }]}>
              <FontAwesome6 name="lightbulb" size={normalize(18)} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText style={[styles.recommendTitle, { color: colors.icon }]}>
                {t('budget.detail.daily_recommended')}
              </CustomText>
              <CustomText style={[styles.recommendAmount, { color: colors.text }]}>
                <CustomText style={{ color: colors.tint }}>{formatAmount(Math.round(dailyRecommended))}</CustomText>{t('budget.detail.per_day')}
              </CustomText>
              <CustomText style={[styles.recommendSub, { color: colors.icon }]}>
                {t('budget.detail.days_left_prefix')} {daysLeft} {t('budget.detail.days_left_suffix')}
              </CustomText>
            </View>
          </View>
        </View>

        {/* ── 5. Status Summary ─────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>{t('budget.detail.status_summary')}</CustomText>
          <View style={styles.summaryGrid}>
            <SummaryBlock label={t('budget.detail.estimated_spending')}
              value={formatAmount(Math.round(estimatedTotal))} icon="chart-line"
              iconBg="#F39C1218" iconColor="#F39C12"
              textColor={colors.text} subColor={colors.icon} note={t('budget.detail.current_pace')} />
            <SummaryBlock label={t('budget.detail.actual_spending')}
              value={formatAmount(spent)} icon="receipt"
              iconBg={isOverBudget ? '#FF6B6B18' : colors.tint + '18'}
              iconColor={isOverBudget ? '#FF6B6B' : colors.tint}
              textColor={colors.text} subColor={colors.icon} note={`${percentage.toFixed(1)}%`} />
            <SummaryBlock label={t('budget.detail.remaining_budget_label')}
              value={formatAmount(Math.abs(remaining))} icon="piggy-bank"
              iconBg={remaining >= 0 ? '#27AE6018' : '#FF6B6B18'}
              iconColor={remaining >= 0 ? '#27AE60' : '#FF6B6B'}
              textColor={colors.text} subColor={colors.icon} note={remaining < 0 ? t('budget.detail.over_budget') : t('budget.detail.safe')} />
          </View>
        </View>

        {/* ── 6. Transaction List Button ────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.transactionBtn, { backgroundColor: colors.tint }]}
          onPress={() =>
            router.push({
              pathname: '/(protected)/budget/budget-transactions',
              params: {
                budgetId: budget.id || budget.budget_id,
                walletId: budget.wallet_id,
                categoryName: budget.categoryName || budget.category_name || t('budget.detail.default_budget_name'),
                fromDate: budget.start_date,
                toDate: budget.end_date,
              },
            })
          }
          activeOpacity={0.85}
        >
          <FontAwesome6 name="list" size={normalize(18)} color="#fff" />
          <CustomText style={styles.transactionBtnText}>{t('budget.detail.transaction_list')}</CustomText>
          <FontAwesome6 name="chevron-right" size={normalize(14)} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={{ height: hp(6) }} />
      </ScrollView>

      {showMenu && (
        <Pressable
          style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
          onPress={() => setShowMenu(false)}
        />
      )}

      <MenuDropdown />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: hp(2) },

  headerCard: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    borderRadius: normalize(20),
    padding: normalize(20),
    borderWidth: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(14),
    marginBottom: normalize(16),
  },
  iconCircle: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { fontSize: normalize(18), fontWeight: '700', marginBottom: normalize(2) },
  noteText: { fontSize: normalize(13) },
  overBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: normalize(8),
  },
  overBadgeText: { color: '#fff', fontSize: normalize(11), fontWeight: '700' },
  progressBarBg: { height: normalize(8), borderRadius: normalize(4), marginBottom: normalize(6), overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: normalize(4) },
  progressPercent: { fontSize: normalize(12), marginBottom: normalize(14) },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(8),
  },
  amountBlock: { flex: 1, alignItems: 'center' },
  amountDivider: { width: 1, height: normalize(32) },
  amountLabel: { fontSize: normalize(11), marginBottom: normalize(4) },
  amountValue: { fontSize: normalize(15), fontWeight: '700' },

  card: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    borderRadius: normalize(16),
    padding: normalize(16),
    borderWidth: 1,
  },
  sectionTitle: { fontSize: normalize(15), fontWeight: '600', marginBottom: normalize(12) },

  infoGrid: { gap: normalize(12) },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: normalize(12) },
  infoIconBox: { width: normalize(36), height: normalize(36), borderRadius: normalize(10), alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: normalize(11), marginBottom: normalize(1) },
  infoValue: { fontSize: normalize(14), fontWeight: '600' },

  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(4) },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: normalize(4) },
  legendLine: { width: normalize(14), height: normalize(2.5), borderRadius: normalize(2) },
  legendDashedContainer: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  legendDash: { width: normalize(5), height: normalize(2.5), borderRadius: normalize(1) },
  legendDashGap: { width: normalize(3) },
  legendLabel: { fontSize: normalize(10), marginRight: normalize(5) },
  chartAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(6),
    paddingHorizontal: normalize(2),
  },
  axisLabel: { fontSize: normalize(10) },
  axisLabelToday: { fontSize: normalize(10), fontWeight: '600' },

  recommendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: normalize(14) },
  recommendIcon: { width: normalize(40), height: normalize(40), borderRadius: normalize(12), alignItems: 'center', justifyContent: 'center', marginTop: normalize(2) },
  recommendTitle: { fontSize: normalize(12), fontWeight: '500', marginBottom: normalize(4) },
  recommendAmount: { fontSize: normalize(20), fontWeight: '700', marginBottom: normalize(2) },
  recommendSub: { fontSize: normalize(12), lineHeight: normalize(18) },

  summaryGrid: { flexDirection: 'row', gap: normalize(10) },
  summaryBlock: { flex: 1, alignItems: 'center' },
  summaryIconBox: { width: normalize(44), height: normalize(44), borderRadius: normalize(14), alignItems: 'center', justifyContent: 'center', marginBottom: normalize(8) },
  summaryLabel: { fontSize: normalize(11), textAlign: 'center', marginBottom: normalize(4) },
  summaryValue: { fontSize: normalize(12), fontWeight: '700', textAlign: 'center', marginBottom: normalize(2) },
  summaryNote: { fontSize: normalize(10), textAlign: 'center' },

  transactionBtn: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    borderRadius: normalize(16),
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(20),
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  transactionBtnText: { flex: 1, color: '#fff', fontSize: normalize(16), fontWeight: '600' },

  // Menu dropdown (matching transaction detail pattern)
  menuDropdown: {
    position: 'absolute', top: hp(8), right: wp(5),
    borderRadius: normalize(14), paddingVertical: normalize(6),
    minWidth: normalize(180),
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12,
    elevation: 8, zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: normalize(16), paddingVertical: normalize(12), gap: normalize(12),
  },
  menuItemText: { fontSize: normalize(14), fontFamily: Fonts.medium },
  menuDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: normalize(12) },
});

export default BudgetDetailScreen;