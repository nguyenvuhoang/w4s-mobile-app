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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
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
    <View style={[styles.container, { backgroundColor: colors.brandBg }]}>
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.brandBlue }]}>
        <KeyboardAvoidingView
          style={[styles.flex, { backgroundColor: colors.brandBg }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.header, { backgroundColor: colors.brandBlue }]}>
            <View style={styles.headerCircleLeft} />
            <View style={styles.headerCircleRight} />

            <View style={styles.languageWrap}>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(true)}
                style={styles.langBtn}
                disabled={isLoggingIn}
              >
                <Ionicons name="globe-outline" size={normalize(16)} color="#FFFFFF" />
                <ThemedText style={styles.langText}>
                  {i18n.language === 'vi' ? 'Tiếng Việt' : 'English'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.logoWrap}>
              <Image source={logoImg} style={styles.logo} resizeMode="contain" />
            </View>

            <ThemedText style={styles.headerTitle}>
              {t('auth.login')}
            </ThemedText>
          </View>

          <View style={styles.body}>
            <ThemedText style={[styles.description, { color: colors.brandTextSecondary }]}>
              Vui lòng đăng nhập để sử dụng ứng dụng quản lý tài chính W4S.
            </ThemedText>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.brandTextPrimary }]}>
                  {t('auth.phone')}
                </ThemedText>

                <TextInput
                  style={[
                    styles.input,
                    touched.username && errors.username ? styles.inputError : null,
                    { color: colors.brandTextPrimary },
                  ]}
                  placeholder={t('auth.phone_placeholder')}
                  placeholderTextColor="#A8ADB7"
                  value={username}
                  onChangeText={handlePhoneChange}
                  onBlur={handleBlur}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!isLoggingIn}
                />

                {touched.username && errors.username ? (
                  <ThemedText style={styles.errorText}>
                    {errors.username}
                  </ThemedText>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.brandTextPrimary }]}>
                  {t('auth.password')}
                </ThemedText>

                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { color: colors.brandTextPrimary }]}
                    placeholder={t('auth.password_placeholder')}
                    placeholderTextColor="#A8ADB7"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!isLoggingIn}
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoggingIn}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={normalize(20)}
                      color="#98A2B3"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity disabled={isLoggingIn}>
                  <ThemedText style={[styles.linkText, { color: colors.brandBlue }]}>
                    Đổi tài khoản
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleForgotPassword}
                  disabled={isLoggingIn}
                >
                  <ThemedText style={[styles.linkText, { color: colors.brandBlue }]}>
                    {t('auth.forgot_password')}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => handleLogin(true)}
                activeOpacity={0.9}
                disabled={!isFormValid || isLoggingIn || !!errors.username}
                style={styles.loginButtonWrap}
              >
                <LinearGradient
                  colors={colors.gradientPrimary as any}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[
                    styles.loginButton,
                    (!isFormValid || isLoggingIn || !!errors.username) &&
                    styles.loginButtonDisabled,
                  ]}
                >
                  {isLoggingIn ? (
                    <ActivityIndicator
                      color={Tokens.colors.main.white}
                      size="small"
                    />
                  ) : (
                    <ThemedText style={styles.loginButtonText}>
                      {t('auth.login')}
                    </ThemedText>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.registerRow}>
                <ThemedText style={[styles.registerText, { color: colors.brandTextSecondary }]}>hoặc </ThemedText>
                <TouchableOpacity
                  onPress={handleCreateAccount}
                  disabled={isLoggingIn}
                >
                  <ThemedText style={[styles.registerLink, { color: colors.brandBlue }]}>
                    {t('auth.create_account')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: '#E9EEF5',
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#0D63E6',
  },

  flex: {
    flex: 1,
    backgroundColor: '#E9EEF5',
  },

  header: {
    height: normalize(255),
    backgroundColor: '#0D63E6',
    borderBottomLeftRadius: normalize(34),
    borderBottomRightRadius: normalize(34),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },

  headerCircleLeft: {
    position: 'absolute',
    left: normalize(-38),
    bottom: normalize(32),
    width: normalize(135),
    height: normalize(135),
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  headerCircleRight: {
    position: 'absolute',
    right: normalize(-32),
    top: normalize(18),
    width: normalize(128),
    height: normalize(128),
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  languageWrap: {
    position: 'absolute',
    top: normalize(14),
    right: normalize(20),
    zIndex: 2,
  },

  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(10),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },

  langText: {
    color: '#FFFFFF',
    fontSize: normalize(13),
    fontFamily: Fonts.medium,
  },

  logoWrap: {
    marginBottom: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: normalize(100),
    height: normalize(100),
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: normalize(26),
    fontFamily: Fonts.bold,
    lineHeight: normalize(32),
  },

  body: {
    flex: 1,
    paddingHorizontal: normalize(28),
    paddingTop: normalize(28),
  },

  description: {
    textAlign: 'center',
    color: '#5D6470',
    fontSize: normalize(16),
    lineHeight: normalize(25),
    fontFamily: Fonts.regular,
    marginBottom: normalize(42),
  },

  form: {
    flex: 1,
  },

  inputGroup: {
    marginBottom: normalize(22),
  },

  label: {
    fontSize: normalize(15),
    lineHeight: normalize(22),
    color: '#303545',
    fontFamily: Fonts.medium,
    marginBottom: normalize(10),
  },

  input: {
    height: normalize(54),
    borderRadius: normalize(14),
    backgroundColor: '#F4F4F5',
    paddingHorizontal: normalize(16),
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    color: '#1F2430',
    borderWidth: 1,
    borderColor: 'transparent',
  },

  inputError: {
    borderColor: '#EF4444',
  },

  passwordWrap: {
    position: 'relative',
  },

  passwordInput: {
    paddingRight: normalize(48),
  },

  eyeButton: {
    position: 'absolute',
    right: normalize(14),
    top: normalize(16),
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(-2),
    marginBottom: normalize(34),
  },

  linkText: {
    color: '#0D63E6',
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
  },

  loginButtonWrap: {
    marginBottom: normalize(18),
  },

  loginButton: {
    height: normalize(56),
    borderRadius: normalize(28),
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButtonDisabled: {
    opacity: 0.55,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    lineHeight: normalize(24),
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  registerText: {
    color: '#444B59',
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
  },

  registerLink: {
    color: '#0D63E6',
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
  },

  errorText: {
    marginTop: normalize(6),
    fontSize: normalize(12),
    color: '#EF4444',
    fontFamily: Fonts.regular,
  },

  footer: {
    paddingBottom: hasNotch() ? normalize(10) : normalize(30),
    alignItems: 'center',
  },
});

export default LoginScreen;