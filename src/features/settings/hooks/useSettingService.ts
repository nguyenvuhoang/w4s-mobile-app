import * as Constants from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Share } from "react-native";
import Toast from "react-native-toast-message";

import { COMMAND_NAME } from "@/constants/CommandName";
import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { GlobalContext } from "@/contexts/GlobalContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useOTP } from "@/contexts/OTPContext";
import { OTPChannel } from "@/constants/Common";
import StorageKey from "@/constants/StorageKey";
import { AppConfig } from "@/config/AppConfig";
import { changeLanguage as i18nChangeLanguage } from "@/core/i18n/i18n";
import { useLoginService } from "@/features/auth/hooks/useLoginService";
import StorageService from "@/services/StorageService";
import { useApiService } from "@/services/useApiService";
import { otpRepository } from "@/services/repositories/otp.repository";
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
  const [deleteOTPTransactionId, setDeleteOTPTransactionId] = useState<string>("");

  // --- HOOKS ---
  const { t, i18n } = useTranslation();
  const router = useRouter();

  // Custom Hooks
  //   const { reloadCache } = CacheService();
  const { showNotification } = useNotification();
  const { showOTP } = useOTP();
  const { appInfo, globalPhone } = useContext(GlobalContext);
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
              workflowid: WORKFLOWCODE.WF_MB_EXECUTE_SQL_FROM_CTH,
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
          workflowid: WORKFLOWCODE.WF_MB_EXECUTE_SQL_FROM_CTH,
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
        router.replace("/(auth)/quick-login");
        // await handleGetAppInfo();

        // Logic verify first login
        // await StorageService.setItem(
        //   StorageKey.isVerifyFirstLogin,
        //   "true"
        // );
        // const channelId = await StorageService.getItem(
        //   StorageKey.channelId
        // );
        // if (channelId) {
        //   const isVerifyFirstLogin_channel = `${StorageKey.isVerifyFirstLogin}_${channelId}`;
        //   await StorageService.setItem(isVerifyFirstLogin_channel, "true");
        // }
      } else {
        showNotification(t("errors.logout.logoutFailed"), "error");
      }
    } catch (error) {
      showNotification(String(error), "error");
    }
  };

  const handleGenerateOTPForDelete = async (phoneNumber: string, type: string = OTPChannel.ZALO) => {
    try {
      const response = await otpRepository.generateOTP({
        phonenumber: phoneNumber,
        purpose: "DELETEACCOUNT",
        withoutsession: false,
        type,
      });

      if (response.isSuccess()) {
        const transaction_id = response.getValue("transaction_id") as string;
        if (transaction_id) {
          setDeleteOTPTransactionId(transaction_id);
          return transaction_id;
        } else {
          showNotification(t("otpNote.notransactionid"), "error");
          return null;
        }
      } else {
        showNotification(response.getError(), "error");
        return null;
      }
    } catch (error: any) {
      showNotification(error.message || t("errors.login.verifyFailed"), "error");
      return null;
    }
  };

  const handleVerifyOTPForDelete = async (phoneNumber: string, otpCode: string, type: string = OTPChannel.ZALO) => {
    try {
      const userCode = appInfo?.user_code || await StorageService.getItem(StorageKey.userCode);
      const response = await otpRepository.verifySMSOTP({
        phonenumber: phoneNumber,
        purpose: "DELETEACCOUNT",
        otpcode: otpCode,
        verifyotpcode: deleteOTPTransactionId,
        usercode: userCode,
        type,
      });

      if (response.isSuccess()) {
        const isValid = response.getValue("data");
        return !!isValid;
      } else {
        showNotification(response.getError(), "error");
        return false;
      }
    } catch (error: any) {
      showNotification(error.message || t("errors.networkError"), "error");
      return false;
    }
  };

  const executeDeleteAccount = async () => {
    try {
      const userCode = appInfo?.user_code || await StorageService.getItem(StorageKey.userCode);
      if (!userCode) {
        showNotification(t("settings.delete_account_failed") || "Xóa tài khoản thất bại", "error");
        return false;
      }

      const response = await auth.deleteAccount(userCode);

      if (response.isSuccess()) {
        showNotification(
          t("settings.delete_account_success") || "Yêu cầu xóa tài khoản thành công!",
          "success",
          undefined,
          undefined,
          undefined,
          async () => {
            await StorageService.removeItem(StorageKey.appInfo);
            await StorageService.removeItem(StorageKey.user);
            await StorageService.removeItem(StorageKey.isVerifyFirstLogin);
            await StorageService.removeSecureItem(StorageKey.token);
            await StorageService.clearSession();
            router.replace("/(auth)/login");
          }
        );
        return true;
      } else {
        showNotification(
          response.getError() || t("settings.delete_account_failed") || "Xóa tài khoản thất bại",
          "error"
        );
        return false;
      }
    } catch (error) {
      console.error("[useSettingService] executeDeleteAccount error:", error);
      showNotification(t("settings.delete_account_failed") || "Xóa tài khoản thất bại", "error");
      return false;
    }
  };

  const showDeleteOTPModal = async (phoneNumber: string) => {
    showOTP({
      title: t("otpModal.title") || "Xác thực OTP",
      description: t("otpModal.loginDescription", { phone: phoneNumber }) || `Nhập mã OTP đã được gửi đến số điện thoại ${phoneNumber}`,
      isresend: true,
      blockSeconds: 120,
      showOtpCode: true,
      handleVerifyOTP: async (otpCode: string) => {
        const isValid = await handleVerifyOTPForDelete(phoneNumber, otpCode);
        if (isValid) {
          return { success: true };
        }
        return {
          success: false,
          error: t("otpNote.invalidOTP") || "Mã OTP không hợp lệ",
        };
      },
      handleResent: async () => {
        const newTxId = await handleGenerateOTPForDelete(phoneNumber);
        if (newTxId) {
          return { success: true };
        }
        return { success: false, error: "Gửi lại OTP thất bại" };
      },
      onSuccess: async () => {
        await executeDeleteAccount();
      },
      onError: (error: string) => {
        showNotification(error, "error");
      },
    });
  };

  const handleDeleteAccount = async () => {
    showNotification(
      t("settings.delete_account_confirm_message") ||
        "Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác và toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn.",
      "warning",
      undefined,
      undefined,
      async () => {
        if (AppConfig.FEATURES.REQUIRE_OTP_FOR_DELETE_ACCOUNT) {
          const userCode = appInfo?.user_code || await StorageService.getItem(StorageKey.userCode);
          if (!userCode) {
            showNotification(t("settings.delete_account_failed") || "Xóa tài khoản thất bại", "error");
            return;
          }

          let phoneNumber = globalPhone;
          if (!phoneNumber) {
            const phoneRes = await auth.getPhoneByUserCode(userCode, "MB");
            if (phoneRes.isSuccess()) {
              const items = phoneRes.getValue("items") as Array<{ phone?: string }>;
              if (items && items.length > 0 && items[0].phone) {
                phoneNumber = items[0].phone;
              }
            }
          }

          if (!phoneNumber) {
            showNotification(t("auth.otp_fetch_phone_error") || "Không thể lấy số điện thoại", "error");
            return;
          }

          const txId = await handleGenerateOTPForDelete(phoneNumber);
          if (txId) {
            await showDeleteOTPModal(phoneNumber);
          }
        } else {
          await executeDeleteAccount();
        }
      }
    );
  };

    // const handleReloadCache = async () => {
    //   const [ok, message] = await reloadCache();
    //   if (ok) {
    //     showNotification(t('successes.setting.reloadCacheSuccess'), 'success');
    //   } else {
    //     showNotification(message || t('errors.setting.reloadCacheFail'), 'error');
    //   }
    // };

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
        workflowid: WORKFLOWCODE.WF_MB_EXECUTE_SQL_FROM_CTH,
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
    handleDeleteAccount,

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
