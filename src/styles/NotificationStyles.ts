import { Fonts, Tokens } from "@/core/theme/theme"; // Import từ file theme của bạn
import { normalize } from "@/utils/layout"; // Giả sử hàm này bạn đã có
import { Platform, StyleSheet } from "react-native";

// Lấy Type của bộ màu (Light hoặc Dark) để TypeScript gợi ý code
type ThemeColors = typeof import("@/core/theme/theme").Colors.light;

export const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background, // Theo theme (White / Dark Blue)
    },
    
    // --- Header & Navigation ---
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: normalize(16),
    },

    // --- Search Bar ---
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card, // Card color
      margin: normalize(10),
      borderRadius: normalize(8),
      padding: normalize(8),
      borderWidth: 1,
      borderColor: colors.border, // Border color
    },
    searchIcon: {
      marginRight: normalize(8),
      color: colors.icon,
    },
    searchInput: {
      flex: 1,
      fontFamily: Fonts.family.regular,
      fontSize: Fonts.size.base, // 16
      color: colors.text,
      paddingVertical: Platform.OS === 'android' ? 0 : undefined,
    },

    // --- Info Box (Thông báo màu xanh/mint) ---
    infoBox: {
      flexDirection: "row",
      alignItems: "center",
      // Dùng màu nền nhạt từ foundation cho box thông tin
      backgroundColor: Tokens.colors.foundation.secondary["secondary-1"], 
      marginHorizontal: normalize(16),
      padding: normalize(12),
      borderRadius: normalize(8),
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      marginBottom: normalize(16),
    },
    infoText: {
      fontFamily: Fonts.family.regular,
      fontSize: Fonts.size.sm, // 14
      flex: 1,
      marginHorizontal: normalize(8),
      // Dùng màu đậm hơn cho text trong box nhạt
      color: Tokens.colors.foundation.secondary["secondary-9"], 
    },

    // --- Notification Item (Card) ---
    notificationCard: {
      backgroundColor: colors.card,
      marginHorizontal: normalize(16),
      marginBottom: normalize(12),
      padding: normalize(16),
      borderRadius: normalize(12),
      // Shadow
      elevation: 1,
      shadowColor: colors.border, // Dùng màu border làm shadow nhẹ
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: normalize(8),
    },
    dateText: {
      fontSize: Fonts.size.xs, // 12
      color: colors.icon, // Dùng màu xám icon cho ngày tháng
      fontFamily: Fonts.family.regular,
    },
    notificationTitle: {
      fontSize: Fonts.size.base, // 16
      fontFamily: Fonts.family.bold,
      marginBottom: normalize(6),
      color: colors.text,
    },
    // HTML Content Styles (thường truyền vào tagsStyles, nhưng nếu dùng Text thường)
    notificationDescription: {
      fontSize: Fonts.size.sm,
      fontFamily: Fonts.family.regular,
      color: colors.text,
      lineHeight: 22,
    },

    // --- Tabs ---
    tabOuterContainer: {
      marginTop: normalize(12),
      marginBottom: normalize(12),
    },
    tabInnerContainer: {
      backgroundColor: colors.card,
      borderRadius: normalize(30),
      padding: normalize(4),
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    tabWrapper: {
      marginHorizontal: normalize(4),
      borderRadius: normalize(20),
      overflow: "hidden",
    },
    tabButtonBase: {
      height: 36,
      minWidth: 100,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: normalize(20),
      backgroundColor: "transparent",
    },
    tabContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: normalize(12),
    },
    tabText: {
      fontFamily: Fonts.family.medium,
      fontSize: Fonts.size.sm,
      color: colors.text, // Mặc định là màu text thường
    },
    badge: {
      backgroundColor: colors.background, // Nền badge đảo ngược
      marginLeft: normalize(6),
      borderRadius: normalize(10),
      paddingHorizontal: normalize(6),
      paddingVertical: normalize(2),
      justifyContent: "center",
      alignItems: "center",
    },
    badgeText: {
      color: colors.tint, // Màu primary
      fontSize: Fonts.size.xs,
      fontFamily: Fonts.family.bold,
    },

    // --- Balance / Login State ---
    balanceContainer: {
      alignItems: "center",
      marginTop: normalize(40),
      paddingHorizontal: normalize(24),
    },
    balanceTitle: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.base,
      marginTop: normalize(12),
      color: colors.text,
    },
    balanceDescription: {
      textAlign: "center",
      color: colors.icon,
      marginTop: normalize(8),
      fontFamily: Fonts.family.regular,
      fontSize: Fonts.size.sm,
    },
    balanceNote: {
      textAlign: "center",
      marginTop: normalize(4),
      fontFamily: Fonts.family.regular,
      fontSize: Fonts.size.sm,
      color: colors.text,
    },
    boldText: {
      fontFamily: Fonts.family.bold,
      color: colors.text,
    },
    loginButton: {
      paddingHorizontal: normalize(30),
      borderRadius: normalize(10),
      marginTop: normalize(20),
    },
    // Nút login thường có nền Primary, chữ trắng (bất kể theme)
    loginButtonText: {
      color: Tokens.colors.main.white, 
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.sm,
    },

    // --- Empty State ---
    emptyListContainer: {
      flex: 1,
      justifyContent: "flex-start",
      alignItems: 'center',
      marginTop: "30%",
    },
    emptyListImage: {
      width: normalize(150),
      height: normalize(150),
      resizeMode: 'contain',
      // Có thể chỉnh opacity nếu là dark mode bên logic component
    },
    emptyListText: {
      fontSize: Fonts.size.base,
      marginTop: normalize(16),
      color: colors.icon,
      fontFamily: Fonts.family.medium,
    },
  });
};
