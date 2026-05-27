import { StyleSheet } from 'react-native';
import { Tokens } from '@/core/theme/theme';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: normalize(20), gap: normalize(16) },
  card: {
    borderRadius: normalize(16),
    padding: normalize(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(16),
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  periodBadge: {
    backgroundColor: Tokens.colors.foundation.primary['primary-1'],
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
  },
  periodBadgeText: {
    color: Tokens.colors.foundation.primary['primary-6'],
    fontSize: normalize(12),
    fontWeight: '700',
  },
  cardBody: { flexDirection: 'column', gap: normalize(16) },
  detailsContainer: {
    flexDirection: 'column',
    gap: normalize(8),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  iconContainer: {
    width: normalize(20),
    height: normalize(20),
    borderRadius: normalize(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    fontSize: normalize(13),
    fontWeight: '500',
    flex: 1,
  },
  amountContainer: {
    marginTop: normalize(8),
    flexDirection: 'column',
    gap: normalize(12),
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: { fontSize: normalize(12) },
  amountValue: { fontSize: normalize(18), fontWeight: '700' },
  progressContainer: {
    flexDirection: 'column',
    gap: normalize(6),
  },
  progressBarBg: {
    height: normalize(6),
    borderRadius: normalize(3),
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: normalize(3),
  },
  usedAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usedAmountText: {
    fontSize: normalize(12),
  },
  remainingText: {
    fontSize: normalize(12),
    fontWeight: '600',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: normalize(100) },
  emptyText: { marginTop: normalize(16), fontSize: normalize(16) },
});
