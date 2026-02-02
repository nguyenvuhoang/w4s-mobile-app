import { OTPChannel, OTPTYPE } from '@/constants/Common';
import StorageKey from "@/constants/StorageKey";
import { useNotification } from '@/contexts/NotificationContext';
import { useOTP } from '@/contexts/OTPContext';
import { authRepository } from '@/services/repositories/auth.repository';
import { otpRepository } from '@/services/repositories/otp.repository';
import StorageService from '@/services/StorageService';
import { AppInfo } from '@/types/UserCommand';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface UseOTPServiceReturn {
  verifyOTPCode: string;
  setVerifyOTPCode: (value: string) => void;
  handleGenerateOTP: (phoneNumber: string, purpose?: string, type?: string) => Promise<string | null>;
  handleVerifySMSOTP: (phoneNumber: string, otpCode: string, verifyOtpCode: string, purpose: string) => Promise<boolean>;
  handleResendOTP: (phoneNumber: string, purpose?: string, type?: string) => Promise<{ success: boolean; error?: string }>;
  showLoginOTPModal: (phoneNumber: string, transactionId: string, currentAppInfo: AppInfo, type?: string, password?: string) => void;
}

export const useOTPService = (): UseOTPServiceReturn => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { showOTP } = useOTP();
  const router = useRouter();
  const [verifyOTPCode, setVerifyOTPCode] = useState<string>('');

  /**
   * Generates an OTP for a given phone number and purpose.
   */
  const handleGenerateOTP = useCallback(
    async (phoneNumber: string, purpose: string = OTPTYPE.VERIFYLOGIN, type: string = OTPChannel.SMS): Promise<string | null> => {
      try {
        const response = await otpRepository.generateOTP({
          phonenumber: phoneNumber,
          purpose,
          withoutsession: true,
          type
        });

        if (response.isSuccess()) {
          const transaction_id = response.getValue('transaction_id') as string;

          if (transaction_id) {
            setVerifyOTPCode(transaction_id);
            return transaction_id;
          } else {
            showNotification(t('otpNote.notransactionid'), 'error');
            return null;
          }
        } else {
          showNotification(response.getError(), 'error');
          return null;
        }
      } catch (error: any) {
        showNotification(error.message || t('errors.login.verifyFailed'), 'error');
        return null;
      }
    },
    [showNotification, t]
  );

  /**
   * Verifies an SMS OTP.
   */
  const handleVerifySMSOTP = useCallback(
    async (phoneNumber: string, otpCode: string, verifyOtpCode: string, purpose: string = OTPTYPE.VERIFYLOGIN): Promise<boolean> => {
      try {
        const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
        if (!userCode) {
          throw new Error("Missing user code");
        }
        const response = await otpRepository.verifySMSOTP({
          phonenumber: phoneNumber,
          purpose,
          otpcode: otpCode,
          verifyotpcode: verifyOtpCode,
          usercode: userCode,
        });

        if (response.isSuccess()) {
            const isValid = response.getValue('data');
            return !!isValid;
        } else {
          showNotification(response.getError(), 'error');
          return false;
        }
      } catch (error: any) {
        showNotification(error.message || t('errors.networkError'), 'error');
        return false;
      }
    },
    [showNotification, t]
  );

  /**
   * Resends an OTP.
   */
  const handleResendOTP = useCallback(
    async (phoneNumber: string, purpose: string = OTPTYPE.VERIFYLOGIN, type: string = OTPChannel.SMS): Promise<{ success: boolean; error?: string }> => {
      try {
        const transaction_id = await handleGenerateOTP(phoneNumber, purpose, type);
        if (transaction_id) {
          return { success: true };
        } else {
          return { success: false, error: 'Resend OTP failed' };
        }
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Resend OTP failed',
        };
      }
    },
    [handleGenerateOTP]
  );

    /**
   * Fetches App Info and handles post-verification logic (like first login check).
   * This is specific to login flow but placed here to support showLoginOTPModal.
   */
    const handleVerifyOTPAndGetAppInfo = useCallback(
        async (
          otpCode: string,
          phoneVerifyOTP: string,
          verifyOTPCode: string,
        ): Promise<AppInfo | null> => {
          if (!otpCode) return null;
    
          try {
            const isValid = await handleVerifySMSOTP(phoneVerifyOTP, otpCode, verifyOTPCode);
            
            if (!isValid) {
              showNotification(t("otpNote.invalidOTP"), "error");
              return null;
            }
    
            // Fetch AppInfo after successful verification
             const response = await authRepository.getAppInfo();
              if (response.isSuccess()) {
                const appInfoData = response.getValue() as AppInfo;
                
                 await StorageService.setAsyncItem(
                  StorageKey.appInfo,
                  JSON.stringify(appInfoData),
                );
                await StorageService.setAsyncItem(
                  StorageKey.userCode,
                  appInfoData.user_code,
                );

                if (appInfoData && !appInfoData.is_first_login) {
                    await StorageService.setAsyncItem(StorageKey.isVerifyFirstLogin, "true");
                    const channelId = await StorageService.getAsyncItem(StorageKey.channelId);
                    if (channelId) {
                      const isVerifyFirstLogin_channel = `${StorageKey.isVerifyFirstLogin}_${channelId}`;
                      await StorageService.setAsyncItem(isVerifyFirstLogin_channel, "true");
                    }
                  }

                return appInfoData;
              } else {
                 showNotification(response.getError(), "error");
                 return null;
              }

          } catch (error) {
            showNotification(t("errors.networkError"), "error");
            return null;
          }
        },
        [handleVerifySMSOTP, showNotification, t],
      );

  /**
   * Shows the OTP Modal for Login.
   */
  const showLoginOTPModal = useCallback(
    async (phoneNumber: string, transactionId: string, currentAppInfo: AppInfo, type: string = OTPChannel.SMS, password?: string) => {
      let verifiedAppInfo: AppInfo | null = null;

      showOTP({
        title: t('otpModal.title'),
        description: t('otpModal.loginDescription', { phone: phoneNumber }),
        isresend: true,
        blockSeconds: 120,
        showOtpCode: true,
        handleVerifyOTP: async (otpCode: string) => {
             const appInfo = await handleVerifyOTPAndGetAppInfo(
              otpCode,
              phoneNumber,
              transactionId,
            );

            if (appInfo) {
              verifiedAppInfo = appInfo;
              return { success: true };
            }
            return {
              success: false,
              error: t("errors.login.verifyFailed"),
            };
        },
        handleResent: async () => {
          return await handleResendOTP(phoneNumber, OTPTYPE.VERIFYLOGIN, type);
        },
        onSuccess: () => {
          if (currentAppInfo?.is_first_login) {
            router.replace({
              pathname: '/(protected)/change-password',
              params: { oldPassword: password || '', isFirstLogin: 'true' }
            } as any);
          } else {
            router.replace('/(protected)/(tabs)');
          }
        },
        onError: (error: string) => {
           showNotification(error, 'error');
        },
      });
    },
    [showOTP, t, router, handleResendOTP, handleVerifyOTPAndGetAppInfo, showNotification]
  );

  return {
    verifyOTPCode,
    setVerifyOTPCode,
    handleGenerateOTP,
    handleVerifySMSOTP,
    handleResendOTP,
    showLoginOTPModal,
  };
};
