import BottomActionModal, { ActionItem } from '@/components/modals/BottomActionModal';
import { ThemedText } from '@/components/themed-text';
import { changeLanguage } from '@/core/i18n/i18n';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import { useLoginService } from '@/features/auth/hooks/useLoginService';
import { Images } from '@/utils/images';
import { hasNotch, normalize } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const logoImg = Images.appLogoLight;

const LoginScreen = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const {
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoggingIn,
    isFormValid,
    handleLogin,
    handleForgotPassword,
  } = useLoginService();

  const [errors, setErrors] = useState({
    username: '',
  });
  const [touched, setTouched] = useState({
    username: false,
  });

  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) return t('validation.required_phone');
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(phone.trim())) {
      return t('validation.invalid_phone');
    }
    return null;
  };

  const handlePhoneChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    const limitedText = numericText.slice(0, 10);
    setUsername(limitedText);

    if (touched.username) {
      const error = validatePhone(limitedText);
      setErrors(prev => ({ ...prev, username: error || '' }));
    }
  };

  const handleBlur = () => {
    setTouched(prev => ({ ...prev, username: true }));
    const error = validatePhone(username);
    setErrors(prev => ({ ...prev, username: error || '' }));
  };

  const handleCreateAccount = () => {
    router.push('/(auth)/register' as any);
  };

  const handleApplyLanguage = async (lang: string) => {
    await changeLanguage(lang);
    setShowLanguageModal(false);
  };

  const languageActions: ActionItem[] = [
    {
      id: 'vi',
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      label: 'Tiếng Việt',
      onPress: () => handleApplyLanguage('vi'),
      color: i18n.language === 'vi' ? colors.tint : colors.text,
    },
    {
      id: 'en',
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      label: 'English',
      onPress: () => handleApplyLanguage('en'),
      color: i18n.language === 'en' ? colors.tint : colors.text,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Language Switcher */}
        <View style={styles.topContainer}>
          <TouchableOpacity
            onPress={() => setShowLanguageModal(true)}
            style={[styles.langBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="globe-outline" size={normalize(20)} color={colors.text} />
            <ThemedText style={[styles.langText, { color: colors.text }]}>
              {i18n.language === 'vi' ? 'Tiếng Việt' : 'English'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoWrapper, { backgroundColor: colors.tint }]}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        {/* Title */}
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {t('auth.login')}
        </ThemedText>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Phone Input (mapped to username) */}
          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              {t('auth.phone')}
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: touched.username && errors.username ? colors.error : colors.border,
                },
              ]}
              placeholder={t('auth.phone_placeholder')}
              placeholderTextColor={colors.icon}
              value={username}
              onChangeText={handlePhoneChange}
              onBlur={handleBlur}
              keyboardType="numeric"
              maxLength={10}
              editable={!isLoggingIn}
            />
            {touched.username && errors.username ? (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.username}</ThemedText>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              {t('auth.password')}
            </ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t('auth.password_placeholder')}
                placeholderTextColor={colors.icon}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!isLoggingIn}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoggingIn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={normalize(22)}
                  color={colors.icon}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
            disabled={isLoggingIn}
          >
            <ThemedText style={[styles.forgotPasswordText, { color: colors.tint }]}>
              {t('auth.forgot_password')}
            </ThemedText>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={() => handleLogin(true)}
            style={[
              styles.loginButton,
              { backgroundColor: colors.tint },
              (!isFormValid || isLoggingIn || !!errors.username) && styles.loginButtonDisabled,
            ]}
            activeOpacity={0.9}
            disabled={!isFormValid || isLoggingIn || !!errors.username}
          >
            {isLoggingIn ? (
              <ActivityIndicator color={Tokens.colors.main.white} size="small" />
            ) : (
              <ThemedText style={styles.loginButtonText}>{t('auth.login')}</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Create Account */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleCreateAccount} disabled={isLoggingIn}>
            <ThemedText style={[styles.createAccountText, { color: colors.text }]}>
              {t('auth.create_account')}
            </ThemedText>
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      <BottomActionModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title={t('common.select_language')}
        subtitle={t('settings.language_subtitle') || 'Chọn ngôn ngữ hiển thị'}
        actions={languageActions}
        colors={colors}
        cancelText={t('common.cancel')}
        hasBottomNav={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: normalize(24),
  },
  topContainer: {
    alignItems: 'flex-end',
    paddingTop: normalize(10),
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(20),
    borderWidth: 1,
  },
  langText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: normalize(40),
    marginBottom: normalize(24),
  },
  logoWrapper: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: normalize(50),
    height: normalize(50),
  },
  title: {
    fontSize: normalize(28),
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: normalize(32),
    lineHeight: normalize(36),
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: normalize(20),
  },
  label: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    marginBottom: normalize(8),
    lineHeight: normalize(20),
  },
  input: {
    height: normalize(52),
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    fontSize: normalize(16),
    fontFamily: Fonts.regular,
    borderWidth: 1,
    lineHeight: normalize(22),
    paddingTop: normalize(15),
    paddingBottom: normalize(15),
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: normalize(50),
  },
  eyeIcon: {
    position: 'absolute',
    right: normalize(16),
    top: normalize(15),
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: normalize(24),
  },
  forgotPasswordText: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    lineHeight: normalize(20),
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    color: Tokens.colors.main.white,
    lineHeight: normalize(24),
  },
  footer: {
    paddingBottom: hasNotch() ? normalize(10) : normalize(30),
    alignItems: 'center',
  },
  createAccountText: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
    lineHeight: normalize(22),
  },
  errorText: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    marginTop: normalize(4),
    lineHeight: normalize(18),
  },
});

export default LoginScreen;