import { StyleSheet } from 'react-native';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: { flex: 1 },

  summaryBar: {
    paddingHorizontal: wp(4.5),
    paddingVertical: hp(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  summaryText: {
    fontSize: normalize(13),
    fontFamily: Fonts.medium,
  },

  scrollContent: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(1.5),
  },

  card: {
    borderRadius: normalize(18),
    borderWidth: 1,
    overflow: 'hidden',
  },
  activeStripe: {
    height: 3,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(16),
    paddingBottom: normalize(12),
    paddingRight: normalize(40),
  },
  removeButton: {
    position: 'absolute',
    top: normalize(12),
    right: normalize(12),
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: normalize(46),
    height: normalize(46),
    borderRadius: normalize(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: normalize(15),
    fontFamily: Fonts.bold,
    letterSpacing: 0.1,
  },
  deviceSub: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C45318',
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(5),
    borderRadius: normalize(20),
    gap: 5,
  },
  activeDot: {
    width: normalize(6),
    height: normalize(6),
    borderRadius: normalize(3),
    backgroundColor: '#00C453',
  },
  activeLabel: {
    fontSize: normalize(11),
    fontFamily: Fonts.semiBold,
    color: '#00C453',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: normalize(16),
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
    padding: normalize(12),
  },
  tile: {
    flex: 1,
    minWidth: '44%',
    padding: normalize(10),
    borderRadius: normalize(12),
  },
  tileFull: {
    minWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  tileLabel: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  tileValue: {
    fontSize: normalize(13),
    fontFamily: Fonts.semiBold,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(12),
    paddingHorizontal: wp(10),
  },
  emptyIconWrap: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(24),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  emptyTitle: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
    marginBottom: normalize(6),
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: normalize(20),
  },
});
