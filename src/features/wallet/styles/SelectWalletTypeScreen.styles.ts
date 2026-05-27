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
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContent: {
    width: '80%',
    justifyContent: 'center',
    paddingLeft: normalize(12),
    gap: normalize(4),
  },
  iconContainer: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeName: {
    fontSize: normalize(16),
    fontWeight: '700',
    textAlign: 'left',
  },
  typeDescription: {
    fontSize: normalize(13),
    lineHeight: normalize(18),
    textAlign: 'left',
  },
  bottomButton: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
  },
  continueButton: { borderRadius: normalize(25) },
  continueButtonGradient: {
    paddingVertical: normalize(16),
    borderRadius: normalize(25),
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#fff',
  },
});
