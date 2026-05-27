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

  headerCard: {
    borderRadius: normalize(16),
    padding: normalize(24),
    alignItems: 'center',
    gap: normalize(12),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: normalize(8),
  },
  avatar: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(50),
  },
  avatarPlaceholder: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: normalize(22),
    fontFamily: Fonts.bold,
    lineHeight: normalize(28),
  },
  userEmail: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    lineHeight: normalize(20),
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(10),
    borderRadius: normalize(12),
    marginTop: normalize(8),
  },
  editButtonText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    color: '#fff',
  },

  card: {
    borderRadius: normalize(16),
    padding: normalize(16),
  },

  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: normalize(12),
    gap: normalize(12),
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    flex: 1,
  },
  iconWrapper: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    lineHeight: normalize(20),
  },
  infoValue: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    lineHeight: normalize(20),
    textAlign: 'right',
    flex: 1,
  },

  divider: {
    height: 1,
    opacity: 0.1,
  },
});
