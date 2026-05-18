import { StyleSheet } from 'react-native';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    borderBottomLeftRadius: normalize(20),
    borderBottomRightRadius: normalize(20),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: normalize(20),
    paddingHorizontal: normalize(16),
  },
  headerText: {
    fontSize: normalize(22),
    fontFamily: Fonts.bold,
    color: "#ffffff",
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  htmlContainer: {
    flex: 1,
  },
  footer: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(20),
    borderTopWidth: 1,
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    elevation: 10,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  checkboxLabel: {
    marginLeft: normalize(10),
    fontSize: normalize(16),
    flex: 1,
    fontFamily: Fonts.regular,
  },
  additionalNote: {
    fontSize: normalize(14),
    marginBottom: normalize(20),
    fontFamily: Fonts.regular,
  },
  button: {
    padding: normalize(15),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
  },
});
