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

  // Subtitle
  subtitle: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    opacity: 0.7,
    lineHeight: normalize(20),
  },

  // Card
  card: {
    borderRadius: normalize(16),
    padding: normalize(20),
    gap: normalize(20),
  },

  // Section
  section: {
    gap: normalize(12),
  },
  label: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    lineHeight: normalize(20),
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Divider
  divider: {
    height: 1,
    opacity: 0.1,
  },

  // Input
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    paddingBottom: normalize(12),
  },
  input: {
    flex: 1,
    fontSize: normalize(28),
    fontFamily: Fonts.bold,
    padding: 0,
  },
  currency: {
    fontSize: normalize(20),
    fontFamily: Fonts.medium,
    marginLeft: normalize(8),
  },

  // Percent Input
  percentInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: normalize(8),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    minWidth: normalize(70),
  },
  percentInput: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    padding: 0,
    textAlign: "center",
    minWidth: normalize(30),
  },
  percentSymbol: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
    marginLeft: normalize(4),
  },

  // Slider
  slider: {
    width: "100%",
    height: normalize(40),
  },
  percentBadge: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(100),
  },
  percentBadgeText: {
    fontSize: normalize(14),
    fontFamily: Fonts.bold,
    color: "#fff",
  },

  // Presets
  presetsContainer: {
    flexDirection: "row",
    gap: normalize(8),
  },
  presetButton: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(12),
    alignItems: "center",
    borderWidth: 1,
  },
  presetText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
  },

  // People Counter
  peopleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: normalize(32),
  },
  peopleButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  peopleCountWrapper: {
    alignItems: "center",
    gap: normalize(4),
  },
  peopleCount: {
    fontSize: normalize(32),
    fontFamily: Fonts.bold,
    lineHeight: normalize(40),
  },
  peopleLabel: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
  },

  // Result
  resultCard: {
    gap: normalize(16),
  },
  resultTitle: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    lineHeight: normalize(22),
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: normalize(12),
  },
  resultLabel: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    flexShrink: 0,
  },
  resultValue: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  highlightResult: {
    paddingTop: normalize(8),
  },
  highlightValue: {
    fontSize: normalize(24),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  disclaimer: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: normalize(8),
    opacity: 0.6,
  },
});
