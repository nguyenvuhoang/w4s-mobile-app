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
    opacity: 0.7,
  },

  /* Card */
  card: {
    borderRadius: normalize(16),
    padding: normalize(20),
    gap: normalize(16),
  },
  cardTitle: {
    fontSize: normalize(15),
    fontFamily: Fonts.bold,
  },

  /* Field */
  fieldGroup: { gap: normalize(10) },
  label: { fontSize: normalize(14), fontFamily: Fonts.medium },
  divider: { height: 1, opacity: 0.1 },

  /* Row */
  row: { flexDirection: "row", gap: normalize(12) },
  half: { flex: 1, gap: normalize(10) },

  /* Segment toggle */
  segmentRow: {
    flexDirection: "row",
    borderRadius: normalize(12),
    padding: normalize(4),
    gap: normalize(4),
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: normalize(8),
    borderRadius: normalize(10),
    alignItems: "center",
  },
  segmentLabel: { fontSize: normalize(13), fontFamily: Fonts.medium },

  /* Fixed rate input */
  rateWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    paddingBottom: normalize(10),
  },
  rateInput: {
    flex: 1,
    fontSize: normalize(28),
    fontFamily: Fonts.bold,
    padding: 0,
  },
  rateSuffix: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    marginLeft: normalize(6),
  },

  /* Floating rate grid */
  floatingGrid: { gap: normalize(10) },
  hintText: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    opacity: 0.7,
  },
  monthRateInput: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    paddingBottom: normalize(6),
  },
  monthRateText: {
    flex: 1,
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    padding: 0,
  },

  /* Fees */
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  feeInfo: { flex: 1 },
  feeLabel: { fontSize: normalize(14), fontFamily: Fonts.medium },
  feeType: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    marginTop: normalize(2),
  },
  feeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
    flex: 0.6,
  },
  removeBtn: {},
  addFeeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  addFeeLabel: { fontSize: normalize(13), fontFamily: Fonts.medium },

  /* Result */
  emptyHint: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    opacity: 0.6,
    textAlign: "center",
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
    fontSize: normalize(15),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  highlightValue: {
    fontSize: normalize(22),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  disclaimer: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    textAlign: "center",
    opacity: 0.6,
    marginTop: normalize(4),
  },

  /* Schedule tabs */
  tabRow: {
    flexDirection: "row",
    borderRadius: normalize(12),
    padding: normalize(4),
    gap: normalize(4),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: normalize(8),
    borderRadius: normalize(10),
    alignItems: "center",
  },
  tabLabel: { fontSize: normalize(13), fontFamily: Fonts.medium },

  /* Table */
  tableHeader: {
    flexDirection: "row",
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(4),
    borderRadius: normalize(8),
    marginBottom: normalize(4),
  },
  thCell: {
    flex: 1,
    fontSize: normalize(11),
    fontFamily: Fonts.medium,
    textAlign: "center",
    opacity: 0.7,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: normalize(9),
    paddingHorizontal: normalize(4),
    borderRadius: normalize(6),
  },
  tdCell: {
    flex: 1,
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    textAlign: "center",
  },

  /* Chart */
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
    marginBottom: normalize(8),
  },
  legendDot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    marginRight: normalize(8),
  },
  chartHint: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: normalize(8),
    opacity: 0.6,
  },

  /* Select button */
  selectButton: {
    height: normalize(48),
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontSize: normalize(14), fontFamily: Fonts.medium },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    padding: normalize(24),
    gap: normalize(14),
  },
  modalTitle: { fontSize: normalize(17), fontFamily: Fonts.bold },
  textField: {
    borderWidth: 1,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(12),
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
  },
  modalActions: {
    flexDirection: "row",
    gap: normalize(12),
    marginTop: normalize(4),
  },
  modalBtn: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(14),
    alignItems: "center",
  },
  modalBtnLabel: { fontSize: normalize(15), fontFamily: Fonts.bold },
});
