import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import { useRegisterService } from '@/features/auth/hooks/useResgisterService';
import { hasNotch, normalize } from '@/utils/layout';

const logoImg = require('@assets/images/emiwhite.png');

const RegisterScreen = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    address,
    setAddress,
    birthday,
    setBirthday,
    isRegistering,
    isFormValid,
    handleRegister,
  } = useRegisterService();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleLogin = () => {
    router.back();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthday(selectedDate.toISOString());
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDateValue = (): Date => {
    if (birthday) {
      return new Date(birthday);
    }
    return new Date();
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
                editable={!isRegistering}
              />
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
                editable={!isRegistering}
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
                editable={!isRegistering}
              />
            </View>

            {/* Address Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Địa chỉ
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
                placeholder="Địa chỉ của bạn"
                placeholderTextColor={colors.icon}
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
                editable={!isRegistering}
              />
            </View>

            {/* Birthday Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Ngày sinh
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                disabled={isRegistering}
              >
                <View
                  style={[
                    styles.input,
                    styles.dateInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <ThemedText style={[styles.dateText, { color: birthday ? colors.text : colors.icon }]}>
                    {birthday ? formatDate(birthday) : 'Chọn ngày sinh'}
                  </ThemedText>
                  <Ionicons
                    name="calendar-outline"
                    size={normalize(22)}
                    color={colors.icon}
                  />
                </View>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={getDateValue()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              style={[
                styles.registerButton,
                { backgroundColor: colors.tint },
                (!isFormValid || isRegistering) && styles.registerButtonDisabled,
              ]}
              activeOpacity={0.9}
              disabled={!isFormValid || isRegistering}
            >
              {isRegistering ? (
                <ActivityIndicator color={Tokens.colors.main.white} size="small" />
              ) : (
                <ThemedText style={styles.registerButtonText}>Đăng ký</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: colors.text }]}>
              Đã có tài khoản?{' '}
            </ThemedText>
            <TouchableOpacity onPress={handleLogin} disabled={isRegistering}>
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
    fontFamily: Fonts.bold,
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: normalize(16),
    fontFamily: Fonts.regular,
    lineHeight: normalize(22),
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
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
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
    fontFamily: Fonts.regular,
    lineHeight: normalize(22),
  },
  loginLink: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
    lineHeight: normalize(22),
  },
});

export default RegisterScreen;