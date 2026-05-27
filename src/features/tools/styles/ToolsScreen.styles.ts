import { StyleSheet } from 'react-native';
import { normalize } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(16),
  },
  headerTitle: {
    fontSize: normalize(24),
    fontWeight: "bold",
  },
  toolsList: {
    borderRadius: normalize(16),
    marginHorizontal: normalize(20),
    marginTop: normalize(16),
    overflow: "hidden",
  },
  toolItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: normalize(16),
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  iconBox: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: normalize(16),
  },
});
