import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import StorageKey from '@/constants/StorageKey';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import { useLoginService } from '@/features/auth/hooks/useLoginService';
import StorageService from '@/services/StorageService';
import { AppInfo } from '@/types/UserCommand';
import { normalize } from '@/utils/layout';

const logoImg = require('@assets/images/emiwhite.png');
const defaultAvatar = require('@assets/images/default_avatar.png');

const QuickLoginScreen = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showNotification } = useNotification();
  const hasCheckedLoginStatus = useRef(false);

  // Use login service
  const {
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoggingIn,
    isFetchingAppInfo,
    isLoading,
    isBiometricSupported,
    isAuthenticating,
    appInfo,
    setAppInfo,
    handleLogin,
    handleBiometricLogin,
    handleGetStatusLogin,
  } = useLoginService();

  useEffect(() => {
    loadAppInfo();
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, [appInfo]);

  const loadAppInfo = async () => {
    try {
      setPassword('');
      
      if (appInfo) {
        setUsername(appInfo.login_name);
        return;
      }

      const storedAppInfo = await StorageService.getAsyncItem(StorageKey.appInfo);
      if (storedAppInfo) {
        const parsedAppInfo: AppInfo = JSON.parse(storedAppInfo);
        setAppInfo(parsedAppInfo);
        setUsername(parsedAppInfo.login_name);
      } else {
        await clearDataUser();
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Error loading app info:', error);
      await clearDataUser();
      router.replace('/(auth)/login');
    }
  };

  const checkLoginStatus = async () => {
    if (appInfo?.is_login && !hasCheckedLoginStatus.current) {
      hasCheckedLoginStatus.current = true;
      try {
        const islogin = await handleGetStatusLogin(appInfo.user_code);
        const appInfoData: AppInfo = {
          ...appInfo,
          is_login: islogin,
        };

        await StorageService.setAsyncItem(StorageKey.appInfo, JSON.stringify(appInfoData));
        setAppInfo(appInfoData);

        // if (!islogin) {
        //   await clearDataUser();
        //   router.replace('/(auth)/login');
        // }
      } catch (err) {
        console.error('Error checking login status:', err);
        await clearDataUser();
        router.replace('/(auth)/login');
      }
    }
  };

  const handlePasswordLogin = async () => {
    if (password.trim() === '') return;
    await handleLogin(false);
  };

  const handleBiometricPress = async () => {
    await handleBiometricLogin();
  };

  const handleSwitchAccount = () => {
    showNotification(
      'Bạn có chắc muốn đăng nhập tài khoản khác?',
      'warning',
      undefined,
      undefined,
      async () => {
        await clearDataUser();
        router.replace('/(auth)/login');
      },
      undefined,
      undefined,
      () => {}
    );
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgotPassword' as any);
  };

  const handleCreateAccount = () => {
    router.push('/(auth)/register' as any);
  };

  const clearDataUser = async () => {
    await StorageService.removeAsyncItem(StorageKey.appInfo);
    await StorageService.removeAsyncItem(StorageKey.user);
    await StorageService.removeAsyncItem(StorageKey.isVerifyFirstLogin);
    await StorageService.removeAsyncItem(StorageKey.token);
    await StorageService.removeAsyncItem(StorageKey.userSession);

    const channelId = await StorageService.getAsyncItem(StorageKey.channelId);
    if (channelId) {
      await StorageService.removeAsyncItem(`${StorageKey.appInfo}_${channelId}`);
      await StorageService.removeAsyncItem(`${StorageKey.user}_${channelId}`);
      await StorageService.removeAsyncItem(`${StorageKey.isVerifyFirstLogin}_${channelId}`);
      await StorageService.removeAsyncItem(`${StorageKey.token}_${channelId}`);
      await StorageService.removeAsyncItem(`${StorageKey.userSession}_${channelId}`);
    }
  };

  const isFormValid = password.trim() !== '';
  const isLoadingAny = isLoggingIn || isFetchingAppInfo || isLoading;

  return (
    <>
      {/* Loading Overlay */}
      {isLoadingAny && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={[styles.loadingText, { color: '#fff' }]}>
            {isLoggingIn ? 'Đang đăng nhập...' : 'Đang tải thông tin...'}
          </ThemedText>
        </View>
      )}

      {/* Biometric Authentication Overlay */}
      {isAuthenticating && (
        <View style={styles.biometricOverlay} />
      )}

      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Half - Logo + Title */}
            <View style={styles.topHalf}>
              <View style={styles.logoContainer}>
                <View style={[styles.logoWrapper, { backgroundColor: colors.tint }]}>
                  <Image source={logoImg} style={styles.logo} resizeMode="contain" />
                </View>
              </View>

              <ThemedText style={[styles.title, { color: colors.text }]}>
                Đăng nhập
              </ThemedText>
            </View>

            {/* Bottom Half - Form */}
            <View style={styles.bottomHalf}>
              {/* User Info Row */}
              <View style={styles.userInfoRow}>
                <View style={styles.avatarContainer}>
                  {appInfo?.avatar ? (
                    <Image source={{ uri: appInfo.avatar }} style={styles.avatar} />
                  ) : (
                    <Image source={defaultAvatar} style={styles.avatar} />
                  )}
                </View>
                <ThemedText style={[styles.username, { color: colors.text }]}>
                  Xin chào, {appInfo?.name || appInfo?.login_name || 'User'}
                </ThemedText>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  Mật khẩu
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
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor={colors.icon}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!isLoadingAny}
                    onSubmitEditing={handlePasswordLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoadingAny}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={normalize(22)}
                      color={colors.icon}
                    />
                  </TouchableOpacity>

                  {/* Biometric Button */}
                  {isBiometricSupported && appInfo?.is_biometric_supported && (
                    <TouchableOpacity
                      style={styles.biometricIcon}
                      onPress={handleBiometricPress}
                      disabled={isLoadingAny || isAuthenticating}
                    >
                      {isAuthenticating ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                      ) : (
                        <View style={[styles.biometricButton, { borderColor: colors.tint }]}>
                          <Ionicons
                            name="finger-print-outline"
                            size={normalize(24)}
                            color={colors.tint}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handlePasswordLogin}
                style={[
                  styles.loginButton,
                  { backgroundColor: colors.tint },
                  (!isFormValid || isLoadingAny) && styles.loginButtonDisabled,
                ]}
                activeOpacity={0.9}
                disabled={!isFormValid || isLoadingAny}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color={Tokens.colors.main.white} size="small" />
                ) : (
                  <ThemedText style={styles.loginButtonText}>
                    Đăng nhập
                  </ThemedText>
                )}
              </TouchableOpacity>

              {/* Links */}
              <View style={styles.linksContainer}>
                <TouchableOpacity onPress={handleSwitchAccount} disabled={isLoadingAny}>
                  <ThemedText style={[styles.linkText, { color: colors.tint }]}>
                    Đổi tài khoản
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword} disabled={isLoadingAny}>
                  <ThemedText style={[styles.linkText, { color: colors.tint }]}>
                    Quên mật khẩu?
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Create Account */}
              <View style={styles.footer}>
                <TouchableOpacity onPress={handleCreateAccount} disabled={isLoadingAny}>
                  <ThemedText style={[styles.createAccountText, { color: colors.text }]}>
                    Tạo tài khoản
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: normalize(250),
  },
  logoContainer: {
    alignItems: 'center',
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
    lineHeight: normalize(36),
  },
  bottomHalf: {
    flex: 1,
    paddingHorizontal: normalize(24),
    paddingTop: normalize(20),
    paddingBottom: normalize(20),
    justifyContent: 'flex-start',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(20),
    gap: normalize(12),
  },
  avatarContainer: {},
  avatar: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
  },
  username: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
    lineHeight: normalize(22),
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
    paddingRight: normalize(100),
  },
  eyeIcon: {
    position: 'absolute',
    right: normalize(56),
    top: normalize(15),
  },
  biometricIcon: {
    position: 'absolute',
    right: normalize(16),
    top: normalize(12),
  },
  biometricButton: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(8),
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    height: normalize(52),
    borderRadius: normalize(100),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(16),
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
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(8),
    marginBottom: normalize(16),
  },
  linkText: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    lineHeight: normalize(20),
  },
  footer: {
    alignItems: 'center',
    paddingBottom: normalize(10),
  },
  createAccountText: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
    lineHeight: normalize(22),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    gap: normalize(16),
  },
  loadingText: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
  },
  biometricOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
});

export default QuickLoginScreen;