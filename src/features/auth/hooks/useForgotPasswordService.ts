import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OTPChannel, OTPTYPE } from '@/constants/Common';
import { useNotification } from '@/contexts/NotificationContext';
import { useOTP } from '@/contexts/OTPContext';
import { useOTPService } from '@/hooks/useOTPService';
import { authRepository } from '@/services/repositories/auth.repository';
import { isValidEmail, isValidPhone } from '@/utils/validation';

export const useForgotPasswordService = () => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { showOTP } = useOTP();
  const { handleGenerateOTP, handleVerifySMSOTP, handleResendOTP } = useOTPService();
  const router = useRouter();

  const handleResetPassword = useCallback(async (userCode: string, userEmail: string) => {
    try {
      setIsLoading(true);
      const response = await authRepository.resetPassword(userCode, userEmail);

      if (response.isSuccess()) {
        showNotification(t('auth.reset_password_success_email'), 'success');
        router.replace('/(auth)/login' as any);
        return true;
      } else {
        showNotification(response.getError() || t('auth.reset_password_failed'), 'error');
        return false;
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      showNotification(error.message || t('common.network_error'), 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showNotification, t, router]);

  const handleCheckUserAndSendOTP = useCallback(async () => {
    if (!phone || !email) {
      showNotification(t('auth.forgot_password_fill_all_fields'), 'warning');
      return;
    }

    if (!isValidPhone(phone)) {
      showNotification(t('validation.invalid_phone'), 'warning');
      return;
    }

    if (!isValidEmail(email)) {
      showNotification(t('validation.invalid_email'), 'warning');
      return;
    }

    try {
      setIsLoading(true);
      // 1. Verify info and get UserCode
      const response = await authRepository.verifyResetInfo(phone, email);

      if (response.isSuccess()) {
        const results = response.getValue<any[]>('data');
        const userCode = results && results.length > 0 ? results[0].usercode : null;

        if (userCode) {
          // 2. Generate OTP via ZALO
          const transactionId = await handleGenerateOTP(phone, OTPTYPE.RESETPASSWORD, OTPChannel.ZALO);
          
          if (transactionId) {
            // 3. Show OTP Modal
            showOTP({
              title: t('otpModal.title'),
              description: t('otpModal.resetPasswordDescription', { phone }),
              isresend: true,
              handleResent: async () => {
                return await handleResendOTP(phone, OTPTYPE.RESETPASSWORD, OTPChannel.ZALO);
              },
              handleVerifyOTP: async (otpCode: string) => {
                const isValid = await handleVerifySMSOTP(phone, otpCode, transactionId, OTPTYPE.RESETPASSWORD);
                if (!isValid) {
                  return { success: false, error: t('otpNote.invalidOTP') };
                }

                const resetSuccess = await handleResetPassword(userCode, email);
                if (resetSuccess) {
                  return { success: true };
                } else {
                  return { success: false, error: t('auth.reset_password_failed') };
                }
              },
              onSuccess: () => {
              }
            });
          }
        } else {
          showNotification(t('auth.user_not_found'), 'error');
        }
      } else {
        showNotification(response.getError() || t('auth.user_not_found'), 'error');
      }
    } catch (error: any) {
      console.error('Reset password flow error:', error);
      showNotification(error.message || t('common.network_error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [phone, email, showNotification, t, handleGenerateOTP, showOTP, handleResetPassword, handleVerifySMSOTP, handleResendOTP]);

  return {
    phone,
    setPhone,
    email,
    setEmail,
    isLoading,
    handleCheckUserAndSendOTP,
  };
};
