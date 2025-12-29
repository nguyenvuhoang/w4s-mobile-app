import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { COMMAND_NAME } from '@/constants/CommandName';
import { OTPTYPE } from '@/constants/Common';
import StorageKey from '@/constants/StorageKey';
import { WORKFLOWCODE } from '@/constants/WorkflowCode';
import { GlobalContext } from '@/contexts/GlobalContext';
import { useNotification } from '@/contexts/NotificationContext';
import { usePushNotification } from '@/contexts/PushNotificationContext';
import { changeLanguage as i18nChangeLanguage } from '@/core/i18n/i18n';
import { authRepository } from '@/services/repositories/auth.repository';
import StorageService from '@/services/StorageService';
import { AppInfo } from '@/types/UserCommand';
import { encrypt } from '@/utils/Utils';

export const useLoginService = () => {
  // State
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<'none' | 'fingerprint' | 'facial'>('none');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFetchingAppInfo, setIsFetchingAppInfo] = useState(false);
  const [verifyOTPCode, setVerifyOTPCode] = useState<string>('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Hooks
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const { setAppInfo: setAppInfoGlobal, setGlobalPhone, globalPhone } = useContext(GlobalContext);
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
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (
            Array.isArray(types) &&
            types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
          ) {
            setBiometricType('facial');
          } else if (
            Array.isArray(types) &&
            types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
          ) {
            setBiometricType('fingerprint');
          }
        } else {
          console.log('Device does not support biometric authentication.');
        }
      } catch (error) {
        console.error('Error checking biometric support:', error);
      }
    })();
  }, []);

  const getBiometricPromptMessage = useCallback(() => {
    return biometricType === 'facial' ? t('login.faceIdPrompt') : t('login.fingerprintPrompt');
  }, [biometricType, t]);

  const handleChangeLanguage = useCallback(async (lang: string) => {
    await i18nChangeLanguage(lang);
  }, []);

  const goToHome = () => {
    router.replace('/(protected)/(tabs)');
  };

  const handleBiometricLogin = async () => {
    try {
      console.log('==========Start Biometric Login================');
      if (appInfo === null) return;

      if (!appInfo.is_biometric_supported) {
        showNotification(t('errors.biometric.noSavedCredentials'), 'warning');
        return;
      }

      setIsAuthenticating(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: getBiometricPromptMessage(),
        fallbackLabel: t('login.biometricFallback'),
        disableDeviceFallback: false,
      });
      setIsAuthenticating(false);

      if (result.success) {
        setIsLoading(true);
        setIsLoggingIn(true);
        const userSession = await StorageService.getUserSession();
        if (userSession) {
          const refreshToken = await StorageService.getSecureItem(StorageKey.refreshToken);
          const response = await authRepository.loginBiometric(refreshToken);

          if (response.isSuccess() && response.getValue(StorageKey.token)) {
            try {
              const userToken = response.getValue(StorageKey.token);
              const refreshToken = response.getValue(StorageKey.refreshToken);
              await StorageService.setSecureItem(StorageKey.refreshToken, refreshToken);
              const channelId = await StorageService.getAsyncItem(StorageKey.channelId);
              const refreshTokenKey = channelId
                ? `${StorageKey.refreshToken}_${channelId}`
                : StorageKey.refreshToken;

              await StorageService.setSecureItem(refreshTokenKey, refreshToken);
              await StorageService.setUserSession(userToken);
              const result = await handleGetAppInfo();
              if (result) {
                if (!globalPhone) {
                  const PhoneNumber = await getPhoneNumberByUserName(result.login_name);
                  setGlobalPhone(PhoneNumber);
                }
                goToHome();
              }
            } catch (error: any) {
              showNotification(`${error.message || error}`, 'error', '38942');
            }
          } else {
            if (!response.getError()) {
              showNotification(t('errors.biometric.failed'), 'error');
            } else {
              showNotification(response.getError(), 'error');
            }
          }
        } else {
          showNotification(t('errors.biometric.noSavedCredentials'), 'warning');
        }
      }
    } catch (error) {
      setIsAuthenticating(false);
      console.error('Biometric login failed', error);
      showNotification(t('errors.biometric.failed'), 'error');
    } finally {
      setIsLoading(false);
      setIsLoggingIn(false);
    }
  };

  const proceedFirstLoginFlow = async (username?: string, phoneNumber?: string) => {
    let finalPhoneNumber = phoneNumber;

    if (!finalPhoneNumber && username) {
      setUsername(username);
      finalPhoneNumber = await getPhoneNumberByUserName(username);
    }

    if (!finalPhoneNumber) {
      console.warn('Cần cung cấp username hoặc phoneNumber');
      return;
    }

    setPhone(finalPhoneNumber);
    setGlobalPhone(finalPhoneNumber);

    const transaction_id = await handleGenerateLoginOTP(finalPhoneNumber);
    if (transaction_id) {
      setVerifyOTPCode(transaction_id);
      setShowOtpModal(true);
    }
  };

  const proceedNormalLoginFlow = async () => {
    const result = await handleGetAppInfo();
    if (result) {
      if (!globalPhone) {
        const PhoneNumber = await getPhoneNumberByUserName(result.login_name);
        setGlobalPhone(PhoneNumber);
      }
      goToHome();
    }
  };

  const handleLogin = useCallback(
    async (isFirstLogin?: boolean) => {
      setIsLoggingIn(true);
      try {
        console.log('==========Start Login================');

        if (isBiometricSupported && username.length === 0 && password.length === 0) {
          handleBiometricLogin();
          return;
        }

        if (username.length === 0 || password.length === 0) {
          showNotification(t('warning.login.emptyUsernamePassword'), 'warning');
          return;
        }

        const newPassword = `${username}_${password}`;
        const response = await authRepository.login(username, encrypt(newPassword), fcmToken);

        if (response.isSuccess() && response.getValue(StorageKey.token)) {
          try {
            const userToken = response.getValue(StorageKey.token);
            const refreshToken = response.getValue(StorageKey.refreshToken);
            const channelId = await StorageService.getAsyncItem(StorageKey.channelId);
            await StorageService.setSecureItem(StorageKey.refreshToken, refreshToken);
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
              JSON.stringify({ token: userToken })
            );

            if (isFirstLogin) {
              await proceedFirstLoginFlow(username);
            } else {
              await proceedNormalLoginFlow();
            }
          } catch (error: any) {
            showNotification(`${error.message || error}`, 'error', '38942');
          }
        } else {
          setIsLoggingIn(false);
          if (!response.getError()) {
            showNotification(t('errors.login.loginFailed'), 'error');
          } else {
            if (response.getNextAction()) {
              await StorageService.setSecureItem(StorageKey.user, username);
              showNotification(
                response.getError(),
                'warning',
                '0',
                response.getNextAction()
              );
            } else {
              showNotification(response.getError(), 'error');
            }
          }
        }
      } catch (error) {
        console.error('Login failed', error);
        showNotification(t('errors.login.loginFailed'), 'error');
        setIsLoggingIn(false);
        setIsFetchingAppInfo(false);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [username, password, isBiometricSupported, handleBiometricLogin, showNotification, t]
  );

  const handleForgotPassword = () => {
    router.push('/(auth)/forgotPassword' as any);
  };

  const handleVerifyForgotPassword = useCallback(
    async (
      usernameforgotpassword: string,
      idcard: string,
      phone: string,
      email: string
    ): Promise<{ success: boolean; userCode?: string }> => {
      try {
        console.log('==========Start Verify Forgot Password================');

        if (!usernameforgotpassword || !idcard) {
          showNotification(t('warning.login.emptyUsernamePassword'), 'warning');
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
          const isvalid = response.getValue('data');
          if (!isvalid) {
            showNotification(t('forgotPassword1.incorrectinformation'), 'error');
            return { success: false };
          }

          const userCode = response.getValue('user_code');
          return {
            success: true,
            userCode: typeof userCode === 'string' ? userCode : undefined,
          };
        } else {
          showNotification(
            t('forgotPassword1.incorrectinformation') + ' ' + response.getError(),
            'error'
          );
          console.error('handleVerifyForgotPassword failed:', response.getError());
          return { success: false };
        }
      } catch (error) {
        console.error('Verify failed', error);
        showNotification(t('errors.login.loginFailed'), 'error');
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [showNotification, t]
  );

  const handleGetAppInfo = useCallback(
    async (isShowNoti: boolean = true): Promise<AppInfo | null> => {
      try {
        console.log('==========Call APP_INFO================');
        const appInfoResponse = await authRepository.getAppInfo();

        if (appInfoResponse.isSuccess()) {
          const appInfoData: AppInfo = {
            user_code: appInfoResponse.getValue('user_code') ?? '',
            avatar: appInfoResponse.getValue('avatar') ?? '',
            user_command: appInfoResponse.getValue('user_command') ?? [],
            name: appInfoResponse.getValue('name') ?? '',
            is_first_login: appInfoResponse.getValue('is_first_login') ?? false,
            login_name: appInfoResponse.getValue('login_name', 'string') ?? '',
            contract_number: appInfoResponse.getValue('contract_number') ?? '',
            is_biometric_supported: appInfoResponse.getValue('is_biometric_supported') ?? false,
            is_smart_otp_active: appInfoResponse.getValue('is_smart_otp_active') ?? false,
            is_login: appInfoResponse.getValue('is_login') ?? false,
            user_banner: appInfoResponse.getValue('user_banner') || 'default',
          };

          await StorageService.setAsyncItem(StorageKey.appInfo, JSON.stringify(appInfoData));
          const channelId = await StorageService.getAsyncItem(StorageKey.channelId);
          if (channelId) {
            const withChannel = (key: string) => `${key}_${channelId}`;
            await StorageService.setAsyncItem(
              withChannel(StorageKey.appInfo),
              JSON.stringify(appInfoData)
            );
            await StorageService.setAsyncItem(
              withChannel(StorageKey.HeaderBackground),
              appInfoData?.user_banner ?? 'default'
            );
          }

          setAppInfo(appInfoData);
          setAppInfoGlobal(appInfoData);
          console.log('APP_INFO:', JSON.stringify(appInfoData));
          return appInfoData;
        } else {
          if (isShowNoti)
            showNotification(appInfoResponse.getError() || t('common.errorException'), 'error');
          return null;
        }
      } catch (error) {
        showNotification(t('errors.networkError'), 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showNotification, t, setAppInfoGlobal]
  );

  const checkIsLogged = useCallback(async () => {
    try {
      const isVerifyFirstLogin = await StorageService.getAsyncItem(
        StorageKey.isVerifyFirstLogin
      );
      console.log('checkIsLogged', isVerifyFirstLogin);
      if (isVerifyFirstLogin) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }, []);

  const handleVerifyOTPAndGetAppInfo = async (
    otpCode: string,
    phoneVerifyOTP: string,
    verifyOTPCode: string
  ): Promise<AppInfo | null> => {
    if (!otpCode) return null;

    try {
      console.log('==========Call Verify SMS OTP================');
      const response = await authRepository.verifySMSOTP({
        phonenumber: phoneVerifyOTP,
        purpose: OTPTYPE.VERIFYLOGIN,
        otpcode: otpCode,
        verifyotpcode: verifyOTPCode,
      });

      if (!response.isSuccess()) {
        showNotification(
          `${response.getError()}`,
          'error',
          '38942',
          '',
          undefined,
          () => setShowOtpModal(true)
        );
        return null;
      }

      const isValid = response.getValue('data');
      if (!isValid) {
        showNotification(`${t('otpNote.notransactionid')}`, 'error', '38942');
        return null;
      }

      const appInfoData = await handleGetAppInfo();
      if (appInfoData && !appInfoData.is_first_login) {
        await StorageService.setAsyncItem(StorageKey.isVerifyFirstLogin, 'true');
        const channelId = await StorageService.getAsyncItem(StorageKey.channelId);
        const isVerifyFirstLogin_channel = `${StorageKey.isVerifyFirstLogin}_${channelId}`;
        await StorageService.setAsyncItem(isVerifyFirstLogin_channel, 'true');
      }
      return appInfoData;
    } catch (error) {
      showNotification(t('errors.networkError'), 'error');
      return null;
    } finally {
      setIsFetchingAppInfo(false);
    }
  };

  const handleVerifyOTPForChangeDeviceAndGetAppInfo = async (
    otpCode: string,
    phoneVerifyOTP: string,
    verifyOTPCode: string,
    userCode: string,
    dateOfBirth: string,
    licenseID: string,
    licenseType: string
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
        showNotification(
          `${response.getError()}`,
          'error',
          '38942',
          '',
          undefined,
          () => setShowOtpModal(true)
        );
        return false;
      }

      const isValid = response.getValue('data');
      if (!isValid) {
        showNotification(
          `${t('otpNote.notransactionid')}`,
          'error',
          '38942',
          '',
          undefined,
          () => setShowOtpModal(true)
        );
        return false;
      }

      const payload = {
        usercode: userCode,
        phone: phoneVerifyOTP,
        dateofbirth: dateOfBirth,
        licenseid: licenseID,
        licensetype: licenseType,
        push_id: fcmToken || '',
      };

      const res = await authRepository.verifyChangeDevice(payload);

      if (res.hasErrors && res.hasErrors()) {
        showNotification(res.getError(), 'error');
        return false;
      } else {
        await StorageService.setSecureItem(StorageKey.refreshToken, res.getValue('refresh_token'));
        await StorageService.setUserSession(res.getValue('token'));
        await authRepository.updateData({
          commandname: COMMAND_NAME.UpdateIsBiometricSupported,
          parameters: { id: userCode, value: 0 },
          workflowid: WORKFLOWCODE.MB_EXECUTE_SQL_FROM_CTH,
        });
        await handleGetAppInfo();
        await StorageService.setAsyncItem(StorageKey.isVerifyFirstLogin, 'true');
        const channelId = await StorageService.getAsyncItem(StorageKey.channelId);
        const isVerifyFirstLogin_channel = `${StorageKey.isVerifyFirstLogin}_${channelId}`;
        await StorageService.setAsyncItem(isVerifyFirstLogin_channel, 'true');
        return true;
      }
    } catch (error) {
      showNotification(t('errors.networkError'), 'error');
      return false;
    } finally {
      setIsFetchingAppInfo(false);
    }
  };

  const handleGenerateLoginOTP = useCallback(
    async (phonenumber: string): Promise<string | null> => {
      try {
        const response = await authRepository.generateOTP({
          phonenumber,
          purpose: OTPTYPE.VERIFYLOGIN,
          withoutsession: true,
        });

        if (response.isSuccess()) {
          const transaction_id = response.getValue('transaction_id') as string;
          if (transaction_id) {
            return transaction_id;
          } else {
            showNotification(t('otpNote.notransactionid'), 'error', '38942');
            return null;
          }
        } else {
          showNotification(
            response.getError() ?? t('errors.login.verifyFailed'),
            'error',
            '38942'
          );
          return null;
        }
      } catch (error: any) {
        showNotification(error.message || t('errors.login.verifyFailed'), 'error', '38942');
        return null;
      }
    },
    [showNotification, t]
  );

  const handleResendOTP = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const transaction_id = await handleGenerateLoginOTP(username);
      if (transaction_id) {
        setVerifyOTPCode(transaction_id);
        return { success: true };
      } else {
        return { success: false, error: 'Resend OTP failed' };
      }
    } catch (error) {
      return {
        success: false,
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message?: string }).message || 'Resend OTP failed'
            : 'Resend OTP failed',
      };
    }
  };

  const handleGetStatusLogin = useCallback(
    async (usercode: string): Promise<boolean> => {
      try {
        const response = await authRepository.getStatusLogin(usercode);

        if (response.isSuccess()) {
          const islogin = response.getValue('data') as boolean;
          return islogin;
        } else {
          showNotification(response.getError(), 'error', '');
          return false;
        }
      } catch (error: any) {
        showNotification(t('common.errorException'), 'error', '');
        return false;
      }
    },
    [showNotification, t]
  );

  const getPhoneNumberByUserName = useCallback(
    async (userName: string): Promise<string> => {
      try {
        const channelId = await StorageService.getAsyncItem(StorageKey.channelId);
        const response = await authRepository.getPhoneByUserName(userName, channelId);

        if (response.isSuccess()) {
          const items = response.getValue('items') as Array<{ phone?: string }>;
          if (items && items.length > 0 && items[0].phone) {
            return items[0].phone;
          }
          return '';
        }
        return '';
      } catch (error: any) {
        showNotification('Phone number for this account not found', 'error', '');
        return '';
      }
    },
    [showNotification]
  );

  const getPhoneNumberByUserCode = useCallback(async (userCode: string): Promise<string> => {
    try {
      const channelId = await StorageService.getAsyncItem(StorageKey.channelId);
      const response = await authRepository.getPhoneByUserCode(userCode, channelId);

      if (response.isSuccess()) {
        const items = response.getValue('items') as Array<{ phone?: string }>;
        if (items && items.length > 0 && items[0].phone) {
          return items[0].phone;
        }
        return '';
      }
      return '';
    } catch (error: any) {
      return '';
    }
  }, []);

  return {
    username,
    setUsername,
    password,
    phone,
    setPhone,
    setPassword,
    showPassword,
    setShowPassword,
    showOtpModal,
    setShowOtpModal,
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
    handleResendOTP,
    proceedFirstLoginFlow,
    verifyOTPCode,
    getPhoneNumberByUserName,
    getPhoneNumberByUserCode,
    isAuthenticating,
  };
};