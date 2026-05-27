import { hp, normalize, wp } from '@/utils/layout';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },

  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    gap: normalize(12),
    marginTop: hp(1),
  },
  selectorCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: normalize(16),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  selectorLabel: { fontSize: normalize(15) },
  selectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  colorDot: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  section: {
    paddingHorizontal: wp(5),
    marginTop: hp(2.5),
  },
  label: {
    fontSize: normalize(14),
    marginBottom: normalize(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
    padding: 0,
    fontFamily: 'Quicksand-Regular',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: normalize(5),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyIconWrapper: {
    width: normalize(48),
    height: normalize(48),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
  },
  currencySymbolText: { fontSize: normalize(24) },
  currencyInfo: { flex: 1 },
  currencyCode: {
    fontSize: normalize(14),
    marginBottom: normalize(2),
  },
  currencyNameText: { fontSize: normalize(13) },

  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(12),
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
    borderWidth: 1.5,
  },
  cancelButtonText: { fontSize: normalize(16) },
  saveButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: normalize(16),
    color: '#fff',
  },
});
