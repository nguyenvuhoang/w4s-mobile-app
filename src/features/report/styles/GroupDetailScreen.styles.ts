import { StyleSheet } from 'react-native';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
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
    paddingBottom: normalize(32),
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
