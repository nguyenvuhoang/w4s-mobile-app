import { StyleSheet } from 'react-native';
import { normalize } from '@/utils/layout';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: normalize(20),
  },
  inputGroup: {
    marginBottom: normalize(20),
  },
  label: {
    fontSize: normalize(14),
    marginBottom: normalize(8),
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(16),
    height: normalize(56),
    gap: normalize(12),
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(16),
    height: normalize(56),
  },
  dateText: {
    fontSize: normalize(16),
  },
  errorText: {
    color: "#FF3B30",
    fontSize: normalize(12),
    marginTop: normalize(4),
  },
});
