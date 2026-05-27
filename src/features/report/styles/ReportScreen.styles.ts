import { StyleSheet } from 'react-native';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: { flex: 1 },

  headerCard: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    padding: normalize(12),
    borderRadius: normalize(12),
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },

  periodTabsScroll: {
    marginVertical: hp(2),
  },
  periodTabsContainer: {
    paddingHorizontal: wp(5),
    gap: normalize(8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodTab: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
  },
  periodTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  sectionTitle: {
    paddingHorizontal: wp(5),
    marginBottom: normalize(12),
  },

  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    gap: normalize(12),
    marginBottom: normalize(16),
  },
  summaryCard: {
    flex: 1,
    padding: normalize(16),
    borderRadius: normalize(12),
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  summaryIcon: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    marginTop: normalize(6),
  },

  netBalanceGradient: {
    marginHorizontal: wp(5),
    padding: normalize(18),
    borderRadius: normalize(20),
    marginBottom: normalize(12),
    minHeight: normalize(120),
  },
  netBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
  },
  netBalanceIconContainer: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  netBalanceValueContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: normalize(10),
  },

  infoCard: {
    marginHorizontal: wp(5),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(4),
    borderRadius: normalize(16),
    marginBottom: normalize(16),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: normalize(12),
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.5,
  },

  debtCard: {
    marginHorizontal: wp(5),
    padding: normalize(16),
    borderRadius: normalize(12),
    marginBottom: normalize(16),
    gap: normalize(12),
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingCard: {
    padding: normalize(32),
    borderRadius: normalize(12),
    marginBottom: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: normalize(32),
    borderRadius: normalize(12),
    marginBottom: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
