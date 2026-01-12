import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import { normalize } from '@/utils/layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OTPModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  handleVerifyOTP: (otpCode: string) => Promise<{ success: boolean; error?: string }>;
  handleResent?: () => Promise<{ success: boolean; error?: string }>;
  isresend?: boolean;
  blockSeconds?: number;
  showOtpCode?: boolean;
}

const OTP_LENGTH = 6;

const OTPModal: React.FC<OTPModalProps> = memo(({
  visible,
  onClose,
  title,
  description,
  handleVerifyOTP,
  handleResent,
  isresend = true,
  blockSeconds = 120,
  showOtpCode = true,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { showNotification } = useNotification();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(blockSeconds);
  const [inputFocused, setInputFocused] = useState(false);

  const inputRef = useRef<TextInput | null>(null);

  // Responsive modal dimensions
  const modalWidth = Math.min(SCREEN_WIDTH * 0.9, 400);

  // Dynamic OTP box sizing
  const otpBoxGap = normalize(8);
  const availableWidth = modalWidth - normalize(48);
  const otpBoxWidth = Math.min(
    normalize(48),
    (availableWidth - otpBoxGap * (OTP_LENGTH - 1)) / OTP_LENGTH
  );

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setOtp('');
      setIsLoading(false);
      setInputFocused(false);
      setCountdown(blockSeconds);
    }
  }, [visible, blockSeconds]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && visible) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, visible]);

  const focusInput = useCallback(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleOTPChange = useCallback((text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= OTP_LENGTH) {
      setOtp(numericText);
    }
  }, []);

  const handleResendOTP = useCallback(async () => {
    if (!handleResent || countdown > 0 || isLoading) return;

    try {
      setIsLoading(true);
      const result = await handleResent();

      if (result.success) {
        setCountdown(blockSeconds);
        showNotification(t('otpNote.resentSuccess'), 'success');
      } else {
        showNotification(result.error || t('otpNote.resentFailed'), 'error');
      }
    } catch (error) {
      console.error('Resend OTP failed:', error);
      showNotification(t('otpNote.resentFailed'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [handleResent, countdown, isLoading, blockSeconds, showNotification, t]);

  const handleConfirmOTP = useCallback(async () => {
    if (otp.length !== OTP_LENGTH) {
      showNotification(t('otpModal.enterValidOTP'), 'error');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      const result = await handleVerifyOTP(otp);

      if (result.success) {
        setOtp('');
        onClose();
      } else {
        setOtp('');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  }, [otp, isLoading, handleVerifyOTP, showNotification, t, onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.modalContent, { width: modalWidth, backgroundColor: colors.card }]}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={normalize(24)} color={colors.text} />
            </TouchableOpacity>

            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
              <Ionicons name="shield-checkmark" size={normalize(40)} color={colors.tint} />
            </View>

            {/* Title */}
            <ThemedText style={[styles.title, { color: colors.text }]}>
              {title || t('otpModal.title')}
            </ThemedText>

            {/* Description */}
            <ThemedText style={[styles.description, { color: colors.text }]}>
              {description || t('otpModal.description')}
            </ThemedText>

            {/* OTP Input */}
            <TouchableOpacity
              style={styles.otpContainer}
              onPress={focusInput}
              activeOpacity={1}
            >
              {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                const hasValue = !!otp[index];
                const isFocused = inputFocused && index === otp.length;

                return (
                  <View
                    key={`otp-box-${index}`}
                    style={[
                      styles.otpBox,
                      {
                        width: otpBoxWidth,
                        height: otpBoxWidth,
                        borderColor: hasValue || isFocused ? colors.tint : colors.border,
                        borderWidth: hasValue || isFocused ? 2 : 1,
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    <ThemedText style={styles.otpText}>
                      {showOtpCode ? otp[index] || '' : otp[index] ? '●' : ''}
                    </ThemedText>
                    {isFocused && <View style={[styles.cursor, { backgroundColor: colors.tint }]} />}
                  </View>
                );
              })}
            </TouchableOpacity>

            {/* Hidden Input */}
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={handleOTPChange}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              maxLength={OTP_LENGTH}
              keyboardType="numeric"
              style={styles.hiddenInput}
              editable={!isLoading}
              autoFocus={visible}
            />

            {/* Resend */}
            {isresend && (
              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <ThemedText style={[styles.resendText, { color: colors.text }]}>
                    {t('otpNote.notreceiveotp')}{' '}
                    <ThemedText style={{ color: colors.tint, opacity: 0.5 }}>
                      {t('common.resend')}
                    </ThemedText>
                    <ThemedText style={{ opacity: 0.6 }}> ({countdown}s)</ThemedText>
                  </ThemedText>
                ) : (
                  <View style={styles.resendRow}>
                    <ThemedText style={[styles.resendText, { color: colors.text }]}>
                      {t('otpNote.notreceiveotp')}{' '}
                    </ThemedText>
                    <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                      <ThemedText
                        style={[
                          styles.resendLink,
                          { color: colors.tint, opacity: isLoading ? 0.5 : 1 },
                        ]}
                      >
                        {t('common.resend')}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleConfirmOTP}
              style={[
                styles.confirmButton,
                { backgroundColor: colors.tint },
                (otp.length !== OTP_LENGTH || isLoading) && styles.confirmButtonDisabled,
              ]}
              disabled={otp.length !== OTP_LENGTH || isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color={Tokens.colors.main.white} size="small" />
              ) : (
                <ThemedText style={styles.confirmButtonText}>
                  {t('otpModal.continueButton')}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
});

OTPModal.displayName = 'OTPModal';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalize(20),
  },
  modalContent: {
    padding: normalize(24),
    borderRadius: normalize(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: normalize(16),
    right: normalize(16),
    zIndex: 10,
    padding: normalize(4),
  },
  iconContainer: {
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: normalize(16),
    marginBottom: normalize(16),
  },
  title: {
    fontSize: normalize(22),
    fontFamily: Fonts.bold,
    marginBottom: normalize(8),
    textAlign: 'center',
    lineHeight: normalize(28),
  },
  description: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    marginBottom: normalize(24),
    textAlign: 'center',
    lineHeight: normalize(22),
    opacity: 0.8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(24),
    gap: normalize(8),
  },
  otpBox: {
    borderRadius: normalize(12),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  otpText: {
    fontSize: normalize(24),
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: '50%',
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  resendContainer: {
    marginBottom: normalize(20),
    alignItems: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: normalize(20),
  },
  resendLink: {
    fontFamily: Fonts.semiBold,
    textDecorationLine: 'underline',
    lineHeight: normalize(20),
  },
  confirmButton: {
    width: '100%',
    height: normalize(52),
    borderRadius: normalize(100),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Tokens.colors.main.black,
    shadowOffset: { width: 0, height: normalize(4) },
    shadowOpacity: 0.15,
    shadowRadius: normalize(8),
    elevation: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    color: Tokens.colors.main.white,
    lineHeight: normalize(24),
  },
});

export default OTPModal;