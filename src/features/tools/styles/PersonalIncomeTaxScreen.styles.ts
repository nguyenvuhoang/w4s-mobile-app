import { StyleSheet } from 'react-native';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(16),
  },
  subtitle: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    lineHeight: normalize(20),
  },
  card: {
    borderRadius: normalize(16),
    padding: normalize(20),
    gap: normalize(20),
  },
  cardLabel: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    marginBottom: normalize(-8),
  },
  cardTitle: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    lineHeight: normalize(22),
  },
  toggleContainer: {
    flexDirection: "row",
    gap: normalize(8),
    padding: normalize(4),
    borderRadius: normalize(100),
  },
  toggleButton: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(100),
    alignItems: "center",
    gap: normalize(2),
  },
  toggleText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
  },
  toggleSubText: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
  },
  section: { gap: normalize(12) },
  label: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    lineHeight: normalize(20),
  },
  labelWithToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniToggle: {
    flexDirection: "row",
    borderRadius: normalize(8),
    padding: normalize(3),
    gap: normalize(4),
  },
  miniToggleButton: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(6),
  },
  miniToggleText: {
    fontSize: normalize(12),
    fontFamily: Fonts.medium,
  },
  divider: { height: 1, opacity: 0.2 },
  largeInputContainer: {
    height: normalize(56),
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderRadius: 0,
  },
  largeCurrency: {
    fontSize: normalize(20),
    marginRight: normalize(8),
  },
  largeInput: { fontSize: normalize(28) },
  inputContainer: {
    height: normalize(48),
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(12),
    flexDirection: "row",
    alignItems: "center",
  },
  inputCurrency: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    marginRight: normalize(6),
  },
  textInput: {
    flex: 1,
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    textAlign: "right",
  },
  selectButton: {
    height: normalize(48),
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
  },

  // Result
  resultCard: { gap: normalize(16) },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: normalize(12),
  },
  resultLabelGroup: {
    flexShrink: 0,
    gap: normalize(2),
  },
  resultLabel: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },
  resultLabelSub: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    opacity: 0.6,
  },
  resultValue: {
    fontSize: normalize(15),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  taxRateContainer: {
    borderRadius: normalize(12),
    padding: normalize(16),
  },
  taxRateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: normalize(12),
  },
  taxRateLabel: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    flex: 1,
  },
  taxRateValue: {
    fontSize: normalize(20),
    fontFamily: Fonts.bold,
  },
  disclaimer: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    textAlign: "center",
    opacity: 0.6,
  },
  noteCard: {
    borderRadius: normalize(16),
    padding: normalize(20),
    gap: normalize(16),
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  noteTitle: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
  },
  noteContent: { gap: normalize(12) },
  noteText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    lineHeight: normalize(20),
  },
  taxBrackets: {
    gap: normalize(6),
    paddingLeft: normalize(12),
  },
  bracketRow: {
    flexDirection: "row",
    gap: normalize(12),
  },
  bracketText: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    flex: 1,
  },
  noteExample: {
    padding: normalize(12),
    borderRadius: normalize(8),
    gap: normalize(4),
  },
  exampleTitle: {
    fontSize: normalize(13),
    fontFamily: Fonts.bold,
  },
  exampleText: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    lineHeight: normalize(18),
  },
});
