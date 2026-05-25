import { hp, normalize, wp } from '@/utils/layout';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(16),
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    flex: 1,
  },
  budgetIconWrapper: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetInfo: {
    flex: 1,
    gap: normalize(2),
  },
  budgetCategory: {
    fontSize: normalize(15),
  },
  budgetSubcategory: {
    fontSize: normalize(12),
  },
  budgetRight: {
    alignItems: 'flex-end',
  },
  budgetTotalText: {
    fontSize: normalize(15),
  },
  budgetStatusText: {
    fontSize: normalize(11),
    marginTop: normalize(2),
  },
  progressContainer: {
    paddingTop: normalize(12),
    paddingBottom: normalize(22),
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarBase: {
    height: normalize(6),
    borderRadius: normalize(10),
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: normalize(10),
  },
  todayMarkerWrapper: {
    position: 'absolute',
    top: normalize(6),
    bottom: 0,
    alignItems: 'center',
    width: normalize(2),
    zIndex: 10,
  },
  todayMarkerLine: {
    width: normalize(1.5),
    height: normalize(14),
    borderRadius: 1,
  },
  todayMarkerLabel: {
    position: 'absolute',
    bottom: 0,
    fontSize: normalize(9),
    width: normalize(60),
    textAlign: 'center',
    fontWeight: '600',
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
