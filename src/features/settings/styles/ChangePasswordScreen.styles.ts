import { StyleSheet } from 'react-native';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  firstLoginNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: normalize(12),
    padding: normalize(16),
    marginHorizontal: wp(5),
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  noticeIconLeft: {
    marginRight: normalize(12),
  },
  firstLoginNoticeText: {
    color: '#FF9900',
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    flex: 1,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(10),
    borderRadius: normalize(12),
    marginHorizontal: wp(5),
    marginTop: hp(2),
  },
  noticeIconCircle: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(12),
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
  },
  section: {
    paddingHorizontal: wp(5),
    marginTop: hp(2),
  },
  label: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    marginBottom: normalize(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(16),
  },
  input: {
    flex: 1,
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    paddingVertical: normalize(14),
  },
  eyeButton: {
    padding: normalize(8),
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
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
  },
  createButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    padding: normalize(24),
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: hp(80),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  modalTitle: {
    fontSize: normalize(20),
    fontFamily: Fonts.semiBold,
  },
  modalBody: {
    paddingTop: normalize(5),
  },
  modalText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    marginBottom: normalize(16),
  },
  requirementsList: {
    gap: normalize(12),
    marginBottom: normalize(20),
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  requirementText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },
  exampleBox: {
    padding: normalize(16),
    borderRadius: normalize(12),
  },
  exampleLabel: {
    fontSize: normalize(12),
    fontFamily: Fonts.medium,
    marginBottom: normalize(4),
  },
  exampleText: {
    fontSize: normalize(15),
    fontFamily: Fonts.semiBold,
  },
  errorText: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    marginTop: normalize(4),
    lineHeight: normalize(18),
  },
});
