import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts, Tokens } from '@/core/theme/theme';
import { useLoginService } from '@/features/auth/hooks/useLoginService';
import { hasNotch, normalize } from '@/utils/layout';

const logoImg = require('@assets/images/emiwhite.png');

const LoginScreen = () => {
  const router = useRouter();
  const { colors } = useAppTheme();

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

  const handleCreateAccount = () => {
    router.push('/(auth)/register' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoWrapper, { backgroundColor: colors.tint }]}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        {/* Title */}
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Đăng nhập
        </ThemedText>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              Tên đăng nhập
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Tên đăng nhập của bạn"
              placeholderTextColor={colors.icon}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
              editable={!isLoggingIn}
            />
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
                placeholder="Mật khẩu của bạn"
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
              Quên mật khẩu ?
            </ThemedText>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={() => handleLogin(true)} 
            style={[
              styles.loginButton,
              { backgroundColor: colors.tint },
              (!isFormValid || isLoggingIn) && styles.loginButtonDisabled,
            ]}
            activeOpacity={0.9}
            disabled={!isFormValid || isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator color={Tokens.colors.main.white} size="small" />
            ) : (
              <ThemedText style={styles.loginButtonText}>Đăng nhập</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Create Account */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleCreateAccount} disabled={isLoggingIn}>
            <ThemedText style={[styles.createAccountText, { color: colors.text }]}>
              Tạo tài khoản
            </ThemedText>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
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
    fontFamily: Fonts.family.bold,
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
    fontFamily: Fonts.family.medium,
    marginBottom: normalize(8),
    lineHeight: normalize(20),
  },
  input: {
    height: normalize(52),
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    fontSize: normalize(16),
    fontFamily: Fonts.family.regular,
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
    fontFamily: Fonts.family.medium,
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
    fontFamily: Fonts.family.bold,
    color: Tokens.colors.main.white,
    lineHeight: normalize(24),
  },
  footer: {
    paddingBottom: hasNotch() ? normalize(10) : normalize(30),
    alignItems: 'center',
  },
  createAccountText: {
    fontSize: normalize(16),
    fontFamily: Fonts.family.medium,
    lineHeight: normalize(22),
  },
});

export default LoginScreen;