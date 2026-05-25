import { normalize } from "@/utils/layout";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: normalize(60),
  },
  header: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(16),
  },
  headerTitle: {
    fontSize: normalize(24),
    fontWeight: "bold",
  },
  profileSection: {
    borderRadius: normalize(20),
    padding: normalize(12),
    marginHorizontal: normalize(20),
    marginBottom: normalize(24),
    alignItems: "center",
  },
  profileImage: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    marginBottom: normalize(12),
  },
  profileName: {
    fontSize: normalize(20),
    fontWeight: "600",
    marginBottom: normalize(4),
  },
  profileEmail: {
    fontSize: normalize(14),
    marginBottom: normalize(16),
  },
  editButton: {
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(10),
    borderRadius: normalize(20),
  },
  editButtonText: {
    fontSize: normalize(14),
    fontWeight: "600",
  },
  section: {
    marginBottom: normalize(24),
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: "600",
    paddingHorizontal: normalize(20),
    marginBottom: normalize(12),
  },
  settingsList: {
    borderRadius: normalize(16),
    marginHorizontal: normalize(20),
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: normalize(12),
  },
  settingIconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: normalize(16),
  },
  settingSubtitle: {
    fontSize: normalize(12),
    marginTop: normalize(2),
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  settingValue: {
    fontSize: normalize(14),
  },
  badge: {
    borderRadius: normalize(10),
    minWidth: normalize(20),
    height: normalize(20),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: normalize(6),
  },
  badgeText: {
    fontSize: normalize(12),
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: normalize(8),
    borderRadius: normalize(16),
    padding: normalize(16),
    marginHorizontal: normalize(20),
    marginBottom: normalize(24),
  },
  logoutText: {
    fontSize: normalize(16),
    fontWeight: "600",
    color: "#FF3B30",
  },
  footer: {
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(24),
    alignItems: "center",
  },
  footerText: {
    fontSize: normalize(12),
    marginBottom: normalize(70),
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: normalize(12),
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: normalize(26),
    height: normalize(26),
    borderRadius: normalize(13),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
