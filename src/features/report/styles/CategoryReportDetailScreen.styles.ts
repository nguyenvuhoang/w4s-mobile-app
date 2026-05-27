import { StyleSheet } from 'react-native';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
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
