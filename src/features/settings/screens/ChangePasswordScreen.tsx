// src/features/settings/screens/ChangePasswordScreen.tsx
import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { useChangePassword } from '@/features/settings/hooks/useChangePassword';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChangePasswordScreen = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const oldPassword = params.oldPassword as string | undefined;
  const isFirstLogin = params.isFirstLogin === 'true';

  // Use custom hook
  const {
    password,
    setPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    valid,
    loading,
    changePassword,
  } = useChangePassword();

  const slideAnim = useRef(new Animated.Value(0)).current;

  const [errors, setErrors] = React.useState({
    password: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = React.useState({
    password: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Validation helpers
  const validateCurrentPassword = (val: string) => {
    if (!val) return t('validation.required_field');
    return null;
  };

  const validateNewPassword = (val: string) => {
    if (!val) return t('validation.required_field');
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!?.*_-])[A-Za-z0-9@#$%^&+=!?.*_-]{8,20}$/;
    if (!passwordRegex.test(val)) return t('validation.invalid_password_format');
    return null;
  };

  const validateConfirmPassword = (val: string, newPass: string) => {
    if (!val) return t('validation.required_field');
    if (val !== newPass) return t('validation.password_mismatch');
    return null;
  };

  const handleBlur = (field: 'password' | 'newPassword' | 'confirmPassword') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let error = '';

    if (field === 'password') error = validateCurrentPassword(password) || '';
    if (field === 'newPassword') error = validateNewPassword(newPassword) || '';
    if (field === 'confirmPassword') error = validateConfirmPassword(confirmPassword, newPassword) || '';

    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validateCurrentPassword(text) || '' }));
    }
  };

  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    if (touched.newPassword) {
      setErrors(prev => ({ ...prev, newPassword: validateNewPassword(text) || '' }));
    }
    // Also re-validate confirm password if it was touched
    if (touched.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, text) || '' }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (touched.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(text, newPassword) || '' }));
    }
  };
  const [modalVisible, setModalVisible] = React.useState(false);

  // Set initial password if provided
  useEffect(() => {
    if (oldPassword) {
      setPassword(oldPassword);
    }
  }, [oldPassword]);

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const handleChangePassword = async () => {
    const pwdError = validateCurrentPassword(password);
    const newPwdError = validateNewPassword(newPassword);
    const confirmPwdError = validateConfirmPassword(confirmPassword, newPassword);

    setErrors({
      password: pwdError || '',
      newPassword: newPwdError || '',
      confirmPassword: confirmPwdError || '',
    });
    setTouched({
      password: true,
      newPassword: true,
      confirmPassword: true,
    });

    if (pwdError || newPwdError || confirmPwdError) return;
    if (!valid) return;

    await changePassword({
      currentPassword: password,
      newPassword: newPassword,
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <AppHeader title={t('settings.change_password')} />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* First Login Notice */}
          {isFirstLogin && (
            <View style={[styles.firstLoginNotice, { backgroundColor: '#FFF7E6' }]}>
              <FontAwesome6
                name="circle-exclamation"
                size={normalize(18)}
                color="#FF9900"
                style={styles.noticeIconLeft}
              />
              <CustomText style={styles.firstLoginNoticeText}>
                {t('auth.first_login_notice')}
              </CustomText>
            </View>
          )}



          {/* Current Password */}
          {!isFirstLogin && (
            <View style={styles.section}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                {t('auth.current_password')}
              </CustomText>
              <View style={[styles.inputContainer, {
                backgroundColor: colors.card,
                borderColor: touched.password && errors.password ? colors.error : colors.border
              }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  placeholder={t('auth.enter_current_password')}
                  placeholderTextColor={colors.icon}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <FontAwesome6
                    name={showPassword ? 'eye' : 'eye-slash'}
                    size={normalize(16)}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              </View>
              {touched.password && errors.password ? (
                <CustomText style={[styles.errorText, { color: colors.error }]}>{errors.password}</CustomText>
              ) : null}
            </View>
          )}

          {/* New Password */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t('auth.new_password')}
            </CustomText>
            <View style={[styles.inputContainer, {
              backgroundColor: colors.card,
              borderColor: touched.newPassword && errors.newPassword ? colors.error : colors.border
            }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                onBlur={() => handleBlur('newPassword')}
                placeholder={t('auth.enter_new_password')}
                placeholderTextColor={colors.icon}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <FontAwesome6
                  name={showNewPassword ? 'eye' : 'eye-slash'}
                  size={normalize(16)}
                  color={colors.icon}
                />
              </TouchableOpacity>
            </View>
            {touched.newPassword && errors.newPassword ? (
              <CustomText style={[styles.errorText, { color: colors.error }]}>{errors.newPassword}</CustomText>
            ) : null}
          </View>

          {/* Confirm Password */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t('auth.confirm_password')}
            </CustomText>
            <View style={[styles.inputContainer, {
              backgroundColor: colors.card,
              borderColor: touched.confirmPassword && errors.confirmPassword ? colors.error : colors.border
            }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder={t('auth.enter_confirm_password')}
                placeholderTextColor={colors.icon}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <FontAwesome6
                  name={showConfirmPassword ? 'eye' : 'eye-slash'}
                  size={normalize(16)}
                  color={colors.icon}
                />
              </TouchableOpacity>
            </View>
            {touched.confirmPassword && errors.confirmPassword ? (
              <CustomText style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</CustomText>
            ) : null}
          </View>

          {/* Password Regulations Notice */}
          <View style={[styles.noticeBox, { backgroundColor: colors.background }]}>
            <View style={[styles.noticeIconCircle, { backgroundColor: colors.tint + '20' }]}>
              <FontAwesome6
                name="circle-info"
                size={normalize(20)}
                color={colors.tint}
              />
            </View>
            <TouchableOpacity onPress={openModal} style={styles.noticeTextContainer}>
              <CustomText style={[styles.noticeText, { color: colors.tint }]}>
                {t('auth.password_regulations')}
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* Spacing for bottom buttons */}
          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomButtons, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: valid ? colors.tint : colors.border,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={handleChangePassword}
            disabled={!valid || loading}
          >
            {loading ? (
              <CustomText style={styles.createButtonText}>{t('auth.processing')}</CustomText>
            ) : (
              <CustomText style={styles.createButtonText}>{t('settings.change_password')}</CustomText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Password Regulations Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.card,
              transform: [{ translateY }]
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <CustomText style={[styles.modalTitle, { color: colors.text }]}>
              {t('auth.password_regulations')}
            </CustomText>
            <Pressable onPress={closeModal}>
              <FontAwesome6 name="xmark" size={normalize(24)} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <CustomText style={[styles.modalText, { color: colors.text }]}>
              {t('auth.password_requirements')}
            </CustomText>

            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <FontAwesome6 name="check" size={normalize(12)} color="#4CAF50" />
                <CustomText style={[styles.requirementText, { color: colors.text }]}>
                  {t('auth.req_min_chars')}
                </CustomText>
              </View>

              <View style={styles.requirementItem}>
                <FontAwesome6 name="check" size={normalize(12)} color="#4CAF50" />
                <CustomText style={[styles.requirementText, { color: colors.text }]}>
                  {t('auth.req_uppercase')}
                </CustomText>
              </View>

              <View style={styles.requirementItem}>
                <FontAwesome6 name="check" size={normalize(12)} color="#4CAF50" />
                <CustomText style={[styles.requirementText, { color: colors.text }]}>
                  {t('auth.req_lowercase')}
                </CustomText>
              </View>

              <View style={styles.requirementItem}>
                <FontAwesome6 name="check" size={normalize(12)} color="#4CAF50" />
                <CustomText style={[styles.requirementText, { color: colors.text }]}>
                  {t('auth.req_number')}
                </CustomText>
              </View>

              <View style={styles.requirementItem}>
                <FontAwesome6 name="check" size={normalize(12)} color="#4CAF50" />
                <CustomText style={[styles.requirementText, { color: colors.text }]}>
                  {t('auth.req_special')}
                </CustomText>
              </View>
            </View>

            <View style={[styles.exampleBox, { backgroundColor: colors.background }]}>
              <CustomText style={[styles.exampleLabel, { color: colors.icon }]}>
                {t('auth.example')}:
              </CustomText>
              <CustomText style={[styles.exampleText, { color: colors.text }]}>
                Anhben@3894
              </CustomText>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  firstLoginNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: normalize(12),
    padding: normalize(16),
    marginHorizontal: wp(5),
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  noticeIconLeft: {
    marginRight: normalize(12),
  },
  firstLoginNoticeText: {
    color: '#FF9900',
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    flex: 1,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(10),
    borderRadius: normalize(12),
    marginHorizontal: wp(5),
    marginTop: hp(2),
  },
  noticeIconCircle: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(12),
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
  },
  section: {
    paddingHorizontal: wp(5),
    marginTop: hp(2),
  },
  label: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    marginBottom: normalize(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(16),
  },
  input: {
    flex: 1,
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    paddingVertical: normalize(14),
  },
  eyeButton: {
    padding: normalize(8),
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(12),
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
  },
  createButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    padding: normalize(24),
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: hp(80),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  modalTitle: {
    fontSize: normalize(20),
    fontFamily: Fonts.semiBold,
  },
  modalBody: {
    paddingTop: normalize(5),
  },
  modalText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    marginBottom: normalize(16),
  },
  requirementsList: {
    gap: normalize(12),
    marginBottom: normalize(20),
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  requirementText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },
  exampleBox: {
    padding: normalize(16),
    borderRadius: normalize(12),
  },
  exampleLabel: {
    fontSize: normalize(12),
    fontFamily: Fonts.medium,
    marginBottom: normalize(4),
  },
  exampleText: {
    fontSize: normalize(15),
    fontFamily: Fonts.semiBold,
  },
  errorText: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    marginTop: normalize(4),
    lineHeight: normalize(18),
  },
});

export default ChangePasswordScreen;