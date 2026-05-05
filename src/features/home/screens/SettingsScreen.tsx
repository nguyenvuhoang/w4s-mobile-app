import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import BottomActionModal, { ActionItem } from "@/components/modals/BottomActionModal";
import { GlobalContext } from "@/contexts/GlobalContext";
import { useNotification } from "@/contexts/NotificationContext";
import { apiService } from "@/core/api/ApiService";
import { changeLanguage, languageMap } from "@/core/i18n/i18n";
import { Tokens } from "@/core/theme/theme";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useLoginService } from "@/features/auth/hooks/useLoginService";
import { useBudget } from "@/features/budget/hooks/useBudget";
import { useEvent } from "@/features/event/hooks/useEvent";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useSettingService } from "@/features/settings/hooks/useSettingService";
import { useCategory } from "@/hooks/useCategory";
import { useCurrency } from "@/hooks/useCurrency";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import DefaultCurrencyService from "@/services/DefaultCurrencyService";
import StorageService from "@/services/StorageService";
import { Images } from "@/utils/images";
import { normalize } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { showNotification } = useNotification();
  const { handleLogout, touchIDClick, isUsingTouchID } = useSettingService();
  const { appInfo } = useContext(GlobalContext);
  const { mode, setMode, colors, isDark } = useAppTheme();
  const { defaultCurrency, loading, updateDefaultCurrency } =
    useDefaultCurrency();
  const { profile, getUserProfile, loading: profileLoading } = useProfile();
  const { uploadAvatar } = useProfile();
  const { handleGetAppInfo } = useLoginService();

  const { clearCache: clearCategoryCache } = useCategory({ autoFetch: false });
  const { clearCache: clearCurrencyCache } = useCurrency({ autoFetch: false });
  const { clearCache: clearExchangeRateCache } = useExchangeRate({ autoFetch: false });
  const { clearCache: clearEventCache } = useEvent({ autoFetch: false });
  const { clearCache: clearBudgetCache } = useBudget({ autoFetch: false });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [updatingCurrency, setUpdatingCurrency] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const loadSelectedCurrency = async () => {
        try {
          const selectedCurrencyStr = await StorageService.getItem(
            "temp_selected_currency",
          );

          if (selectedCurrencyStr) {
            setUpdatingCurrency(true);
            const selectedCurrency = JSON.parse(selectedCurrencyStr);

            await DefaultCurrencyService.setDefaultCurrency(selectedCurrency);
            await updateDefaultCurrency(selectedCurrency);
            await StorageService.removeItem("temp_selected_currency");
          }
        } catch (error) {
          console.error(
            "[CurrencySettings] Failed to load selected currency:",
            error,
          );
          showNotification("Không thể cập nhật tiền tệ. Vui lòng thử lại.", "error");
        } finally {
          setUpdatingCurrency(false);
        }
      };

      loadSelectedCurrency();
      getUserProfile();
    }, [updateDefaultCurrency, getUserProfile]),
  );

  const handlePickAvatar = async () => {
    try {
      // Xin quyền truy cập thư viện ảnh
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showNotification(t("settings.photo_permission_denied") || "Cần quyền truy cập thư viện ảnh", "error");
        return;
      }

      // Mở thư viện ảnh
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const uri = result.assets[0].uri;
      const userCode = appInfo?.user_code || "";

      // Bước 1: Upload ảnh lên server → nhận về URL
      const uploadResponse = await apiService.uploadImage(
        uri,
        "avatars",        // folderName — chỉnh theo backend của bạn
        userCode,
        true              // show loading
      );

      const avatarUrl = uploadResponse?.file_url || uploadResponse?.data?.file_url;
      if (!avatarUrl) throw new Error("Không nhận được URL ảnh sau khi upload");

      // Bước 2: Gọi API đổi avatar với URL vừa nhận
      await uploadAvatar(avatarUrl);

      showNotification(t("settings.avatar_updated") || "Cập nhật ảnh đại diện thành công!", "success");

      // Bước 3: Refresh profile và AppInfo để UI cập nhật
      await getUserProfile();
      await handleGetAppInfo();
    } catch (error: any) {
      console.error("[SettingsScreen] handlePickAvatar failed:", error);
      showNotification(
        error?.message || t("settings.avatar_update_failed") || "Cập nhật ảnh đại diện thất bại!",
        "error"
      );
    }
  };

  const handleBiometricToggle = async () => {
    const userCode = appInfo?.user_code || "";
    if (userCode) {
      await touchIDClick(userCode);
    }
  };

  const handleClearCache = async () => {
    try {
      clearCategoryCache();
      clearCurrencyCache();
      clearExchangeRateCache();
      clearEventCache();
      clearBudgetCache();
      showNotification(t("settings.cache_cleared") || "Xóa dữ liệu bộ đệm thành công!", "success");
    } catch (error) {
      console.error("[SettingsScreen] Error clearing cache:", error);
      showNotification("Xóa dữ liệu bộ đệm thất bại!", "error");
    }
  };

  const handleApplyLanguage = async (lang: string) => {
    await changeLanguage(lang);
    setShowLanguageModal(false); // ✅ Đóng modal sau khi chọn
  };

  // ✅ Tạo danh sách actions cho modal
  const languageActions: ActionItem[] = [
    {
      id: "vi",
      icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
      label: "Tiếng Việt",
      onPress: () => handleApplyLanguage("vi"),
      color: i18n.language === "vi" ? colors.tint : colors.text,
    },
    {
      id: "en",
      icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
      label: "English",
      onPress: () => handleApplyLanguage("en"),
      color: i18n.language === "en" ? colors.tint : colors.text,
    },
  ];

  // Format currency display text
  const getCurrencyDisplayText = () => {
    if (loading) {
      return "Loading...";
    }
    return `${defaultCurrency.currencyId} (${defaultCurrency.symbol})`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <StatusBar style="light" />
      <AppHeader
        title={t("settings.titleheader")}
        variant="gradient"
        showBackButton={false}
      />
      <ScrollView showsVerticalScrollIndicator={false} style={{ paddingTop: normalize(25) }}>

        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper}>
            <Image
              source={
                appInfo?.avatar?.startsWith("http")
                  ? { uri: appInfo.avatar }
                  : Images.placeholder.avatar
              }
              style={styles.profileImage}
            />
            <View style={[styles.cameraOverlay, { backgroundColor: colors.tint }]}>
              <Ionicons name="camera-outline" size={normalize(14)} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Giữ nguyên 2 dòng text bên dưới */}
          <CustomText style={[styles.profileName, { color: colors.text }]}>
            {profile
              ? `${profile.last_name || ""} ${profile.middle_name || ""} ${profile.first_name || ""}`.trim()
              : t("common.loading")}
          </CustomText>
          <CustomText style={[styles.profileEmail, { color: colors.icon }]}>
            {profile?.email || "..."}
          </CustomText>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            {t("settings.account")}
          </CustomText>
          <View style={[styles.settingsList, { backgroundColor: colors.card }]}>
            <SettingItem
              icon="setting_screen_user_info"
              title={t("settings.personal_info")}
              onPress={() => {
                router.push("/(protected)/profile");
              }}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_my_wallet"
              title={t("settings.my_wallet")}
              onPress={() => {
                router.push({
                  pathname: "/(protected)/wallet/wallet-list",
                  params: { mode: "manage" },
                });
              }}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_group"
              title={t("settings.group")}
              onPress={() => {
                router.push("/(protected)/category-management");
              }}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_pay_book"
              title={t("settings.paybook")}
              onPress={() => {
                router.push("/(protected)/paybook");
              }}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_invoice"
              title={t("settings.invoice")}
              onPress={() => {
                router.push({
                  pathname: "/(protected)/invoice/invoice-list",
                });
              }}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_event"
              title={t("settings.event")}
              onPress={() => {
                router.push({
                  pathname: "/(protected)/event/event-list",
                  params: {
                    mode: "manage",
                  },
                });
              }}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_recurring_invoice"
              title={t("settings.recurring_transaction")}
              onPress={() => {
                router.push({
                  pathname: "/(protected)/invoice/recurring-list",
                });
              }}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_tool"
              title={t("settings.tools")}
              onPress={() => {
                router.push("/(protected)/tools");
              }}
              colors={colors}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            {t("settings.app_settings")}
          </CustomText>
          <View style={[styles.settingsList, { backgroundColor: colors.card }]}>
            <SettingItemWithSwitch
              icon="setting_screen_notification"
              title={t("settings.notifications")}
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_transaction_reminder"
              title={t("settings.transaction_reminder")}
              value="OFF"
              onPress={() => { }}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_notification"
              title={t("settings.spending_warning")}
              subtitle={t("settings.spending_warning_subtitle")}
              onPress={() => {
                router.push("/(protected)/spending-warning");
              }}
              colors={colors}
            />
            <SettingItemWithSwitch
              icon="setting_screen_biomatric"
              title={t("settings.biometrics")}
              subtitle={t("settings.biometrics_subtitle")}
              value={isUsingTouchID}
              onValueChange={handleBiometricToggle}
              colors={colors}
            />
            <SettingItemWithSwitch
              icon="setting_screen_dark_mode"
              title={t("settings.dark_mode")}
              value={isDark}
              onValueChange={(val: boolean) => {
                setMode(val ? "dark" : "light");
              }}
              colors={colors}
            />
            {/* ✅ Thay đổi chỗ này - mở modal thay vì Alert */}
            <SettingItem
              icon="setting_screen_language"
              title={t("common.language")}
              value={languageMap[i18n.language] || i18n.language}
              onPress={() => setShowLanguageModal(true)}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_currency"
              title={t("settings.currency")}
              value={getCurrencyDisplayText()}
              onPress={() => {
                router.push({
                  pathname: "/(protected)/select-currency",
                  params: {
                    selectedCurrencyId: defaultCurrency.currencyId,
                  },
                });
              }}
              colors={colors}
            />
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            {t("settings.data_privacy")}
          </CustomText>
          <View style={[styles.settingsList, { backgroundColor: colors.card }]}>
            <SettingItem
              icon="setting_screen_change_pass"
              title={t("settings.change_password")}
              onPress={() => {
                router.push("/(protected)/change-password");
              }}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_privacy"
              title={t("settings.privacy_policy")}
              onPress={() => {
                router.push("/(protected)/privacy-policy");
              }}
              colors={colors}
            />
            {/* <SettingItem
              icon="setting_screen_login_info"
              title={t("settings.login_info")}
              onPress={() => {
                router.push("/(protected)/login-info");
              }}
              colors={colors}
            /> */}
            <SettingItem
              icon="setting_screen_app_info"
              title={t("settings.app_info")}
              value={`v${Constants.expoConfig?.version || "1.0.0"}`}
              onPress={() => {
                router.push("/(protected)/app-info");
              }}
              colors={colors}
            />
            {/* <SettingItem
              icon="trash-outline"
              title={t("settings.clear_cache") || "Xóa dữ liệu bộ đệm"}
              onPress={handleClearCache}
              colors={colors}
            /> */}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.card }]}
          onPress={() => {
            handleLogout();
          }}
        >
          <Ionicons
            name="log-out-outline"
            size={normalize(20)}
            color="#FF3B30"
          />
          <CustomText style={styles.logoutText}>{t("common.logout")}</CustomText>
        </TouchableOpacity>

        <View style={styles.footer}>
          <CustomText style={[styles.footerText, { color: colors.icon }]}>
            © 2025 Finance App. All rights reserved.
          </CustomText>
        </View>
      </ScrollView>

      <BottomActionModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title={t("common.select_language")}
        subtitle={t("settings.language_subtitle") || "Chọn ngôn ngữ hiển thị"}
        actions={languageActions}
        colors={colors}
        cancelText={t("common.cancel")}
        hasBottomNav={true}
      />
    </SafeAreaView>
  );
};

