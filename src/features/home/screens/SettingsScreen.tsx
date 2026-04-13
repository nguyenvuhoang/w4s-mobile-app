import CustomText from "@/components/base/CustomText";
import BottomActionModal, { ActionItem } from "@/components/modals/BottomActionModal";
import { GlobalContext } from "@/contexts/GlobalContext";
import { useNotification } from "@/contexts/NotificationContext";
import { changeLanguage, languageMap } from "@/core/i18n/i18n";
import { Tokens } from "@/core/theme/theme";
import { useAppTheme } from "@/core/theme/ThemeContext";
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
import { router, useFocusEffect } from "expo-router";
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
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <CustomText style={[styles.headerTitle, { color: colors.text }]}>
            {t("settings.title")}
          </CustomText>
        </View>

        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: colors.card }]}>
          <Image
            source={
              appInfo?.avatar?.startsWith("http")
                ? { uri: appInfo.avatar }
                : Images.placeholder.avatar
            }
            style={styles.profileImage}
          />
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
              icon="person-outline"
              title={t("settings.personal_info")}
              onPress={() => {
                router.push("/(protected)/profile");
              }}
              colors={colors}
            />
            <SettingItem
              icon="wallet-outline"
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
              icon="cube-outline"
              title={t("settings.group")}
              onPress={() => {
                router.push({
                  pathname: "/(protected)/select-category",
                  params: {
                    isEdit: "true",
                  },
                });
              }}
              colors={colors}
            />
            <SettingItem
              icon="receipt-outline"
              title={t("settings.paybook")}
              onPress={() => {
                router.push("/(protected)/paybook");
              }}
              colors={colors}
            />
            <SettingItem
              icon="document-text-outline"
              title={t("settings.invoice")}
              onPress={() => {
                router.push({
                  pathname: "/(protected)/invoice/invoice-list",
                });
              }}
              colors={colors}
            />
            <SettingItem
              icon="briefcase-outline"
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
              icon="calendar-outline"
              title={t("settings.recurring_transaction")}
              onPress={() => {
                router.push({
                  pathname: "/(protected)/invoice/recurring-list",
                });
              }}
              colors={colors}
            />
            <SettingItem
              icon="construct-outline"
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
              icon="notifications-outline"
              title={t("settings.notifications")}
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              colors={colors}
            />
            <SettingItem
              icon="time-outline"
              title={t("settings.transaction_reminder")}
              value="OFF"
              onPress={() => { }}
              colors={colors}
            />
            <SettingItem
              icon="alert-circle-outline"
              title={t("settings.spending_warning")}
              subtitle={t("settings.spending_warning_subtitle")}
              onPress={() => {
                router.push("/(protected)/spending-warning");
              }}
              colors={colors}
            />
            <SettingItemWithSwitch
              icon="finger-print-outline"
              title={t("settings.biometrics")}
              subtitle={t("settings.biometrics_subtitle")}
              value={isUsingTouchID}
              onValueChange={handleBiometricToggle}
              colors={colors}
            />
            <SettingItemWithSwitch
              icon="moon-outline"
              title={t("settings.dark_mode")}
              value={isDark}
              onValueChange={(val: boolean) => {
                setMode(val ? "dark" : "light");
              }}
              colors={colors}
            />
            {/* ✅ Thay đổi chỗ này - mở modal thay vì Alert */}
            <SettingItem
              icon="language-outline"
              title={t("common.language")}
              value={languageMap[i18n.language] || i18n.language}
              onPress={() => setShowLanguageModal(true)}
              colors={colors}
            />
            <SettingItem
              icon="cash-outline"
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
              icon="lock-closed-outline"
              title={t("settings.change_password")}
              onPress={() => {
                router.push("/(protected)/change-password");
              }}
              colors={colors}
            />
            <SettingItem
              icon="document-text-outline"
              title={t("settings.privacy_policy")}
              onPress={() => {
                router.push("/(protected)/privacy-policy");
              }}
              colors={colors}
            />
            <SettingItem
              icon="phone-portrait-outline"
              title={t("settings.login_info")}
              onPress={() => {
                router.push("/(protected)/login-info");
              }}
              colors={colors}
            />
            <SettingItem
              icon="information-circle-outline"
              title={t("settings.app_info")}
              value={`v${Constants.expoConfig?.version || "1.0.0"}`}
              onPress={() => {
                router.push("/(protected)/app-info");
              }}
              colors={colors}
            />
            <SettingItem
              icon="trash-outline"
              title={t("settings.clear_cache") || "Xóa dữ liệu bộ đệm"}
              onPress={handleClearCache}
              colors={colors}
            />
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
      <View
        style={[
          styles.settingIconContainer,
          { backgroundColor: Tokens.colors.foundation.primary["primary-1"] },
        ]}
      >
        <Ionicons name={icon} size={normalize(22)} color={colors.tint} />
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
      <Ionicons
        name="chevron-forward"
        size={normalize(20)}
        color={colors.border}
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
      <View
        style={[
          styles.settingIconContainer,
          { backgroundColor: Tokens.colors.foundation.primary["primary-1"] },
        ]}
      >
        <Ionicons name={icon} size={normalize(22)} color={colors.tint} />
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
    padding: normalize(24),
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
    padding: normalize(16),
    borderBottomWidth: 1,
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
});

export default SettingsScreen;