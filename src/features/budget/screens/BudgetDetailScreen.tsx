import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useTransaction } from '@/features/transaction/hooks/useTransaction';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, LinearGradient, Path, Polyline, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────────
const formatMoney = (n: number, currency: string = 'đ') => `${n.toLocaleString('vi-VN')} ${currency}`;

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

const SparklineChart: React.FC<SparklineProps> = ({ data, lineColor, totalBudget, maxDay: propMaxDay, projectionAmount }) => {
  const CHART_W = SCREEN_WIDTH - wp(10) - normalize(32);
  const CHART_H = normalize(140);
  const PAD = normalize(12);

  if (!data || data.length < 2) {
    return (
      <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
        <CustomText style={{ color: '#888', fontSize: normalize(13) }}>
          Chưa có dữ liệu chi tiêu
        </CustomText>
      </View>
    );
  }

  const maxAmount = Math.max(totalBudget, projectionAmount || 0, ...data.map(d => d.amount));
  const minDay = 0;
  const maxDay = propMaxDay || data[data.length - 1].day || 1;
  const dayRange = maxDay - minDay || 1;

  const toX = (day: number) => PAD + ((day - minDay) / dayRange) * (CHART_W - 2 * PAD);
  const toY = (val: number) => PAD + (1 - val / maxAmount) * (CHART_H - 2 * PAD);

  const points = data.map(d => `${toX(d.day)},${toY(d.amount)}`).join(' ');
  const pathD = data.reduce((acc, d, i) => {
    const x = toX(d.day);
    const y = toY(d.amount);
    return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  }, '');
  const filledPath = `${pathD} L ${toX(data[data.length - 1].day)} ${CHART_H - PAD} L ${toX(minDay)} ${CHART_H - PAD} Z`;
  const limitY = toY(totalBudget);

  // Projection path
  let projectionD = "";
  if (projectionAmount !== undefined && data.length > 0 && maxDay > data[data.length - 1].day) {
    const lastPoint = data[data.length - 1];
    const startX = toX(lastPoint.day);
    const startY = toY(lastPoint.amount);
    const endX = toX(maxDay);
    const endY = toY(projectionAmount);
    projectionD = `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <LinearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lineColor} stopOpacity="0.3" />
          <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Line x1={PAD} y1={limitY} x2={CHART_W - PAD} y2={limitY}
        stroke="#FF6B6B" strokeWidth={1.5} strokeDasharray="5,4" strokeOpacity={0.7} />
      <Path d={filledPath} fill="url(#sparkGrad)" />
      {projectionD ? (
        <Path d={projectionD} fill="none" stroke={lineColor} strokeWidth={2} strokeDasharray="6,4" opacity={0.5} />
      ) : null}
      <Polyline points={points} fill="none" stroke={lineColor}
        strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
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
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();
  const { getWalletById } = useWallet();
  const { advancedSearchTransactions } = useTransaction();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

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
        <AppHeader title="Chi tiết Ngân sách" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <CustomText style={{ color: colors.icon }}>Không tìm thấy thông tin ngân sách</CustomText>
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

  // Resolve wallet name & currency using the hook
  const walletObj = budget.wallet_id ? getWalletById(Number(budget.wallet_id)) : null;
  const currency = walletObj?.currency || 'đ';
  const displayWalletName = budget.walletName || budget.wallet_name || walletObj?.name || (budget.wallet_id === 'all' ? 'Tất cả các ví' : (budget.wallet_id ? `Ví #${budget.wallet_id}` : 'Tất cả các ví'));

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

    // Only expense / debit transactions
    const expenses = transactions.filter((t: any) => {
      const type = String(t.type || t.transaction_type || t.name || '').toUpperCase();
      const amount = Number(t.amount ?? 0);
      return type === 'EXPENSE' || type === '02' || amount < 0;
    });

    if (expenses.length === 0) return [];

    // Group by day index from start_date
    const dayMap: Record<number, number> = {};
    expenses.forEach((t: any) => {
      const tDate = new Date(t.recorded_at || t.transaction_date || t.created_at);
      const dayIdx = daysBetween(startDate, tDate);
      dayMap[dayIdx] = (dayMap[dayIdx] || 0) + Math.abs(Number(t.amount ?? 0));
    });

    // Build cumulative points
    const today = now > endDate ? endDate : now;
    const totalDayCount = daysBetween(startDate, today);
    const points: { day: number; amount: number }[] = [];
    let cumulative = 0;
    for (let i = 0; i <= totalDayCount; i++) {
      cumulative += dayMap[i] || 0;
      points.push({ day: i, amount: cumulative });
    }
    return points;
  }, [transactions, startDate, endDate]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Chi tiết Ngân sách" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── 1. Budget Header Card ─────────────────────────────────────────────── */}
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.categoryRow}>
            {/* Icon nhỏ dùng accentColor làm màu icon, nền mờ */}
            <View style={[styles.iconCircle, { backgroundColor: accentColor + '22' }]}>
              <FontAwesome6 name={budget.icon || 'wallet'} size={normalize(24)} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText style={[styles.categoryName, { color: colors.text }]}>
                {budget.categoryName || 'Ngân sách'}
              </CustomText>
              {budget.note ? (
                <CustomText style={[styles.noteText, { color: colors.icon }]} numberOfLines={1}>
                  {budget.note}
                </CustomText>
              ) : null}
            </View>
            {isOverBudget && (
              <View style={styles.overBadge}>
                <CustomText style={styles.overBadgeText}>Vượt!</CustomText>
              </View>
            )}
          </View>

          {/* Progress bar — fill dùng accentColor, track dùng colors.border */}
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: progressFillColor }]} />
          </View>
          <CustomText style={[styles.progressPercent, { color: colors.icon }]}>
            {percentage.toFixed(1)}% đã sử dụng
          </CustomText>

          {/* Amount row — nền colors.background, text theo theme */}
          <View style={[styles.amountRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.amountBlock}>
              <CustomText style={[styles.amountLabel, { color: colors.icon }]}>Tổng ngân sách</CustomText>
              <CustomText style={[styles.amountValue, { color: colors.text }]}>{formatMoney(total, currency)}</CustomText>
            </View>
            <View style={[styles.amountDivider, { backgroundColor: colors.border }]} />
            <View style={styles.amountBlock}>
              <CustomText style={[styles.amountLabel, { color: colors.icon }]}>Đã chi</CustomText>
              <CustomText style={[styles.amountValue, { color: isOverBudget ? '#FF6B6B' : colors.text }]}>
                {formatMoney(spent, currency)}
              </CustomText>
            </View>
            <View style={[styles.amountDivider, { backgroundColor: colors.border }]} />
            <View style={styles.amountBlock}>
              <CustomText style={[styles.amountLabel, { color: colors.icon }]}>Còn lại</CustomText>
              <CustomText style={[styles.amountValue, { color: remaining >= 0 ? '#27AE60' : '#FF6B6B' }]}>
                {formatMoney(remaining, currency)}
              </CustomText>
            </View>
          </View>
        </View>

        {/* ── 2. Budget Info Card ───────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>Thông tin ngân sách</CustomText>
          <View style={styles.infoGrid}>
            <InfoRow icon="calendar-day" label="Ngày bắt đầu"
              value={startDate ? formatDate(budget.start_date) : '—'}
              iconBg={colors.tint + '18'} iconColor={colors.tint}
              textColor={colors.text} subColor={colors.icon} />
            <InfoRow icon="calendar-check" label="Ngày kết thúc"
              value={endDate ? formatDate(budget.end_date) : '—'}
              iconBg={colors.tint + '18'} iconColor={colors.tint}
              textColor={colors.text} subColor={colors.icon} />
            <InfoRow icon="hourglass-half" label="Thời gian còn lại"
              value={`${daysLeft} ngày`}
              iconBg={daysLeft <= 3 ? '#FF6B6B18' : colors.tint + '18'}
              iconColor={daysLeft <= 3 ? '#FF6B6B' : colors.tint}
              textColor={colors.text} subColor={colors.icon} />
            <InfoRow icon={walletObj?.icon || "wallet"} label="Ví"
              value={displayWalletName}
              iconBg={colors.tint + '18'} iconColor={colors.tint}
              textColor={colors.text} subColor={colors.icon} />
          </View>
        </View>

        {/* ── 3. Spending Chart ─────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>Xu hướng chi tiêu</CustomText>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
              <CustomText style={[styles.legendLabel, { color: colors.icon }]}>Chi tiêu</CustomText>
              <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
              <CustomText style={[styles.legendLabel, { color: colors.icon }]}>Giới hạn</CustomText>
            </View>
          </View>
          <View style={{ marginTop: normalize(8) }}>
            {chartLoading ? (
              <View style={{ height: normalize(140), alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color={colors.tint} />
              </View>
            ) : (
              <SparklineChart data={sparklineData} lineColor={colors.tint} totalBudget={total} maxDay={totalDays} projectionAmount={estimatedTotal} />
            )}
          </View>
          <View style={styles.chartAxisRow}>
            <CustomText style={[styles.axisLabel, { color: colors.icon }]}>
              {startDate ? formatDate(budget.start_date) : 'Bắt đầu'}
            </CustomText>
            <CustomText style={[styles.axisLabel, { color: colors.icon }]}>
              {endDate ? formatDate(budget.end_date) : 'Kết thúc'}
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
                Mức chi tiêu khuyến nghị
              </CustomText>
              <CustomText style={[styles.recommendAmount, { color: colors.text }]}>
                <CustomText style={{ color: colors.tint }}>{formatMoney(Math.round(dailyRecommended), currency)}</CustomText> / ngày
              </CustomText>
              <CustomText style={[styles.recommendSub, { color: colors.icon }]}>
                Để không vượt quá ngân sách trong {daysLeft} ngày còn lại
              </CustomText>
            </View>
          </View>
        </View>

        {/* ── 5. Status Summary ─────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>Tóm tắt trạng thái</CustomText>
          <View style={styles.summaryGrid}>
            <SummaryBlock label="Chi tiêu dự kiến"
              value={formatMoney(Math.round(estimatedTotal), currency)} icon="chart-line"
              iconBg="#F39C1218" iconColor="#F39C12"
              textColor={colors.text} subColor={colors.icon} note="Tốc độ hiện tại" />
            <SummaryBlock label="Chi tiêu thực tế"
              value={formatMoney(spent, currency)} icon="receipt"
              iconBg={isOverBudget ? '#FF6B6B18' : colors.tint + '18'}
              iconColor={isOverBudget ? '#FF6B6B' : colors.tint}
              textColor={colors.text} subColor={colors.icon} note={`${percentage.toFixed(1)}%`} />
            <SummaryBlock label="Ngân sách còn lại"
              value={formatMoney(Math.abs(remaining), currency)} icon="piggy-bank"
              iconBg={remaining >= 0 ? '#27AE6018' : '#FF6B6B18'}
              iconColor={remaining >= 0 ? '#27AE60' : '#FF6B6B'}
              textColor={colors.text} subColor={colors.icon} note={remaining < 0 ? 'Đã vượt' : 'An toàn'} />
          </View>
        </View>

        {/* ── 6. Transaction List Button — dùng colors.tint chuẩn app ─────────── */}
        <TouchableOpacity
          style={[styles.transactionBtn, { backgroundColor: colors.tint }]}
          onPress={() =>
            router.push({
              pathname: '/(protected)/budget/budget-transactions',
              params: {
                budgetId: budget.id || budget.budget_id,
                walletId: budget.wallet_id,
                categoryName: budget.categoryName || budget.category_name || 'Ngân sách',
                fromDate: budget.start_date,
                toDate: budget.end_date,
              },
            })
          }
          activeOpacity={0.85}
        >
          <FontAwesome6 name="list" size={normalize(18)} color="#fff" />
          <CustomText style={styles.transactionBtnText}>Danh sách giao dịch</CustomText>
          <FontAwesome6 name="chevron-right" size={normalize(14)} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={{ height: hp(6) }} />
      </ScrollView>
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
  categoryName: {
    fontSize: normalize(18),
    fontWeight: '700',
    marginBottom: normalize(2),
  },
  noteText: { fontSize: normalize(13) },
  overBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: normalize(8),
  },
  overBadgeText: { color: '#fff', fontSize: normalize(11), fontWeight: '700' },
  progressBarBg: {
    height: normalize(8),
    borderRadius: normalize(4),
    marginBottom: normalize(6),
    overflow: 'hidden',
  },
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
  infoIconBox: {
    width: normalize(36), height: normalize(36),
    borderRadius: normalize(10), alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: normalize(11), marginBottom: normalize(1) },
  infoValue: { fontSize: normalize(14), fontWeight: '600' },

  chartHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: normalize(4),
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: normalize(4) },
  legendDot: { width: normalize(8), height: normalize(8), borderRadius: normalize(4) },
  legendLabel: { fontSize: normalize(11), marginRight: normalize(6) },
  chartAxisRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: normalize(4), paddingHorizontal: normalize(6),
  },
  axisLabel: { fontSize: normalize(11) },

  recommendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: normalize(14) },
  recommendIcon: {
    width: normalize(40), height: normalize(40),
    borderRadius: normalize(12), alignItems: 'center', justifyContent: 'center',
    marginTop: normalize(2),
  },
  recommendTitle: { fontSize: normalize(12), fontWeight: '500', marginBottom: normalize(4) },
  recommendAmount: { fontSize: normalize(20), fontWeight: '700', marginBottom: normalize(2) },
  recommendSub: { fontSize: normalize(12), lineHeight: normalize(18) },

  summaryGrid: { flexDirection: 'row', gap: normalize(10) },
  summaryBlock: { flex: 1, alignItems: 'center' },
  summaryIconBox: {
    width: normalize(44), height: normalize(44),
    borderRadius: normalize(14), alignItems: 'center', justifyContent: 'center',
    marginBottom: normalize(8),
  },
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
});

export default BudgetDetailScreen;
