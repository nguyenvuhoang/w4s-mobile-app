import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts, Tokens } from '@/core/theme/theme';
import { hasNotch, normalize } from '@/utils/layout';

const logoImg = require('@assets/images/emiwhite.png');

const RegisterScreen = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = () => {
    console.log('Register:', { fullName, email, password, phone });
  };

  const handleLogin = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoWrapper, { backgroundColor: colors.tint }]}>
              <Image source={logoImg} style={styles.logo} resizeMode="contain" />
            </View>
          </View>

          {/* Title */}
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Đăng ký!
          </ThemedText>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Họ và tên
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
                placeholder="Họ và tên của bạn"
                placeholderTextColor={colors.icon}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                E-mail
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
                placeholder="Email của bạn"
                placeholderTextColor={colors.icon}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
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
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={normalize(22)}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Số điện thoại
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
                placeholder="Số điện thoại của bạn"
                placeholderTextColor={colors.icon}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              style={[styles.registerButton, { backgroundColor: colors.tint }]}
              activeOpacity={0.9}
            >
              <ThemedText style={styles.registerButtonText}>Đăng ký</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: colors.text }]}>
              Đã có tài khoản?{' '}
            </ThemedText>
            <TouchableOpacity onPress={handleLogin}>
              <ThemedText style={[styles.loginLink, { color: colors.tint }]}>
                Đăng nhập
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: normalize(24),
    paddingBottom: hasNotch() ? normalize(10) : normalize(30),
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
    marginBottom: normalize(24),
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
  registerButton: {
    height: normalize(52),
    borderRadius: normalize(100),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: normalize(8),
    shadowColor: Tokens.colors.main.black,
    shadowOffset: { width: 0, height: normalize(4) },
    shadowOpacity: 0.15,
    shadowRadius: normalize(8),
    elevation: 4,
  },
  registerButtonText: {
    fontSize: normalize(18),
    fontFamily: Fonts.family.bold,
    color: Tokens.colors.main.white,
    lineHeight: normalize(24),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: normalize(16),
  },
  footerText: {
    fontSize: normalize(16),
    fontFamily: Fonts.family.regular,
    lineHeight: normalize(22),
  },
  loginLink: {
    fontSize: normalize(16),
    fontFamily: Fonts.family.semiBold,
    lineHeight: normalize(22),
  },
});

export default RegisterScreen;