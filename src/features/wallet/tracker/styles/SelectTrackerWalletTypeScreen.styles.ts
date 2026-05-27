import { hp, normalize, wp } from '@/utils/layout';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: wp(5) },
  subtitle: {
    fontSize: normalize(14),
    marginTop: hp(1),
    marginBottom: hp(2),
    lineHeight: normalize(20),
    textAlign: 'center',
    maxWidth: wp(70),
  },
  typeList: { gap: normalize(16) },
  typeCard: {
    flexDirection: 'row',
    padding: normalize(16),
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  leftContent: {
    width: '30%',
    alignItems: 'center',
    gap: normalize(8),
  },
  rightContent: {
    width: '70%',
    justifyContent: 'center',
    paddingLeft: normalize(8),
  },
  iconContainer: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeName: {
    fontSize: normalize(14),
    fontWeight: '700',
    textAlign: 'center',
  },
  typeDescription: {
    fontSize: normalize(13),
    lineHeight: normalize(18),
    textAlign: 'center',
  },
  bottomButton: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
  },
  continueButton: { borderRadius: normalize(16) },
  continueButtonGradient: {
    paddingVertical: normalize(16),
    borderRadius: normalize(16),
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#fff',
  },
});
