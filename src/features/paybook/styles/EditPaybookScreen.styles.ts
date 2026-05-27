import { StyleSheet } from 'react-native';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';

export const collapsibleStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: wp(4),
    marginTop: hp(2),
    marginBottom: hp(0),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.4),
    borderRadius: normalize(14),
    borderWidth: 1.5,
    borderLeftWidth: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
    flex: 1,
  },
  dot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
  },
  title: {
    fontSize: normalize(13),
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    marginTop: hp(0.2),
  },
});

export const createStyles = (colors: any) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background },

    loadingText: { fontSize: normalize(14), fontFamily: Fonts.medium, marginTop: hp(2) },

    sectionHeader: {
      marginHorizontal: wp(4),
      marginTop: hp(2.5),
      marginBottom: hp(0.5),
      paddingLeft: wp(2.5),
      borderLeftWidth: 3,
    },
    sectionHeaderText: { fontSize: normalize(13), fontFamily: Fonts.semiBold, textTransform: 'uppercase', letterSpacing: 0.5 },

    section: { paddingHorizontal: wp(4), paddingTop: hp(1.5) },

    readonlyCard: {
      borderWidth: 1,
      borderRadius: normalize(14),
      padding: normalize(14),
      gap: hp(1.2),
    },
    readonlyRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    readonlyLabel: {
      fontSize: normalize(13),
      fontFamily: Fonts.regular,
      marginRight: wp(1.5),
    },
    readonlyValue: {
      fontSize: normalize(13),
      fontFamily: Fonts.semiBold,
      flex: 1,
    },

    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.6),
      borderRadius: normalize(20),
    },
    typeBadgeText: {
      fontSize: normalize(12),
      fontFamily: Fonts.semiBold,
    },

    statusDot: {
      width: normalize(8),
      height: normalize(8),
      borderRadius: normalize(4),
      marginRight: wp(1.5),
    },

    label: { fontSize: normalize(13), fontFamily: Fonts.medium, marginBottom: hp(0.8) },

    field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: normalize(14), paddingHorizontal: wp(4), paddingVertical: hp(1.6) },
    fieldLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    fieldIcon: { marginRight: wp(2.5), width: normalize(20), textAlign: 'center' },
    fieldText: { fontSize: normalize(14), fontFamily: Fonts.regular },
    fieldInput: { flex: 1, fontSize: normalize(14), fontFamily: Fonts.regular, padding: 0, margin: 0 },
    unitTag: { fontSize: normalize(13), fontFamily: Fonts.medium, marginLeft: wp(1) },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2) },
    chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: hp(1.2), paddingHorizontal: wp(3), borderRadius: normalize(12), borderWidth: 1 },
    chipText: { fontSize: normalize(13) },
    chipDesc: { fontSize: normalize(11), fontFamily: Fonts.regular, textAlign: 'center' },

    paymentChip: { alignItems: 'center', justifyContent: 'center', paddingVertical: hp(1.5), paddingHorizontal: wp(2), borderRadius: normalize(14), borderWidth: 1, gap: hp(0.3) },

    optionRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: normalize(14), paddingHorizontal: wp(4), paddingVertical: hp(1.4), marginBottom: hp(1), gap: wp(3) },
    radioCircle: { width: normalize(20), height: normalize(20), borderRadius: normalize(10), borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    radioFill: { width: normalize(10), height: normalize(10), borderRadius: normalize(5) },
    optionLabel: { fontSize: normalize(14), fontFamily: Fonts.semiBold, marginBottom: hp(0.2) },
    optionDesc: { fontSize: normalize(12), fontFamily: Fonts.regular },

    amountWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: normalize(14), paddingHorizontal: wp(3), paddingVertical: hp(1.4) },
    amountInputSm: { flex: 1, fontSize: normalize(16), padding: 0, margin: 0 },
    currencyTag: { fontSize: normalize(15), fontFamily: Fonts.bold, marginLeft: wp(1) },

    dateField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: normalize(14), paddingHorizontal: wp(3), paddingVertical: hp(1.4) },
    dateText: { fontSize: normalize(13), fontFamily: Fonts.medium },

    noteInput: { borderWidth: 1, borderRadius: normalize(14), padding: normalize(12), fontSize: normalize(14), fontFamily: Fonts.regular, minHeight: hp(10) },

    pickerToolbar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: wp(4), paddingVertical: hp(1), borderTopWidth: 1 },
    pickerButton: { padding: normalize(8) },
    pickerButtonText: { fontSize: normalize(16), fontFamily: Fonts.semiBold },

    bottomBar: { flexDirection: 'row', paddingHorizontal: wp(4), paddingVertical: hp(2), paddingBottom: hp(3), borderTopWidth: 1, gap: wp(3) },
    cancelBtn: { flex: 1, paddingVertical: hp(1.8), borderRadius: normalize(14), borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    cancelText: { fontSize: normalize(15), fontFamily: Fonts.semiBold },
    createBtn: { flex: 2, flexDirection: 'row', paddingVertical: hp(1.8), borderRadius: normalize(14), alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    createText: { fontSize: normalize(15), color: '#fff', fontFamily: Fonts.semiBold },
  });
