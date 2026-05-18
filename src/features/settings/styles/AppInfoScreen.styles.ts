import { StyleSheet } from 'react-native';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollContent: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(2),
  },

  brandContainer: {
    alignItems: 'center',
    marginVertical: hp(3),
  },
  logoWrapper: {
    width: normalize(90),
    height: normalize(90),
    borderRadius: normalize(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(16),
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150,150,150,0.1)',
  },
  appName: {
    fontSize: normalize(22),
    fontFamily: Fonts.bold,
    marginBottom: normalize(8),
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(4),
    borderRadius: normalize(16),
  },
  badgeText: {
    fontSize: normalize(12),
    fontFamily: Fonts.semiBold,
  },

  section: {
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  sectionTitle: {
    fontSize: normalize(13),
    fontFamily: Fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: normalize(12),
    marginLeft: normalize(4),
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(10),
  },
  tile: {
    flex: 1,
    minWidth: '46%',
    padding: normalize(14),
    borderRadius: normalize(16),
    borderWidth: 1,
  },
  tileFull: {
    minWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  tileLabel: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  tileValue: {
    fontSize: normalize(14),
    fontFamily: Fonts.bold,
    marginTop: 4,
  },

  actionsContainer: {
    gap: normalize(8),
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(12),
    borderRadius: normalize(16),
    borderWidth: 1,
  },
  actionIconWrap: {
    width: normalize(42),
    height: normalize(42),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: normalize(15),
    fontFamily: Fonts.semiBold,
  },
  actionSub: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    marginTop: 2,
  },

  footerInfo: {
    alignItems: 'center',
    marginTop: hp(5),
    paddingBottom: hp(2),
  },
  copyright: {
    fontSize: normalize(12),
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
  otaText: {
    fontSize: normalize(10),
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  }
});
