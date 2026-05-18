import { StyleSheet } from 'react-native';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: normalize(20) },
  section: {
    marginBottom: normalize(20),
  },
  fieldLabel: {
    fontSize: normalize(14),
    fontWeight: '600',
    marginBottom: normalize(8),
  },
  selector: {
    height: normalize(52),
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryIcon: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    height: normalize(52),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  footer: {
    padding: normalize(20),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    height: normalize(52),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: normalize(16),
    fontWeight: '700',
  },
  conversionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: normalize(8),
    marginTop: normalize(8),
    paddingHorizontal: normalize(4),
  },
  conversionTextContainer: {
    flex: 1,
    gap: normalize(2),
  },
  conversionText: {
    fontSize: normalize(13),
    fontWeight: '500',
  },
  exchangeRateText: {
    fontSize: normalize(11),
    opacity: 0.7,
  },
});
