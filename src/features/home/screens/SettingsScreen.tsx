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
import { useIsFocused } from "@react-navigation/native";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Platform,
  ScrollView,
  Switch,
  TouchableOpacity,
  View
} from "react-native";
import DatePicker from "react-native-date-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../styles/SettingsScreen.styles";

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const isFocused = useIsFocused();
  const { t, i18n } = useTranslation();
  const { showNotification } = useNotification();
  const { handleLogout, touchIDClick, isUsingTouchID, handleDeleteAccount } = useSettingService();
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
  const [reminderHour, setReminderHour] = useState<string | null>(null);
  const [showTransactionReminderModal, setShowTransactionReminderModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerDate, setTimePickerDate] = useState(new Date());
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
      const loadReminderSetting = async () => {
        try {
          const savedHour = await StorageService.getItem("transaction_reminder_hour");
          setReminderHour(savedHour || null);
        } catch (e) {
          console.error("Failed to load reminder setting:", e);
        }
      };

      loadSelectedCurrency();
      getUserProfile();
      loadReminderSetting();
    }, [updateDefaultCurrency, getUserProfile]),
  );

  const handlePickAvatar = async () => {
    try {
      // Xin quyền truy cập thư viện ảnh
      if (Platform.OS !== "android") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showNotification(t("settings.photo_permission_denied") || "Cần quyền truy cập thư viện ảnh", "error");
          return;
        }
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

  const handleSetupReminder = async (hourStr: string | null) => {
    try {
      if (hourStr) {
        await StorageService.setItem("transaction_reminder_hour", hourStr);
        setReminderHour(hourStr);
      } else {
        await StorageService.removeItem("transaction_reminder_hour");
        setReminderHour(null);
      }

      const prevNotiId = await StorageService.getItem("transaction_reminder_noti_id");
      if (prevNotiId) {
        await Notifications.cancelScheduledNotificationAsync(prevNotiId);
        await StorageService.removeItem("transaction_reminder_noti_id");
      }

      if (hourStr) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          showNotification(t("settings.notification_permission_denied") || "Vui lòng cấp quyền thông báo để sử dụng tính năng này", "warning");
        }

        let hourNum = 17;
        let minuteNum = 0;
        if (hourStr.includes(":")) {
          const parts = hourStr.split(":");
          hourNum = parseInt(parts[0], 10);
          minuteNum = parseInt(parts[1], 10);
        } else {
          hourNum = parseInt(hourStr, 10);
        }

        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: t("settings.reminder_noti_title") || "⏳ Quên nhập giao dịch hôm nay?",
            body: t("settings.reminder_noti_body") || "Dành 1 phút ghi chép chi tiêu để quản lý tài chính hiệu quả hơn nhé!",
            sound: true,
            data: { screen: "add-transaction" },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hourNum,
            minute: minuteNum,
            repeats: true,
          } as Notifications.NotificationTriggerInput,
        });

        await StorageService.setItem("transaction_reminder_noti_id", identifier);
        const displayTime = hourStr.includes(":") ? hourStr : `${hourStr}:00`;
        showNotification(t("settings.reminder_setup_success", { hour: displayTime }) || `Đã thiết lập nhắc nhở vào ${displayTime} hằng ngày`, "success");
      } else {
        showNotification(t("settings.reminder_cancel_success") || "Đã tắt nhắc nhở nhập giao dịch", "success");
      }
    } catch (error) {
      console.error("[SettingsScreen] handleSetupReminder failed:", error);
      showNotification("Cài đặt nhắc nhở thất bại", "error");
    } finally {
      setShowTransactionReminderModal(false);
    }
  };

  const handleOpenTimePicker = () => {
    let initialDate = new Date();
    if (reminderHour) {
      if (reminderHour.includes(":")) {
        const parts = reminderHour.split(":");
        initialDate.setHours(parseInt(parts[0], 10));
        initialDate.setMinutes(parseInt(parts[1], 10));
      } else {
        initialDate.setHours(parseInt(reminderHour, 10));
        initialDate.setMinutes(0);
      }
    }
    setTimePickerDate(initialDate);
    setShowTimePicker(true);
  };

  const handleTimePickerConfirm = (date: Date) => {
    setShowTimePicker(false);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    handleSetupReminder(timeStr);
  };

  const handleTransactionReminder = () => {
    setShowTransactionReminderModal(true);
  };

  const reminderActions: ActionItem[] = [
    {
      id: "OFF",
      icon: (!reminderHour ? "checkmark-circle" : "notifications-off-outline") as keyof typeof Ionicons.glyphMap,
      label: t("settings.reminder_off") || "Không nhận thông báo",
      onPress: () => handleSetupReminder(null),
      color: !reminderHour ? colors.tint : colors.icon,
    },
    ...[17, 18, 19, 20, 21, 22, 23].map((h) => {
      const isSelected = reminderHour === String(h);
      // 🌟 Thiết kế sang trọng: Trạng thái chọn hiển thị checkmark nổi bật, trạng thái thường map icon trực quan theo buổi
      let iconName = isSelected ? "checkmark-circle" : "time-outline";
      if (!isSelected) {
        if (h === 17) iconName = "partly-sunny-outline"; // Chiều tà
        else if (h >= 18 && h <= 19) iconName = "cloudy-night-outline"; // Tối sớm
        else iconName = "moon-outline"; // Đêm muộn
      }

      return {
        id: String(h),
        icon: iconName as keyof typeof Ionicons.glyphMap,
        label: t("settings.reminder_time", { hour: h }) || `${h}:00 hằng ngày`,
        onPress: () => handleSetupReminder(String(h)),
        color: isSelected ? colors.tint : colors.text,
      };
    }),
    {
      id: "CUSTOM",
      icon: (reminderHour && (reminderHour.includes(":") || ![17, 18, 19, 20, 21, 22, 23].includes(parseInt(reminderHour, 10))) ? "checkmark-circle" : "create-outline") as keyof typeof Ionicons.glyphMap,
      label: t("settings.reminder_custom") || "Tùy chỉnh...",
      onPress: () => {
        setShowTransactionReminderModal(false);
        setTimeout(() => {
          handleOpenTimePicker();
        }, 400);
      },
      color: (reminderHour && (reminderHour.includes(":") || ![17, 18, 19, 20, 21, 22, 23].includes(parseInt(reminderHour, 10)))) ? colors.tint : colors.text,
    }
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
      {isFocused && <StatusBar style="light" />}
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
              ? `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim()
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
            {/* <SettingItem
              icon="setting_screen_transaction_reminder"
              title={t("settings.transaction_reminder")}
              value={reminderHour ? (reminderHour.includes(":") ? reminderHour : `${reminderHour}:00`) : t("settings.reminder_off") || "OFF"}
              onPress={handleTransactionReminder}
              colors={colors}
            /> */}
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
            <SettingItem
              icon="setting_screen_login_info"
              title={t("settings.login_info")}
              onPress={() => {
                router.push("/(protected)/login-info");
              }}
              colors={colors}
            />
            <SettingItem
              icon="setting_screen_app_info"
              title={t("settings.app_info")}
              value={`v${Constants.expoConfig?.version || "1.0.0"}`}
              onPress={() => {
                router.push("/(protected)/app-info");
              }}
              colors={colors}
            />
            <SettingItem
              icon="users_user_cross"
              title={t("settings.delete_account") || "Xóa tài khoản"}
              onPress={handleDeleteAccount}
              colors={colors}
              textColor="#FF3B30"
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

      <BottomActionModal
        visible={showTransactionReminderModal}
        onClose={() => setShowTransactionReminderModal(false)}
        title={t("settings.reminder_title") || "Nhắc nhở nhập giao dịch"}
        subtitle={t("settings.reminder_subtitle") || "Chọn khung giờ nhận thông báo nhắc nhở"}
        actions={reminderActions}
        colors={colors}
        cancelText={t("common.cancel")}
        hasBottomNav={true}
        snapPoints={["90%"]}
      />

      <DatePicker
        modal
        open={showTimePicker}
        date={timePickerDate}
        mode="time"
        theme={isDark ? "dark" : "light"}
        buttonColor={colors.brandBlue || colors.tint}
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        title={t("settings.reminder_title") || "Nhắc nhở nhập giao dịch"}
        onConfirm={handleTimePickerConfirm}
        onCancel={() => setShowTimePicker(false)}
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
  textColor,
}: any) => (
  <TouchableOpacity
    style={[styles.settingItem, { borderBottomColor: colors.border }]}
    onPress={onPress}
  >
    <View style={styles.settingLeft}>
      <View style={styles.settingIconContainer}>
        <AppIcon name={icon} size={normalize(26)} color={textColor || colors.tint} type="Ionicons" />
      </View>
      <View style={styles.settingInfo}>
        <CustomText style={[styles.settingTitle, { color: textColor || colors.text }]}>
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



export default SettingsScreen;
