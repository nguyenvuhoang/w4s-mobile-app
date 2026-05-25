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
import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { styles } from '../styles/BudgetScreen.styles';

interface BudgetScreenProps {
  navigation?: any;
}

const BudgetScreen: React.FC<BudgetScreenProps> = ({ navigation }) => {
  const isFocused = useIsFocused();
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
      let cat = categories.find(c => c.id === item.category_id);
      if (!cat && item.category_code) {
        cat = categories.find(c => c.category_code === item.category_code);
      }

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
        wallet_contract_id: item.wallet_contract_id,
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
      {isFocused && <StatusBar style="light" />}
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
                  <CustomText style={[styles.circleLabelSmall, { color: colors.text }]}>
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
                  <CustomText style={[styles.statLabel, { color: colors.text }]}>
                    {t("budget.total_budget")}
                  </CustomText>
                  <CustomText type="semiBold" style={[styles.statValue, { color: colors.text }]}>
                    {formatAmount(totalBudget)}
                  </CustomText>
                </View>

                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

                <View style={styles.statItem}>
                  <CustomText style={[styles.statLabel, { color: colors.text }]}>
                    {t("budget.total_spent")}
                  </CustomText>
                  <CustomText type="semiBold" style={[styles.statValue, { color: colors.text }]}>
                    {formatAmount(totalSpent)}
                  </CustomText>
                </View>

                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

                <View style={styles.statItem}>
                  <CustomText style={[styles.statLabel, { color: colors.text }]}>
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
  const remaining = budget.total - budget.spent;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.budgetItem,
        {
          backgroundColor: colors.card,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
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
            <CustomText type="semiBold" style={[styles.budgetCategory, { color: colors.text }]} numberOfLines={1}>
              {budget.categoryName}
            </CustomText>
            <CustomText style={[styles.budgetSubcategory, { color: colors.icon }]} numberOfLines={1}>
              {budget.note || t('common.no_note', 'Không có ghi chú')}
            </CustomText>
          </View>
        </View>

        <View style={styles.budgetRight}>
          <CustomText type="bold" style={[styles.budgetTotalText, { color: colors.text }]}>
            {formatAmount(budget.total)}
          </CustomText>
          <CustomText
            style={[
              styles.budgetStatusText,
              { color: isOverBudget ? '#EF4444' : colors.text }
            ]}
          >
            {isOverBudget
              ? `${t('budget.overspent') || 'Bội chi'}: ${formatAmount(Math.abs(remaining))}`
              : `${t('budget.detail.remaining')}: ${formatAmount(remaining)}`}
          </CustomText>
        </View>
      </View>

      {/* Middle section: Progress bar and Today marker */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBarBase, { backgroundColor: colors.border + '50' }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isOverBudget ? '#F97316' : '#10B981',
              },
            ]}
          />
        </View>

        {/* Today Marker */}
        {budget.todayProgress > 0 && budget.todayProgress <= 100 && (
          <View
            style={[
              styles.todayMarkerWrapper,
              { left: `${budget.todayProgress}%` }
            ]}
          >
            <View style={[styles.todayMarkerLine, { backgroundColor: colors.border }]} />
            <CustomText style={[styles.todayMarkerLabel, { color: colors.text }]}>
              {t("home.today")}
            </CustomText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};



export default BudgetScreen;