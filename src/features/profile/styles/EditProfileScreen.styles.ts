import { StyleSheet } from 'react-native';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },

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
  dateText: {
    fontSize: normalize(16),
    fontFamily: 'Quicksand-Regular',
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
    padding: 0,
    fontFamily: 'Quicksand-Regular',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: normalize(12),
  },
  genderButton: {
    flex: 1,
    paddingVertical: normalize(14),
    alignItems: 'center',
    borderRadius: normalize(12),
    borderWidth: 1,
  },

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
  cancelButtonText: {
    fontSize: normalize(16),
  },
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