// Setting Item Component
const SettingItem = ({
  icon,
  title,
  subtitle,
  value,
  badge,
  onPress,
  colors,
}: any) => (
  <TouchableOpacity
    style={[styles.settingItem, { borderBottomColor: colors.border }]}
    onPress={onPress}
  >
    <View style={styles.settingLeft}>
      <View style={styles.settingIconContainer}>
        <AppIcon name={icon} size={normalize(26)} color={colors.tint} type="Ionicons" />
      </View>
      <View style={styles.settingInfo}>
        <CustomText style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </CustomText>
        {subtitle && (
          <CustomText style={[styles.settingSubtitle, { color: colors.icon }]}>
            {subtitle}
          </CustomText>
        )}
      </View>
    </View>
    <View style={styles.settingRight}>
      {badge && (
        <View style={[styles.badge, { backgroundColor: "#FF3B30" }]}>
          <CustomText
            style={[styles.badgeText, { color: Tokens.colors.main.white }]}
          >
            {badge}
          </CustomText>
        </View>
      )}
      {value && (
        <CustomText style={[styles.settingValue, { color: colors.icon }]}>
          {value}
        </CustomText>
      )}
      <AppIcon
        name="chevron-forward"
        size={normalize(20)}
        color={colors.border}
        type="Ionicons"
      />
    </View>
  </TouchableOpacity>
);

// Setting Item with Switch Component
const SettingItemWithSwitch = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  colors,
}: any) => (
  <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
    <View style={styles.settingLeft}>
      <View style={styles.settingIconContainer}>
        <AppIcon name={icon} size={normalize(26)} color={colors.tint} type="Ionicons" />
      </View>
      <View style={styles.settingInfo}>
        <CustomText style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </CustomText>
        {subtitle && (
          <CustomText style={[styles.settingSubtitle, { color: colors.icon }]}>
            {subtitle}
          </CustomText>
        )}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.tint }}
      thumbColor={Tokens.colors.main.white}
      ios_backgroundColor={colors.border}
    />
  </View>
);

const styles = StyleSheet.create({
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

export default SettingsScreen;
