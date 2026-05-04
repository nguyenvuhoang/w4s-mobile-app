import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import WalletPickerModal, { WalletPickerId } from '@/components/modals/WalletPickerModal';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useBudget } from '@/features/budget/hooks/useBudget';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useCategory } from '@/hooks/useCategory';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { WalletSummary } from '@/types/wallet';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

interface BudgetScreenProps {
  navigation?: any;
}

const BudgetScreen: React.FC<BudgetScreenProps> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { wallets, defaultWallet } = useWallet();

  // 'all' = tất cả các ví, number = walletId cụ thể
  const [selectedWalletId, setSelectedWalletId] = useState<WalletPickerId>('all');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('this_week');

  const periods = [
    { key: 'this_week', label: t('budget.this_week') },
    { key: 'this_month', label: t('budget.this_month') },
    { key: 'this_quarter', label: t('budget.this_quarter') },
    { key: 'this_year', label: t('budget.this_year') },
  ];

  const { categories, loading: categoryLoading, refetch: fetchCategories } = useCategory({ autoFetch: false });
  const { fetchBudgetSummary, budgetSummary, summaryLoading, advancedSearchBudgets } = useBudget();
  const { convertBetween, formatAmount, isReady: converterReady, loading: converterLoading, defaultCurrency } = useCurrencyConverter();
  const [budgetList, setBudgetList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [firstLoaded, setFirstLoaded] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [])

  useFocusEffect(
    useCallback(() => {
      const apiPeriodType = selectedPeriod.replace('this_', '').toUpperCase();
      const walletId = selectedWalletId === 'all' ? 0 : Number(selectedWalletId);

      const loadData = async () => {
        setListLoading(true);
        const summary = await fetchBudgetSummary(walletId, apiPeriodType);

        if (!summary || summary.total_budget === 0) {
          setBudgetList([]);
          setListLoading(false);
          setFirstLoaded(true);
          return;
        }

        const res = await advancedSearchBudgets({
          wallet_id: walletId,
          period_type: apiPeriodType,
          page_index: 1,
          page_size: 99
        });
        setBudgetList(res || []);
        setListLoading(false);
        setFirstLoaded(true);
      };

      loadData();
    }, [selectedWalletId, selectedPeriod, fetchBudgetSummary, advancedSearchBudgets])
  );

  const displayBudgets = useMemo(() => {
    return budgetList.map(item => {
      const cat = categories.find(c => c.id === item.category_id);

      let todayProgress = 0;
      if (item.start_date && item.end_date) {
        const start = new Date(item.start_date).getTime();
        const end = new Date(item.end_date).getTime();
        const now = new Date().getTime();
        if (now >= end) todayProgress = 100;
        else if (now > start && end > start) {
          todayProgress = ((now - start) / (end - start)) * 100;
        }
      }

      let categoryName = cat?.category_name || t('budget.unknown_category') || 'Danh mục';
      try {
        if (cat?.category_name && cat.category_name.startsWith('{')) {
          const nameObj = JSON.parse(cat.category_name);
          categoryName = nameObj[i18n.language] || nameObj['en'] || nameObj['vi'] || cat.category_name;
        }
      } catch (e) {
        // ignore
      }

      const itemCurrency = (item.currency_code || item.currency || item.ccyid || 'VND').toUpperCase();
      const userCurrency = (defaultCurrency.currencyId || 'VND').toUpperCase();

      let spent = item.used_amount ?? 0;
      let total = item.amount ?? 0;

      if (converterReady && itemCurrency !== userCurrency) {
        const convSpent = convertBetween(spent, itemCurrency, userCurrency);
        const convTotal = convertBetween(total, itemCurrency, userCurrency);
        if (convSpent !== null && convSpent !== undefined) spent = convSpent;
        if (convTotal !== null && convTotal !== undefined) total = convTotal;
      }

      return {
        id: item.id?.toString() || Math.random().toString(),
        categoryName,
        note: item.note || '',
        icon: cat?.icon || 'wallet',
        iconColor: cat?.color || colors.tint,
        spent,
        total,
        todayProgress,
        currency: itemCurrency,
        // raw fields for detail screen
        category_id: item.category_id,
        category_type: cat?.category_type || item.category_type,
        category_code: cat?.category_code || item.category_code,
        start_date: item.start_date,
        end_date: item.end_date,
        wallet_id: item.wallet_id,
        wallet_name: item.wallet_name,
        period_type: item.period_type,
        source_tracker: item.source_tracker,
        budget_id: item.budget_id || item.wallet_budget_id || item.id,
      };
    });
  }, [budgetList, categories, colors.tint, t, i18n.language, converterReady, defaultCurrency.currencyId, convertBetween]);

  const { totalBudget, totalSpent, remaining, daysLeft } = useMemo(() => {
    // Calculate total from displayBudgets which are already converted to userCurrency
    const tBudget = displayBudgets.reduce((acc, b) => acc + b.total, 0);
    const tSpent = displayBudgets.reduce((acc, b) => acc + b.spent, 0);

    return {
      totalBudget: tBudget,
      totalSpent: tSpent,
      remaining: tBudget - tSpent,
      daysLeft: budgetSummary?.days_left ?? 0,
    };
  }, [displayBudgets, budgetSummary]);

  // Calculate semi-circle progress
  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const isOverBudget = percentage > 100;
  const displayPercentage = Math.min(percentage, 100);
  const radius = wp(35);
  const strokeWidth = normalize(18);
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * displayPercentage) / 100;


  const selectedWallet = useMemo<WalletSummary | null>(() => {
    if (selectedWalletId === 'all') return null;
    return wallets.find((w) => w.walletId === selectedWalletId) ?? null;
  }, [selectedWalletId, wallets]);

  const handleCreateBudget = () => {
    const periodMap: Record<string, string> = {
      'this_week': 'THIS_WEEK',
      'this_month': 'THIS_MONTH',
      'this_quarter': 'THIS_QUARTER',
      'this_year': 'THIS_YEAR',
    };

    const autofillData = {
      walletId: selectedWalletId === 'all' ? 0 : Number(selectedWalletId),
      period: periodMap[selectedPeriod],
    };

    router.push({
      pathname: '/(protected)/budget/create-budget',
      params: { autofillData: JSON.stringify(autofillData) },
    });
  };

  const handleBudgetItemPress = (budget: any) => {
    router.push({
      pathname: '/(protected)/budget/budget-detail',
      params: { budget: JSON.stringify(budget) },
    });
  };

  const handleWalletSelect = (walletId: WalletPickerId) => {
    setSelectedWalletId(walletId);
    setShowWalletModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <AppHeader
        title={t("budget.title") || "Ngân sách"}
        variant="gradient"
        showBackButton={false}
      />
      <ScrollView showsVerticalScrollIndicator={false} style={{ paddingTop: normalize(25) }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateBudget}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              <CustomText type="semiBold" style={styles.createButtonText}>{t("budget.create_budget")}</CustomText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerRightWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => setShowWalletModal(true)}
          >
            <View style={styles.cashBadge}>
              <FontAwesome6
                name={selectedWalletId === 'all' ? 'layer-group' : (selectedWallet?.icon as any ?? 'wallet')}
                size={normalize(16)}
                color={selectedWalletId === 'all' ? colors.tint : (selectedWallet?.color || colors.tint)}
              />
              <CustomText style={styles.cashText}>
                {selectedWalletId === 'all' ? t('wallet.all_wallets') : (selectedWallet?.name || t('wallet.select_wallet'))}
              </CustomText>
            </View>
            <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />
            <View style={styles.dropdownButton}>
              <FontAwesome6 name="chevron-down" size={normalize(14)} color={colors.tint} />
            </View>
          </TouchableOpacity>

          {/* Wallet Picker Modal */}
          <WalletPickerModal
            visible={showWalletModal}
            wallets={wallets}
            selectedId={selectedWalletId}
            onSelect={handleWalletSelect}
            showAllOption={true}
            onClose={() => setShowWalletModal(false)}
          />
        </View>

        {/* Period Selector Card */}
        <View style={[styles.periodCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodContent}
          >
            {periods.map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: selectedPeriod === period.key ? 'transparent' : 'transparent',
                  },
                ]}
                onPress={() => setSelectedPeriod(period.key)}
              >
                {selectedPeriod === period.key ? (
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.periodGradient}
                  >
                    <CustomText style={[styles.periodText, { color: '#fff' }]}>
                      {period.label}
                    </CustomText>
                  </LinearGradient>
                ) : (
                  <View style={styles.periodInner}>
                    <CustomText
                      style={[
                        styles.periodText,
                        { color: colors.icon },
                      ]}
                    >
                      {period.label}
                    </CustomText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content Area Rendering Logic */}
        {(!firstLoaded || summaryLoading || listLoading || categoryLoading || converterLoading) ? (
          <>
            {/* Loading Skeletons */}
            <View style={[styles.circleCard, { backgroundColor: colors.card }]}>
              <View style={{ paddingVertical: normalize(40) }}>
                <ActivityIndicator size="large" color={colors.tint} />
              </View>
            </View>
            <View style={styles.budgetList}>
              <View style={{ paddingVertical: normalize(20) }}>
                <ActivityIndicator size="small" color={colors.tint} />
              </View>
            </View>
          </>
        ) : budgetList.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <CustomText type="bold" style={[styles.emptyTitle, { color: colors.text }]}>
              {t("budget.no_budget_created", "Chưa có Ngân sách nào được tạo")}
            </CustomText>
            <CustomText style={[styles.emptySubtitle, { color: colors.icon }]}>
              {t("budget.create_budget_prompt", "Hãy tạo ngân sách ngay để quản lý chi tiêu hiệu quả hơn")}
            </CustomText>
            <TouchableOpacity
              style={styles.emptyCreateButton}
              onPress={handleCreateBudget}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyGradientBtn}
              >
                <CustomText type="semiBold" style={styles.emptyCreateButtonText}>{t("budget.create_now", "Tạo ngân sách ngay")}</CustomText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Circular Progress Card */}
            <View style={[styles.circleCard, { backgroundColor: colors.card }]}>
              <View style={styles.circleContainer}>
                <Svg
                  width={(radius + strokeWidth) * 2}
                  height={radius + strokeWidth + normalize(20)}
                  style={{ overflow: 'visible' }}
                >
                  {/* Background arc with rounded caps */}
                  <Circle
                    cx={radius + strokeWidth}
                    cy={radius + strokeWidth}
                    r={radius}
                    stroke="#E8EAED"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference * 2}`}
                    strokeLinecap="round"
                    rotation="-180"
                    origin={`${radius + strokeWidth}, ${radius + strokeWidth}`}
                  />
                  {/* Progress arc with rounded caps */}
                  <Circle
                    cx={radius + strokeWidth}
                    cy={radius + strokeWidth}
                    r={radius}
                    stroke={isOverBudget ? "#EF4444" : colors.tint}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference * 2}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-180"
                    origin={`${radius + strokeWidth}, ${radius + strokeWidth}`}
                  />
                </Svg>

                {/* Center text */}
                <View style={styles.circleCenter}>
                  <CustomText style={[styles.circleLabelSmall, { color: colors.icon }]}>
                    {t("budget.remaining_budget")}
                  </CustomText>
                  <CustomText type="bold" style={[styles.circleAmount, { color: isOverBudget ? "#EF4444" : colors.text }]}>
                    {formatAmount(remaining)}
                  </CustomText>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <CustomText style={[styles.statLabel, { color: colors.icon }]}>
                    {t("budget.total_budget")}
                  </CustomText>
                  <CustomText type="semiBold" style={[styles.statValue, { color: colors.text }]}>
                    {formatAmount(totalBudget)}
                  </CustomText>
                </View>

                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

                <View style={styles.statItem}>
                  <CustomText style={[styles.statLabel, { color: colors.icon }]}>
                    {t("budget.total_spent")}
                  </CustomText>
                  <CustomText type="semiBold" style={[styles.statValue, { color: colors.text }]}>
                    {formatAmount(totalSpent)}
                  </CustomText>
                </View>

                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

                <View style={styles.statItem}>
                  <CustomText style={[styles.statLabel, { color: colors.icon }]}>
                    {t("budget.days_left")}
                  </CustomText>
                  <CustomText type="semiBold" style={[styles.statValue, { color: colors.text }]}>
                    {daysLeft} {t("budget.days")}
                  </CustomText>
                </View>
              </View>
            </View>

            {/* Budget List - Separated Cards */}
            <View style={styles.budgetList}>
              {displayBudgets.map((budget) => (
                <BudgetItem
                  key={budget.id}
                  budget={budget}
                  colors={colors}
                  onPress={() => handleBudgetItemPress(budget)}
                  formatAmount={formatAmount}
                />
              ))}
            </View>
          </>
        )}

        {/* Bottom spacing for tab bar */}
        <View style={{ height: hp(12) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Budget Item Component
const BudgetItem = ({ budget, colors, onPress, formatAmount }: any) => {
  const { t } = useTranslation();
  const percentage = (budget.spent / budget.total) * 100;
  const isOverBudget = percentage > 100;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.budgetItem,
        {
          backgroundColor: colors.card,
          borderColor: isOverBudget ? '#EF444450' : colors.border,
          borderWidth: 1,
        }
      ]}
    >
      {/* Top section: Icon, Info and Amounts */}
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View
            style={[
              styles.budgetIconWrapper,
              { backgroundColor: budget.iconColor + '15' },
            ]}
          >
            <FontAwesome6 name={budget.icon as any} size={normalize(18)} color={budget.iconColor} />
          </View>

          <View style={styles.budgetInfo}>
            <CustomText style={[styles.budgetCategory, { color: colors.text }]} numberOfLines={1}>
              {budget.categoryName}
            </CustomText>
            <CustomText style={[styles.budgetSubcategory, { color: colors.icon }]} numberOfLines={1}>
              {budget.note || t('common.no_note', 'Không có ghi chú')}
            </CustomText>
          </View>
        </View>

        <View style={styles.budgetRight}>
          <CustomText style={[styles.budgetSpentText, { color: colors.text }]}>
            {formatAmount(budget.spent)}
          </CustomText>
        </View>
      </View>

      {/* Middle section: Progress bar and Today marker */}
      <View style={styles.progressSection}>
        <View style={[styles.progressBarBase, { backgroundColor: colors.border + '40' }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isOverBudget ? '#EF4444' : budget.iconColor,
              },
            ]}
          />
        </View>

        {/* Today Marker */}
        <View
          style={[
            styles.todayMarkerWrapper,
            { left: `${Math.min(budget.todayProgress, 100)}%` }
          ]}
        >
          <View style={[styles.todayMarkerLine, { backgroundColor: colors.text }]} />
          <CustomText type="semiBold" style={[styles.todayMarkerLabel, { color: colors.text }]}>
            {t("home.today")}
          </CustomText>
        </View>
      </View>

      {/* Bottom section: Percentage and Limit */}
      <View style={styles.budgetFooter}>
        <View style={styles.footerLeft}>
          <CustomText style={[styles.usagePercentage, { color: colors.icon }]}>
            {percentage.toFixed(0)}% {t("budget.used")}
          </CustomText>
          {isOverBudget && (
            <View style={styles.overBudgetBadge}>
              <FontAwesome6 name="circle-exclamation" size={normalize(10)} color="#EF4444" />
              <CustomText type="semiBold" style={styles.overBudgetText}>{t('budget.detail.over_limit')}</CustomText>
            </View>
          )}
        </View>

        <View style={styles.footerRight}>
          <CustomText style={[styles.budgetLimitLabel, { color: colors.icon }]}>
            {t('budget.limit')}:
          </CustomText>
          <CustomText style={[styles.budgetLimitValue, { color: colors.text }]}>
            {formatAmount(budget.total)}
          </CustomText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingBottom: hp(1),
  },
  createButton: {
    borderRadius: normalize(24),
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(10),
  },
  createButtonText: {
    color: '#fff',
    fontSize: normalize(14),
  },
  headerRightWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: normalize(20),
    paddingHorizontal: normalize(4),
    paddingVertical: normalize(4),
    gap: normalize(8),
  },
  cashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(16),
    gap: normalize(6),
  },
  cashText: {
    fontSize: normalize(12),
  },
  dividerVertical: {
    width: 1,
    height: normalize(20),
  },
  dropdownButton: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  periodCard: {
    marginHorizontal: wp(5),
    marginBottom: hp(1),
    borderWidth: 1,
    borderRadius: normalize(24),
    paddingVertical: normalize(4),
    paddingHorizontal: normalize(4),
  },
  periodContent: {
    gap: normalize(6),
  },
  periodButton: {
    borderRadius: normalize(20),
    overflow: 'hidden',
  },
  periodGradient: {
    paddingHorizontal: normalize(18),
    paddingVertical: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodInner: {
    paddingHorizontal: normalize(18),
    paddingVertical: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    fontSize: normalize(13),
  },
  circleCard: {
    borderRadius: normalize(20),
    padding: normalize(20),
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    alignItems: 'center',
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2.5),
  },
  circleCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: normalize(10),
  },
  circleLabelSmall: {
    fontSize: normalize(11),
    marginBottom: normalize(4),
  },
  circleAmount: {
    fontSize: normalize(26),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: normalize(8),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: normalize(11),
    marginBottom: normalize(4),
  },
  statValue: {
    fontSize: normalize(13),
  },
  statDivider: {
    width: 1,
    height: normalize(30),
    marginHorizontal: normalize(8),
  },
  budgetList: {
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },
  budgetItem: {
    borderRadius: normalize(16),
    padding: normalize(16),
    marginBottom: normalize(12),
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: normalize(12),
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
    flex: 1,
  },
  budgetIconWrapper: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetInfo: {
    flex: 1,
    gap: normalize(2),
  },
  budgetCategory: {
    fontSize: normalize(15),
    fontWeight: 'bold',
  },
  budgetSubcategory: {
    fontSize: normalize(12),
    opacity: 0.7,
  },
  budgetRight: {
    alignItems: 'flex-end',
  },
  budgetSpentText: {
    fontSize: normalize(16),
    fontWeight: '700',
  },
  budgetLimitText: {
    fontSize: normalize(11),
    marginTop: normalize(1),
  },
  progressSection: {
    height: normalize(28),
    justifyContent: 'center',
    position: 'relative',
    marginVertical: normalize(4),
  },
  progressBarBase: {
    height: normalize(6),
    borderRadius: normalize(3),
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: normalize(3),
  },
  todayMarkerWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    width: normalize(40),
    marginLeft: normalize(-20),
    zIndex: 10,
  },
  todayMarkerLine: {
    width: normalize(1.5),
    height: '100%',
    opacity: 0.3,
  },
  todayMarkerLabel: {
    position: 'absolute',
    top: normalize(-12),
    fontSize: normalize(8),
    width: normalize(40),
    textAlign: 'center',
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(4),
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  usagePercentage: {
    fontSize: normalize(12),
    fontWeight: '700',
  },
  budgetLimitLabel: {
    fontSize: normalize(11),
  },
  budgetLimitValue: {
    fontSize: normalize(12),
    fontWeight: '700',
  },
  overBudgetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    backgroundColor: '#EF444415',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
    borderRadius: normalize(6),
  },
  overBudgetText: {
    fontSize: normalize(10),
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    marginHorizontal: wp(5),
    padding: normalize(30),
    borderRadius: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: hp(2),
  },
  emptyIconWrapper: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(20),
  },
  emptyTitle: {
    fontSize: normalize(18),
    marginBottom: normalize(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: normalize(14),
    textAlign: 'center',
    marginBottom: normalize(24),
    lineHeight: normalize(20),
  },
  emptyCreateButton: {
    borderRadius: normalize(24),
    width: '100%',
    overflow: 'hidden',
  },
  emptyGradientBtn: {
    width: '100%',
    paddingVertical: normalize(12),
    alignItems: 'center',
  },
  emptyCreateButtonText: {
    color: '#fff',
    fontSize: normalize(16),
  },
});

export default BudgetScreen;