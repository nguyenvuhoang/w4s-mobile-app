import { StyleSheet } from 'react-native';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(16),
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: normalize(12),
  },
  loadingText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },

  // Subtitle
  subtitleRow: {
    gap: normalize(4),
  },
  subtitle: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    opacity: 0.7,
    lineHeight: normalize(20),
  },
  updateTime: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    opacity: 0.6,
  },

  // Card
  card: {
    borderRadius: normalize(16),
    padding: normalize(20),
    gap: normalize(24),
  },

  // Section
  section: {
    gap: normalize(12),
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    lineHeight: normalize(20),
  },

  // Currency Badge
  currencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(100),
  },
  currencyBadgeText: {
    fontSize: normalize(14),
    fontFamily: Fonts.bold,
  },

  // Currency Name
  currencyName: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
  },

  // Large Input Styles
  largeInputContainer: {
    height: normalize(60),
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderRadius: 0,
  },
  largeCurrency: {
    fontSize: normalize(24),
    marginRight: normalize(8),
  },
  largeInput: {
    fontSize: normalize(32),
  },

  // Swap
  swapContainer: {
    alignItems: "center",
    marginVertical: normalize(-8),
  },
  swapButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Rate Card
  rateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: normalize(16),
    borderRadius: normalize(16),
    gap: normalize(12),
  },
  rateIconWrapper: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  rateInfo: {
    flex: 1,
    gap: normalize(4),
  },
  rateLabel: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
  },
  rateValue: {
    fontSize: normalize(15),
    fontFamily: Fonts.bold,
  },
  refreshButton: {
    padding: normalize(8),
  },

  // Disclaimer
  disclaimer: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    textAlign: "center",
    opacity: 0.6,
  },
});
