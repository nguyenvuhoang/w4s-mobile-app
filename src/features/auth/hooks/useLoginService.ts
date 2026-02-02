import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { COMMAND_NAME } from "@/constants/CommandName";
import { ChannelId, OTPChannel, OTPTYPE } from "@/constants/Common";
import StorageKey from "@/constants/StorageKey";
import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { GlobalContext } from "@/contexts/GlobalContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useOTP } from "@/contexts/OTPContext";
import { usePushNotification } from "@/contexts/PushNotificationContext";
import { useOTPService } from "@/hooks/useOTPService";
import { authRepository } from "@/services/repositories/auth.repository";
import { otpRepository } from "@/services/repositories/otp.repository";
import StorageService from "@/services/StorageService";
import { AppInfo } from "@/types/UserCommand";
import { encrypt } from "@/utils/Utils";

export const useLoginService = () => {
  // State
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<
    "none" | "fingerprint" | "facial"
  >("none");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFetchingAppInfo, setIsFetchingAppInfo] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Hooks
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { showOTP } = useOTP();
  const router = useRouter();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const {
    setAppInfo: setAppInfoGlobal,
    setGlobalPhone,
    globalPhone,
  } = useContext(GlobalContext);
  const { fcmToken } = usePushNotification();

  useEffect(() => {
    setIsFormValid(username.length > 0 && password.length > 0);
  }, [username, password]);

  useEffect(() => {
    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsBiometricSupported(compatible);

        if (compatible) {
          const types =
            await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (
            Array.isArray(types) &&
            types.includes(
              LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
            )
          ) {
            setBiometricType("facial");
          } else if (
            Array.isArray(types) &&
            types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
          ) {
            setBiometricType("fingerprint");
          }
        } else {
          console.log("Device does not support biometric authentication.");
        }
      } catch (error) {
        console.error("Error checking biometric support:", error);
      }
    })();
  }, []);

  const getBiometricPromptMessage = useCallback(() => {
    return biometricType === "facial"
      ? t("login.faceIdPrompt")
      : t("login.fingerprintPrompt");
  }, [biometricType, t]);

  const goToHome = () => {
    router.replace("/(protected)/(tabs)");
  };

  const getPhoneNumberByUserName = useCallback(
    async (userName: string): Promise<string> => {
      try {
        const response = await authRepository.getPhoneByUserName(
          userName,
          ChannelId.Mobile,
        );

        if (response.isSuccess()) {
          const items = response.getValue("items") as Array<{ phone?: string }>;
          if (items && items.length > 0 && items[0].phone) {
            return items[0].phone;
          }
          return "";
        }
        return "";
      } catch (error: any) {
        showNotification(
          "Phone number for this account not found",
          "error",
          "",
        );
        return "";
      }
    },
    [showNotification],
  );

  const getPhoneNumberByUserCode = useCallback(
    async (userCode: string): Promise<string> => {
      try {
        const channelId = await StorageService.getAsyncItem(
          StorageKey.channelId,
        );
        const response = await authRepository.getPhoneByUserCode(
          userCode,
          channelId,
        );

        if (response.isSuccess()) {
          const items = response.getValue("items") as Array<{ phone?: string }>;
          if (items && items.length > 0 && items[0].phone) {
            return items[0].phone;
          }
          return "";
        }
        return "";
      } catch (error: any) {
        return "";
      }
    },
    [],
  );

  const {
    verifyOTPCode,
    setVerifyOTPCode,
    handleGenerateOTP,
    handleVerifySMSOTP,
    handleResendOTP,
    showLoginOTPModal,
  } = useOTPService();

  /* 
   * This is redundant but needs to be kept to prevent breaking changes in the component
   * until we completely switch over to useOTPService everywhere in this file.
   * However, we are destructuring it above so we don't need to redefine it here.
   * The issue is likely that replace_file_content removed too much context 
   * and broke the file structure (closing braces for the hook).
   * I will restore the file structure properly.
   */

  const checkIsLogged = useCallback(async (): Promise<boolean> => {
    const userSession = await StorageService.getUserSession();
    return !!userSession;
  }, []);

  const handleGetAppInfo = useCallback(async (): Promise<AppInfo | null> => {
    try {
      const response = await authRepository.getAppInfo();
      if (response.isSuccess()) {
        const appInfoData = response.getValue() as AppInfo;
        setAppInfo(appInfoData);
        setAppInfoGlobal(appInfoData);
        await StorageService.setAsyncItem(
          StorageKey.appInfo,
          JSON.stringify(appInfoData),
        );
        await StorageService.setAsyncItem(
          StorageKey.userCode,
          appInfoData.user_code,
        );
        return appInfoData;
      } else {
        showNotification(response.getError(), "error");
        return null;
      }
    } catch (error: any) {
      showNotification(error.message || t("errors.networkError"), "error");
      return null;
    }
  }, [setAppInfoGlobal, showNotification, t]);

  const handleVerifyForgotPassword = useCallback(
    async (
      usernameforgotpassword: string,
      idcard: string,
      phone: string,
      email: string
    ): Promise<{ success: boolean; userCode?: string }> => {
      try {
        console.log("==========Start Verify Forgot Password================");

        if (!usernameforgotpassword || !idcard) {
          showNotification(t("warning.login.emptyUsernamePassword"), "warning");
          return { success: false };
        }

        setIsLoading(true);
        const response = await authRepository.verifyForgotPassword(
          usernameforgotpassword,
          idcard,
          phone,
          email
        );
        
        if (response.isSuccess()) {
          const isvalid = response.getValue("data");
          if (!isvalid) {
            showNotification(t("forgotPassword1.incorrectinformation"), "error");
            return { success: false };
          }

          const userCode = response.getValue("user_code");
          return {
            success: true,
            userCode: typeof userCode === "string" ? userCode : undefined,
          };
        } else {
          showNotification(
            t("forgotPassword1.incorrectinformation") + " " + response.getError(),
            "error"
          );
          console.error("handleVerifyForgotPassword failed:", response.getError());
          return { success: false };
        }
      } catch (error) {
        console.error("Verify failed", error);
        showNotification(t("errors.login.loginFailed"), "error");
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [showNotification, t],
  );

  const handleVerifyOTPAndGetAppInfo = useCallback(
    async (
      otpCode: string,
      phoneVerifyOTP: string,
      verifyOTPCode: string,
      type: string = OTPChannel.ZALO,
    ): Promise<AppInfo | null> => {
      if (!otpCode) return null;
      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
      if (!userCode) {
        throw new Error("Missing user code");
      }
      try {
        const response = await otpRepository.verifySMSOTP({
          phonenumber: phoneVerifyOTP,
          purpose: OTPTYPE.VERIFYLOGIN,
          otpcode: otpCode,
          verifyotpcode: verifyOTPCode,
          usercode: userCode,
          type,
        });

        if (!response.isSuccess()) {
          showNotification(response.getError(), "error", "38942");
          return null;
        }

        const isValid = response.getValue("data");
        if (!isValid) {
          showNotification(t("otpNote.notransactionid"), "error", "38942");
          return null;
        }

        const appInfoData = await handleGetAppInfo();
        if (appInfoData && !appInfoData.is_first_login) {
          await StorageService.setAsyncItem(StorageKey.isVerifyFirstLogin, "true");
          const channelId = await StorageService.getAsyncItem(StorageKey.channelId);
          if (channelId) {
            const isVerifyFirstLogin_channel = `${StorageKey.isVerifyFirstLogin}_${channelId}`;
            await StorageService.setAsyncItem(isVerifyFirstLogin_channel, "true");
          }
        }
        return appInfoData;
      } catch (error) {
        showNotification(t("errors.networkError"), "error");
        return null;
      } finally {
        setIsFetchingAppInfo(false);
      }
    },
    [handleGetAppInfo, showNotification, t],
  );

  const handleVerifyOTPForChangeDeviceAndGetAppInfo = useCallback(
    async (
      otpCode: string,
      phoneVerifyOTP: string,
      verifyOTPCode: string,
      userCode: string,
      dateOfBirth: string,
      licenseID: string,
      licenseType: string,
      type: string = OTPChannel.SMS,
    ): Promise<boolean> => {
      if (!otpCode) return false;

      try {
        const response = await otpRepository.verifySMSOTP({
          phonenumber: phoneVerifyOTP,
          purpose: OTPTYPE.VERIFYLOGIN,
          otpcode: otpCode,
          verifyotpcode: verifyOTPCode,
          type,
        });

        if (!response.isSuccess()) {
          showNotification(response.getError(), "error", "38942");
          return false;
        }

        const isValid = response.getValue("data");
        if (!isValid) {
          showNotification(t("otpNote.notransactionid"), "error", "38942");
          return false;
        }

        const payload = {
          usercode: userCode,
          phone: phoneVerifyOTP,
          dateofbirth: dateOfBirth,
          licenseid: licenseID,
          licensetype: licenseType,
          push_id: fcmToken || "",
        };

        const res = await authRepository.verifyChangeDevice(payload);

        if (res.hasErrors && res.hasErrors()) {
          showNotification(res.getError(), "error");
          return false;
        } else {
          await StorageService.setSecureItem(
            StorageKey.refreshToken,
            res.getValue("refresh_token"),
          );
          await StorageService.setUserSession(res.getValue("token"));
          await authRepository.updateData({
            commandname: COMMAND_NAME.UpdateIsBiometricSupported,
            parameters: { id: userCode, value: 0 },
            workflowid: WORKFLOWCODE.WF_MB_EXECUTE_SQL_FROM_CTH,
          });
          await handleGetAppInfo();
          await StorageService.setAsyncItem(
            StorageKey.isVerifyFirstLogin,
            "true",
          );
          const channelId = await StorageService.getAsyncItem(StorageKey.channelId);
          if (channelId) {
            const isVerifyFirstLogin_channel = `${StorageKey.isVerifyFirstLogin}_${channelId}`;
            await StorageService.setAsyncItem(isVerifyFirstLogin_channel, "true");
          }
          return true;
        }
      } catch (error) {
        showNotification(t("errors.networkError"), "error");
        return false;
      } finally {
        setIsFetchingAppInfo(false);
      }
    },
    [fcmToken, handleGetAppInfo, showNotification, t],
  );

  const handleGetStatusLogin = useCallback(
    async (usercode: string): Promise<boolean> => {
      try {
        const response = await authRepository.getStatusLogin(usercode);

        if (response.isSuccess()) {
          const islogin = response.getValue("data") as boolean;
          return islogin;
        } else {
          showNotification(response.getError(), "error", "");
          return false;
        }
      } catch (error: any) {
        showNotification(t("common.errorException"), "error", "");
        return false;
      }
    },
    [showNotification, t],
  );

  // Flow handlers
  const proceedFirstLoginFlow = useCallback(
    async (username?: string, phoneNumber?: string) => {
      let finalPhoneNumber = phoneNumber;

      if (!finalPhoneNumber && username) {
        setUsername(username);
        finalPhoneNumber = await getPhoneNumberByUserName(username);
      }

      if (!finalPhoneNumber) {
        showNotification(t("auth.otp_fetch_phone_error"), "error");
        return;
      }

      setPhone(finalPhoneNumber);
      setGlobalPhone(finalPhoneNumber);

      const transaction_id = await handleGenerateOTP(
        finalPhoneNumber,
        OTPTYPE.VERIFYLOGIN,
        OTPChannel.ZALO,
      );
      if (transaction_id) {
        setVerifyOTPCode(transaction_id);
        // Get current appInfo before showing modal
        const currentAppInfo = await handleGetAppInfo();
        if (currentAppInfo) {
          showLoginOTPModal(
            finalPhoneNumber,
            transaction_id,
            currentAppInfo,
            OTPChannel.ZALO,
            password,
          );
        }
      }
    },
    [
      getPhoneNumberByUserName,
      setGlobalPhone,
      handleGenerateOTP,
      handleGetAppInfo,
      showLoginOTPModal,
      password,
    ],
  );

  const proceedNormalLoginFlow = useCallback(async () => {
    const result = await handleGetAppInfo();
    if (result) {
      if (!globalPhone) {
        const PhoneNumber = await getPhoneNumberByUserName(result.login_name);
        setGlobalPhone(PhoneNumber);
      }
      goToHome();
    }
  }, [handleGetAppInfo, globalPhone, getPhoneNumberByUserName, setGlobalPhone]);

  const handleBiometricLogin = async () => {
    try {
      console.log("==========Start Biometric Login================");
      if (appInfo === null) return;

      if (!appInfo.is_biometric_supported) {
        showNotification(t("errors.biometric.noSavedCredentials"), "warning");
        return;
      }

      setIsAuthenticating(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: getBiometricPromptMessage(),
        fallbackLabel: t("login.biometricFallback"),
        disableDeviceFallback: false,
      });
      setIsAuthenticating(false);

      if (result.success) {
        setIsLoading(true);
        setIsLoggingIn(true);
        const userSession = await StorageService.getUserSession();
        if (userSession) {
          const refreshToken = await StorageService.getSecureItem(
            StorageKey.refreshToken,
          );
          const response = await authRepository.loginBiometric(refreshToken);

          if (response.isSuccess() && response.getValue(StorageKey.token)) {
            try {
              const userToken = response.getValue(StorageKey.token);
              const refreshToken = response.getValue(StorageKey.refreshToken);
              await StorageService.setSecureItem(
                StorageKey.refreshToken,
                refreshToken,
              );
              const channelId = await StorageService.getAsyncItem(
                StorageKey.channelId,
              );
              const refreshTokenKey = channelId
                ? `${StorageKey.refreshToken}_${channelId}`
                : StorageKey.refreshToken;

              await StorageService.setSecureItem(refreshTokenKey, refreshToken);
              await StorageService.setUserSession(userToken);
              const result = await handleGetAppInfo();
              if (result) {
                if (!globalPhone) {
                  const PhoneNumber = await getPhoneNumberByUserName(
                    result.login_name,
                  );
                  setGlobalPhone(PhoneNumber);
                }
                goToHome();
              }
            } catch (error: any) {
              showNotification(`${error.message || error}`, "error", "38942");
            }
          } else {
            if (!response.getError()) {
              showNotification(t("errors.biometric.failed"), "error");
            } else {
              showNotification(response.getError(), "error");
            }
          }
        } else {
          showNotification(t("errors.biometric.noSavedCredentials"), "warning");
        }
      }
    } catch (error) {
      setIsAuthenticating(false);
      console.error("Biometric login failed", error);
      showNotification(t("errors.biometric.failed"), "error");
    } finally {
      setIsLoading(false);
      setIsLoggingIn(false);
    }
  };

  const handleLogin = useCallback(
    async (isFirstLogin?: boolean) => {
      setIsLoggingIn(true);
      try {
        console.log("==========Start Login================");

        if (
          isBiometricSupported &&
          username.length === 0 &&
          password.length === 0
        ) {
          handleBiometricLogin();
          return;
        }

        if (username.length === 0 || password.length === 0) {
          showNotification(t("warning.login.emptyUsernamePassword"), "warning");
          return;
        }

        const newPassword = `${username}_${password}`;
        const response = await authRepository.login(
          username,
          encrypt(newPassword),
          fcmToken,
        );

        if (response.isSuccess() && response.getValue(StorageKey.token)) {
          try {
            const userToken = response.getValue(StorageKey.token);
            const refreshToken = response.getValue(StorageKey.refreshToken);
            const channelId = await StorageService.getAsyncItem(
              StorageKey.channelId,
            );
            await StorageService.setSecureItem(
              StorageKey.refreshToken,
              refreshToken,
            );
            const refreshTokenKey = channelId
              ? `${StorageKey.refreshToken}_${channelId}`
              : StorageKey.refreshToken;

            await StorageService.setSecureItem(refreshTokenKey, refreshToken);
            await StorageService.setUserSession(userToken);
            const userSessionKey = channelId
              ? `${StorageKey.userSession}_${channelId}`
              : StorageKey.userSession;
            await StorageService.setAsyncItem(
              userSessionKey,
              JSON.stringify({ token: userToken }),
            );

            if (isFirstLogin) {
              await proceedFirstLoginFlow(username);
            } else {
              await proceedNormalLoginFlow();
            }
          } catch (error: any) {
            showNotification(`${error.message || error}`, "error", "38942");
          }
        } else {
          setIsLoggingIn(false);
          if (!response.getError()) {
            showNotification(t("errors.login.loginFailed"), "error");
          } else {
            if (response.getNextAction()) {
              await StorageService.setSecureItem(StorageKey.user, username);
              showNotification(
                response.getError(),
                "warning",
                "0",
                response.getNextAction()
              );
            } else {
              showNotification(response.getError(), "error");
            }
          }
        }
      } catch (error) {
        console.error("Login failed", error);
        showNotification(t("errors.login.loginFailed"), "error");
        setIsLoggingIn(false);
        setIsFetchingAppInfo(false);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [
      username,
      password,
      isBiometricSupported,
      fcmToken,
      handleBiometricLogin,
      proceedFirstLoginFlow,
      proceedNormalLoginFlow,
      showNotification,
      t,
    ],
  );

  const handleForgotPassword = useCallback(async () => {
    router.push("/(auth)/forgot-password" as any);
  }, [router]);

  return {
    username,
    setUsername,
    password,
    phone,
    setPhone,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    isLoggingIn,
    isFetchingAppInfo,
    isFormValid,
    isBiometricSupported,
    biometricType,
    checkIsLogged,
    appInfo,
    setAppInfo,
    handleLogin,
    handleBiometricLogin,
    handleForgotPassword,
    handleGetAppInfo,
    handleVerifyForgotPassword,
    handleVerifyOTPAndGetAppInfo,
    handleVerifyOTPForChangeDeviceAndGetAppInfo,
    handleGenerateOTP,
    handleGetStatusLogin,
    handleResendOTP,
    proceedFirstLoginFlow,
    verifyOTPCode,
    getPhoneNumberByUserName,
    getPhoneNumberByUserCode,
    isAuthenticating,
    showLoginOTPModal,
  };
};