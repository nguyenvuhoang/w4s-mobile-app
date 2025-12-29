import * as Constants from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Share } from "react-native";
import Toast from "react-native-toast-message";

import { COMMAND_NAME } from "@/constants/CommandName";
import StorageKey from "@/constants/StorageKey";
import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { GlobalContext } from "@/contexts/GlobalContext";
import { useNotification } from "@/contexts/NotificationContext";
import { changeLanguage as i18nChangeLanguage } from "@/core/i18n/i18n";
import { useLoginService } from "@/features/auth/hooks/useLoginService";
import StorageService from "@/services/StorageService";
import { useApiService } from "@/services/useApiService";
import { DeviceInformation } from "@/types/DataType";
import { normalize } from "@/utils/layout";

export const useSettingService = () => {
  // --- STATE ---
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [isUsingTouchID, setIsUsingTouchID] = useState(false);
  const [isShowFloatingBell, setIsShowFloatingBell] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isCheckingBiometric, setIsCheckingBiometric] = useState(true);
  const [biometricType, setBiometricType] = useState<
    "none" | "fingerprint" | "facial"
  >("none");
  const [deviceInformation, setDeviceInformation] = useState<
    DeviceInformation[]
  >([]);

  // --- HOOKS ---
  const { t, i18n } = useTranslation();
  const router = useRouter();

  // Custom Hooks
  //   const { reloadCache } = CacheService();
  const { showNotification } = useNotification();
  const { appInfo } = useContext(GlobalContext);
  const { handleGetAppInfo } = useLoginService();
  //   const { getSearchData, logout, updateData } = useApiService();
  const { auth } = useApiService();

  useEffect(() => {
    checkBiometricSettings();
    checkBiometricSupport();
  }, []);

  // --- LOGIC: BIOMETRIC ---
  const checkBiometricSupport = async () => {
    try {
      setIsCheckingBiometric(true);
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);

      if (compatible) {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (
          Array.isArray(types) &&
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          setBiometricType("facial");
        } else if (
          Array.isArray(types) &&
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          setBiometricType("fingerprint");
        }
      }
    } catch (error) {
      console.error("Error checking biometric support:", error);
    } finally {
      setIsCheckingBiometric(false);
    }
  };

  const checkBiometricSettings = () => {
    const useBiometric = !!appInfo?.is_biometric_supported;
    setIsUsingTouchID(useBiometric);
  };

  const touchIDClick = async (userCode: string) => {
    try {
      if (!isBiometricSupported || userCode === "") {
        showNotification(t("errors.biometric.noBiometric"), "error");
        return;
      }

      const newValue = !isUsingTouchID;

      if (newValue) {
        // Bật Biometric: Cần xác thực trước
        setIsAuthenticating(true);
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage:
            biometricType === "facial"
              ? t("login.faceIdPrompt")
              : t("login.touchIdPrompt"),
          fallbackLabel: t("login.biometricFallback"),
          disableDeviceFallback: false,
        });
        setIsAuthenticating(false);

        if (result.success) {
          const session = await StorageService.getUserSession();
          if (session) {
            await auth.updateData({
              commandname: COMMAND_NAME.UpdateIsBiometricSupported,
              parameters: { id: userCode, value: 1 },
              workflowid: WORKFLOWCODE.MB_EXECUTE_SQL_FROM_CTH,
            });
            await handleGetAppInfo();
            setIsUsingTouchID(true);
            showNotification(
              biometricType === "facial"
                ? t("settings.faceIdEnabled")
                : t("settings.touchIdEnabled"),
              "success"
            );
          } else {
            showNotification(t("errors.biometric.noSession"), "error");
          }
        }
      } else {
        // Tắt Biometric
        await auth.updateData({
          commandname: COMMAND_NAME.UpdateIsBiometricSupported,
          parameters: { id: userCode, value: 0 },
          workflowid: WORKFLOWCODE.MB_EXECUTE_SQL_FROM_CTH,
        });
        await handleGetAppInfo();
        setIsUsingTouchID(false);
        showNotification(t("settings.biometricDisabled"), "success");
      }
    } catch (error) {
      setIsAuthenticating(false);
      console.error("Error toggling biometric:", error);
      showNotification(t("errors.biometric.toggleFailed"), "error");
    }
  };

  // --- LOGIC: LANGUAGE ---
  const languages = [
    { code: "en", name: t("languages.english") },
    { code: "lo", name: t("languages.lao") },
    { code: "zh", name: t("languages.chinese") },
    { code: "vi", name: t("languages.vietnamese") },
  ];

  const toggleLanguageModal = () => {
    setLanguageModalVisible(!isLanguageModalVisible);
  };

  const setLanguage = async (langCode: string) => {
    await i18nChangeLanguage(langCode);
    setLanguageModalVisible(false);
  };

  // --- LOGIC: AUTH / SYSTEM ---
  const handleLogout = async (username?: string) => {
    try {
      const targetUser = username || (appInfo?.login_name as string);
      if (!targetUser) return;

      const logoutResponse = await auth.logout(targetUser);

      if (logoutResponse.isSuccess()) {
        // Navigate về intro screen với expo-router
        router.replace("/(auth)/intro");
        await handleGetAppInfo();

        // Logic verify first login
        await StorageService.setAsyncItem(
          StorageKey.isVerifyFirstLogin,
          "true"
        );
        const channelId = await StorageService.getAsyncItem(
          StorageKey.channelId
        );
        if (channelId) {
          const isVerifyFirstLogin_channel = `${StorageKey.isVerifyFirstLogin}_${channelId}`;
          await StorageService.setAsyncItem(isVerifyFirstLogin_channel, "true");
        }
      } else {
        showNotification(t("errors.logout.logoutFailed"), "error");
      }
    } catch (error) {
      showNotification(String(error), "error");
    }
  };

  //   const handleReloadCache = async () => {
  //     const [ok, message] = await reloadCache();
  //     if (ok) {
  //       showNotification(t('successes.setting.reloadCacheSuccess'), 'success');
  //     } else {
  //       showNotification(message || t('errors.setting.reloadCacheFail'), 'error');
  //     }
  //   };

  const handleShareApp = async () => {
    const iosLink = Constants.default?.expoConfig?.extra?.storeLinks?.ios || "";
    const androidLink =
      Constants.default?.expoConfig?.extra?.storeLinks?.android || "";

    const appLink = Platform.OS === "ios" ? iosLink : androidLink;

    try {
      const shareMessage = `Check out our mobile banking app: ${appLink}`;
      await Share.share({
        message: shareMessage,
        title: "Share App Link",
      });
    } catch (error) {
      console.error("Error sharing app:", error);
      showNotification("Failed to share the app", "error");
    }
  };

  const handleLoadCached = async () => {
    try {
      await handleGetAppInfo();
      Toast.show({
        type: "success",
        position: "bottom",
        text1: "Reload cache Successfully",
        visibilityTime: 3000,
        autoHide: true,
        bottomOffset: normalize(50),
      });
    } catch (error) {
      showNotification("Failed to reload cache", "error");
    }
  };

  const loginDeviceInformation = async () => {
    if (!appInfo?.user_code) return;

    try {
      const loginResponse = await auth.getSearchData({
        workflowid: WORKFLOWCODE.MB_EXECUTE_SQL_FROM_CTH,
        commandname: COMMAND_NAME.SimpleSearchLoginDeviceInformation,
        searchtext: appInfo.user_code,
        pageindex: 1,
        pagesize: 10,
      });

      if (loginResponse.isSuccess()) {
        const deviceInfo = loginResponse.getValue(
          "items"
        ) as DeviceInformation[];
        setDeviceInformation(deviceInfo);
      } else {
        console.error("Failed to fetch app info:", loginResponse.getError());
      }
    } catch (error) {
      console.error("Error navigating to LoginDeviceInformation:", error);
    }
  };

  return {
    // UI State & Actions
    isLanguageModalVisible,
    toggleLanguageModal,
    languages,
    setLanguage,

    // Biometric
    isUsingTouchID,
    isBiometricSupported,
    isCheckingBiometric,
    biometricType,
    isAuthenticating,
    touchIDClick,

    // System
    handleLogout,
    // handleReloadCache,
    handleShareApp,
    handleLoadCached,

    // Device Info
    loginDeviceInformation,
    deviceInformation,

    // Navigation & Utils
    router,
    t,
    i18n,
    isShowFloatingBell,
  };
};
