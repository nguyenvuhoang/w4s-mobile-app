import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { COMMAND_NAME } from "@/constants/CommandName";
import { OTPTYPE } from "@/constants/Common";
import StorageKey from "@/constants/StorageKey";
import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { GlobalContext } from "@/contexts/GlobalContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useOTP } from "@/contexts/OTPContext";
import { usePushNotification } from "@/contexts/PushNotificationContext";
import { changeLanguage as i18nChangeLanguage } from "@/core/i18n/i18n";
import { authRepository } from "@/services/repositories/auth.repository";
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
  const [verifyOTPCode, setVerifyOTPCode] = useState<string>("");
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

  const handleChangeLanguage = useCallback(async (lang: string) => {
    await i18nChangeLanguage(lang);
  }, []);

  const goToHome = () => {
    router.replace("/(protected)/(tabs)");
  };

  // ✅ FIX 3: Move these functions UP before showLoginOTPModal uses them
  const getPhoneNumberByUserName = useCallback(
    async (userName: string): Promise<string> => {
      try {
        const channelId = await StorageService.getAsyncItem(
          StorageKey.channelId,
        );
        const response = await authRepository.getPhoneByUserName(
          userName,
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

  const handleGenerateLoginOTP = useCallback(
    async (phonenumber: string): Promise<string | null> => {
      try {
        const response = await authRepository.generateOTP({
          phonenumber,
          purpose: OTPTYPE.VERIFYLOGIN,
          withoutsession: true,
        });

        if (response.isSuccess()) {
          const transaction_id = response.getValue("transaction_id") as string;
          if (transaction_id) {
            return transaction_id;
          } else {
            showNotification(t("otpNote.notransactionid"), "error", "38942");
            return null;
          }
        } else {
          showNotification(
            response.getError() ?? t("errors.login.verifyFailed"),
            "error",
            "38942",
          );
          return null;
        }
      } catch (error: any) {
        showNotification(
          error.message || t("errors.login.verifyFailed"),
          "error",
          "38942",
        );
        return null;
      }
    },
    [showNotification, t],
  );

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
      otpCode: string,
      phoneVerifyOTP: string,
      verifyOTPCode: string,
    ): Promise<boolean> => {
      if (!otpCode) return false;

      try {
        const response = await authRepository.verifySMSOTP({
          phonenumber: phoneVerifyOTP,
          purpose: OTPTYPE.VERIFYLOGIN,
          otpcode: otpCode,
          verifyotpcode: verifyOTPCode,
        });

        if (response.isSuccess()) {
          return response.getValue("data") as boolean;
        } else {
          showNotification(response.getError(), "error", "38942");
          return false;
        }
      } catch (error) {
        showNotification(t("errors.networkError"), "error");
        return false;
      }
    },
    [showNotification, t],
  );

  const handleVerifyOTPAndGetAppInfo = useCallback(
    async (
      otpCode: string,
      phoneVerifyOTP: string,
      verifyOTPCode: string,
    ): Promise<AppInfo | null> => {
      if (!otpCode) return null;

      try {
        const response = await authRepository.verifySMSOTP({
          phonenumber: phoneVerifyOTP,
          purpose: OTPTYPE.VERIFYLOGIN,
          otpcode: otpCode,
          verifyotpcode: verifyOTPCode,
        });

        if (!response.isSuccess()) {
          showNotification(response.getError(), "error", "38942");
          return null;
        }

        const isValid = response.getValue("data");
        if (!isValid) {
          showNotification(t("otpNote.invalidOTP"), "error", "38942");
          return null;
        }

        const appInfo = await handleGetAppInfo();
        return appInfo;
      } catch (error) {
        showNotification(t("errors.networkError"), "error");
        return null;
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
    ): Promise<boolean> => {
      if (!otpCode) return false;

      try {
        const response = await authRepository.verifySMSOTP({
          phonenumber: phoneVerifyOTP,
          purpose: OTPTYPE.VERIFYLOGIN,
          otpcode: otpCode,
          verifyotpcode: verifyOTPCode,
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

  // ✅ Now showLoginOTPModal can use the functions above
  const showLoginOTPModal = useCallback(
    async (phoneNumber: string, transactionId: string) => {
      showOTP({
        title: t("otpModal.title"),
        description: t("otpModal.loginDescription", { phone: phoneNumber }),
        isresend: true,
        blockSeconds: 120,
        showOtpCode: true,

        // Verify OTP Handler
        handleVerifyOTP: async (otpCode: string) => {
          try {
            const appInfo = await handleVerifyOTPAndGetAppInfo(
              otpCode,
              phoneNumber,
              transactionId,
            );

            if (appInfo) {
              return { success: true };
            }
            return {
              success: false,
              error: t("errors.login.verifyFailed"),
            };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || t("errors.login.verifyFailed"),
            };
          }
        },

        // Resend OTP Handler
        handleResent: async () => {
          try {
            const newTransactionId = await handleGenerateLoginOTP(phoneNumber);
            if (newTransactionId) {
              setVerifyOTPCode(newTransactionId);
              return { success: true };
            }
            return {
              success: false,
              error: t("otpNote.resentFailed"),
            };
          } catch (error: any) {
            return {
              success: false,
              error: error.message || t("otpNote.resentFailed"),
            };
          }
        },

        // ✅ FIX 1: These callbacks are now supported in OTPConfig
        // Success Callback
        onSuccess: () => {
          console.log("✅ OTP Verified Successfully");
          // Check if first login and navigate
          if (appInfo?.is_first_login) {
            router.replace("/(auth)/change-password" as any);
          } else {
            router.replace("/(protected)/(tabs)");
          }
        },

        // ✅ FIX 2: Add explicit type for error parameter
        // Error Callback
        onError: (error: string) => {
          console.error("❌ OTP Verification Error:", error);
          showNotification(error, "error");
        },

        // Close Callback
        onClose: () => {
          console.log("🔒 OTP Modal Closed");
          setIsLoggingIn(false);
        },
      });
    },
    [
      showOTP,
      t,
      router,
      appInfo,
      showNotification,
      handleVerifyOTPAndGetAppInfo,
      handleGenerateLoginOTP,
    ],
  );

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

  // const proceedFirstLoginFlow = useCallback(
  //   async (username?: string, phoneNumber?: string) => {
  //     let finalPhoneNumber = phoneNumber;

  //     if (!finalPhoneNumber && username) {
  //       setUsername(username);
  //       finalPhoneNumber = await getPhoneNumberByUserName(username);
  //     }

  //     if (!finalPhoneNumber) {
  //       console.warn('Cần cung cấp username hoặc phoneNumber');
  //       return;
  //     }

  //     setPhone(finalPhoneNumber);
  //     setGlobalPhone(finalPhoneNumber);

  //     const transaction_id = await handleGenerateLoginOTP(finalPhoneNumber);
  //     if (transaction_id) {
  //       setVerifyOTPCode(transaction_id);
  //       showLoginOTPModal(finalPhoneNumber, transaction_id);
  //     }
  //   },
  //   [getPhoneNumberByUserName, setGlobalPhone, handleGenerateLoginOTP, showLoginOTPModal]
  // );

  // const proceedNormalLoginFlow = async () => {
  //   const result = await handleGetAppInfo();
  //   if (result) {
  //     if (!globalPhone) {
  //       const PhoneNumber = await getPhoneNumberByUserName(result.login_name);
  //       setGlobalPhone(PhoneNumber);
  //     }
  //     goToHome();
  //   }
  // };

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
            // const refreshTokenKey = channelId
            //   ? `${StorageKey.refreshToken}_${channelId}`
            //   : StorageKey.refreshToken;

            // await StorageService.setSecureItem(refreshTokenKey, refreshToken);
            await StorageService.setUserSession(userToken);
            // const userSessionKey = channelId
            //   ? `${StorageKey.userSession}_${channelId}`
            //   : StorageKey.userSession;
            // await StorageService.setAsyncItem(
            //   userSessionKey,
            //   JSON.stringify({ token: userToken }),
            // );

            // if (isFirstLogin) {
            //   await proceedFirstLoginFlow(username);
            // } else {
            //   await proceedNormalLoginFlow();
            await handleGetAppInfo();
            await StorageService.setAsyncItem(
              StorageKey.isVerifyFirstLogin,
              "true",
            );
            goToHome();
            // }
          } catch (error: any) {
            showNotification(`${error.message || error}`, "error", "38942");
          }
        } else {
          showNotification(response.getError(), "error", "38942");
        }
      } catch (error: any) {
        showNotification(`${error.message || error}`, "error", "38942");
      } finally {
        setIsLoggingIn(false);
      }
    },
    [
      username,
      password,
      isBiometricSupported,
      fcmToken,
      // proceedFirstLoginFlow,
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
    handleChangeLanguage,
    handleLogin,
    handleBiometricLogin,
    handleForgotPassword,
    handleGetAppInfo,
    handleVerifyForgotPassword,
    handleVerifyOTPAndGetAppInfo,
    handleVerifyOTPForChangeDeviceAndGetAppInfo,
    handleGenerateLoginOTP,
    handleGetStatusLogin,
    // proceedFirstLoginFlow,
    verifyOTPCode,
    getPhoneNumberByUserName,
    getPhoneNumberByUserCode,
    isAuthenticating,
    showLoginOTPModal,
  };
};
