import CustomText from '@/components/base/CustomText';
import WalletPickerModal, { WalletPickerId } from '@/components/modals/WalletPickerModal';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useBudget } from '@/features/budget/hooks/useBudget';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useCategory } from '@/hooks/useCategory';
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

      return {
        id: item.id?.toString() || Math.random().toString(),
        categoryName,
        note: item.note || '',
        icon: cat?.icon || 'wallet',
        iconColor: cat?.color || colors.tint,
        spent: item.used_amount || 0,
        total: item.amount || Math.max(item.used_amount || 0, 1),
        todayProgress,
        // raw fields for detail screen
        start_date: item.start_date,
        end_date: item.end_date,
        wallet_id: item.wallet_id,
        wallet_name: item.wallet_name,
        period_type: item.period_type,
        source_tracker: item.source_tracker,
      };
    });
  }, [budgetList, categories, colors.tint, t, i18n.language]);

  const totalBudget = budgetSummary?.total_budget ?? 0;
  const totalSpent = budgetSummary?.total_spent ?? 0;
  const remaining = budgetSummary?.remaining ?? 0;
  const daysLeft = budgetSummary?.days_left ?? 0;

  // Calculate semi-circle progress
  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const radius = wp(35);
  const strokeWidth = normalize(18);
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;


  const selectedWallet = useMemo<WalletSummary | null>(() => {
    if (selectedWalletId === 'all') return null;
    return wallets.find((w) => w.walletId === selectedWalletId) ?? null;
  }, [selectedWalletId, wallets]);

  const handleCreateBudget = () => {
    router.push('/(protected)/budget/create-budget');
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
              <CustomText style={styles.createButtonText}>{t("budget.create_budget")}</CustomText>
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
                {selectedWalletId === 'all' ? 'Tất cả các ví' : (selectedWallet?.name || t('wallet.select_wallet'))}
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
        {(!firstLoaded || summaryLoading || listLoading || categoryLoading) ? (
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
            <CustomText style={[styles.emptyTitle, { color: colors.text }]}>
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
                <CustomText style={styles.emptyCreateButtonText}>{t("budget.create_now", "Tạo ngân sách ngay")}</CustomText>
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
                    stroke={colors.tint}
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
                  <CustomText style={[styles.circleAmount, { color: colors.text }]}>
                    {remaining.toLocaleString('vi-VN')} {budgetSummary?.currency || "đ"}
                  </CustomText>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <CustomText style={[styles.statLabel, { color: colors.icon }]}>
                    {t("budget.total_budget")}
                  </CustomText>
                  <CustomText style={[styles.statValue, { color: colors.text }]}>
                    {totalBudget.toLocaleString('vi-VN')} {budgetSummary?.currency || "đ"}
                  </CustomText>
                </View>

                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

                <View style={styles.statItem}>
                  <CustomText style={[styles.statLabel, { color: colors.icon }]}>
                    {t("budget.total_spent")}
                  </CustomText>
                  <CustomText style={[styles.statValue, { color: colors.text }]}>
                    {totalSpent.toLocaleString('vi-VN')} {budgetSummary?.currency || "đ"}
                  </CustomText>
                </View>

                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

                <View style={styles.statItem}>
                  <CustomText style={[styles.statLabel, { color: colors.icon }]}>
                    {t("budget.days_left")}
                  </CustomText>
                  <CustomText style={[styles.statValue, { color: colors.text }]}>
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
const BudgetItem = ({ budget, colors, onPress }: any) => {
  const { t } = useTranslation();
  const percentage = (budget.spent / budget.total) * 100;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.budgetItem, { backgroundColor: colors.card }]}
    >
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View
            style={[
              styles.budgetIconContainer,
              { backgroundColor: budget.iconColor },
            ]}
          >
            <FontAwesome6 name={budget.icon as any} size={normalize(20)} color="#fff" />
          </View>

          <View style={styles.budgetInfo}>
            <CustomText style={[styles.budgetCategory, { color: colors.text }]}>
              {budget.categoryName}
            </CustomText>
            {budget.note ? (
              <CustomText style={[styles.budgetSubcategory, { color: colors.icon }]}>
                {budget.note}
              </CustomText>
            ) : null}
          </View>
        </View>

        <CustomText style={[styles.budgetAmount, { color: colors.text }]}>
          {budget.spent.toLocaleString('vi-VN')} đ
        </CustomText>
      </View>

      {/* Progress Bar Container with percentage */}
      <View style={styles.progressWrapper}>
        {/* Progress Bar with rounded ends */}
        <View style={[styles.budgetProgressContainer, { backgroundColor: '#E8EAED' }]}>
          <View
            style={[
              styles.budgetProgress,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: budget.iconColor,
              },
            ]}
          />
          {percentage < 100 && (
            <View
              style={[
                styles.budgetProgressRemaining,
                {
                  width: `${100 - percentage}%`,
                  backgroundColor: '#2C3E50',
                },
              ]}
            />
          )}
        </View>

        {/* "Hôm nay" marker overlapping the progress bar */}
        <View
          style={[
            styles.todayMarkerContainer,
            { left: `${budget.todayProgress}%` }
          ]}
        >
          <View style={[styles.timelineMarker, { backgroundColor: colors.text }]} />
          <CustomText style={[styles.timelineLabel, { color: colors.text }]}>
            {t("home.today")}
          </CustomText>
        </View>
      </View>

      {/* Percentage display */}
      <CustomText style={[styles.percentageText, { color: colors.icon }]}>
        {percentage.toFixed(0)}{t("budget.percent_used")}
      </CustomText>
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
    paddingTop: hp(1),
    paddingBottom: hp(2),
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
    fontWeight: '600',
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
    marginBottom: hp(2),
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
    fontSize: normalize(22),
    fontWeight: 'bold',
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
    fontWeight: '600',
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
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    flex: 1,
  },
  budgetIconContainer: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: normalize(15),
    fontWeight: '600',
    marginBottom: normalize(2),
  },
  budgetSubcategory: {
    fontSize: normalize(12),
  },
  budgetAmount: {
    fontSize: normalize(15),
    fontWeight: '600',
  },
  progressWrapper: {
    position: 'relative',
    marginBottom: normalize(8),
  },
  budgetProgressContainer: {
    height: normalize(6),
    borderRadius: normalize(3),
    overflow: 'visible',
    flexDirection: 'row',
  },
  budgetProgress: {
    height: '100%',
    borderTopLeftRadius: normalize(3),
    borderBottomLeftRadius: normalize(3),
    borderTopRightRadius: normalize(3),
    borderBottomRightRadius: normalize(3),
  },
  budgetProgressRemaining: {
    height: '100%',
    borderTopRightRadius: normalize(3),
    borderBottomRightRadius: normalize(3),
  },
  todayMarkerContainer: {
    position: 'absolute',
    top: normalize(-8),
    transform: [{ translateX: normalize(-1) }],
    alignItems: 'center',
  },
  timelineMarker: {
    width: normalize(2),
    height: normalize(22),
    marginBottom: normalize(2),
  },
  timelineLabel: {
    fontSize: normalize(10),
  },
  percentageText: {
    fontSize: normalize(11),
    marginTop: normalize(4),
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
    fontWeight: 'bold',
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
    fontWeight: '600',
  },
});

export default BudgetScreen;