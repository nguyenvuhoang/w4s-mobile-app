import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import { useRegisterService } from '@/features/auth/hooks/useResgisterService';
import { Images } from '@/utils/images';
import { hasNotch, normalize } from '@/utils/layout';
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

const logoImg = Images.appLogoLight;

// Validation helpers
const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'Email không được để trống';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Email không hợp lệ';
  return null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) return 'Số điện thoại không được để trống';
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  if (!phoneRegex.test(phone.trim())) {
    return 'Số điện thoại không hợp lệ';
  }
  return null;
};

const validateFullName = (name: string): string | null => {
  if (!name.trim()) return 'Họ và tên không được để trống';
  if (name.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
  return null;
};

const validateAddress = (address: string): string | null => {
  if (!address.trim()) return 'Địa chỉ không được để trống';
  if (address.trim().length < 5) return 'Địa chỉ phải có ít nhất 5 ký tự';
  return null;
};

const validateBirthday = (birthday: string): string | null => {
  if (!birthday) return 'Vui lòng chọn ngày sinh';
  // const birthDate = new Date(birthday);
  // const today = new Date();
  // const age = today.getFullYear() - birthDate.getFullYear();
  // if (age < 13) return 'Bạn phải từ 13 tuổi trở lên';
  // if (age > 120) return 'Ngày sinh không hợp lệ';
  return null;
};

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
  const [errors, setErrors] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    birthday: '',
  });
  const [touched, setTouched] = useState({
    fullName: false,
    phone: false,
    email: false,
    address: false,
    birthday: false,
  });

  const handleLogin = () => {
    router.back();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthday(selectedDate.toISOString());
      setTouched(prev => ({ ...prev, birthday: true }));
      const error = validateBirthday(selectedDate.toISOString());
      setErrors(prev => ({ ...prev, birthday: error || '' }));
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

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (touched.fullName) {
      const error = validateFullName(text);
      setErrors(prev => ({ ...prev, fullName: error || '' }));
    }
  };

  const handlePhoneChange = (text: string) => {
    // Chỉ cho phép nhập số
    const numericText = text.replace(/[^0-9]/g, '');
    // Giới hạn 10 số
    const limitedText = numericText.slice(0, 10);
    setPhone(limitedText);
    if (touched.phone) {
      const error = validatePhone(limitedText);
      setErrors(prev => ({ ...prev, phone: error || '' }));
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (touched.email) {
      const error = validateEmail(text);
      setErrors(prev => ({ ...prev, email: error || '' }));
    }
  };

  const handleAddressChange = (text: string) => {
    setAddress(text);
    if (touched.address) {
      const error = validateAddress(text);
      setErrors(prev => ({ ...prev, address: error || '' }));
    }
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate on blur
    switch (field) {
      case 'fullName':
        const nameError = validateFullName(fullName);
        setErrors(prev => ({ ...prev, fullName: nameError || '' }));
        break;
      case 'phone':
        const phoneError = validatePhone(phone);
        setErrors(prev => ({ ...prev, phone: phoneError || '' }));
        break;
      case 'email':
        const emailError = validateEmail(email);
        setErrors(prev => ({ ...prev, email: emailError || '' }));
        break;
      case 'address':
        const addressError = validateAddress(address);
        setErrors(prev => ({ ...prev, address: addressError || '' }));
        break;
      case 'birthday':
        const birthdayError = validateBirthday(birthday);
        setErrors(prev => ({ ...prev, birthday: birthdayError || '' }));
        break;
    }
  };

  const handleRegisterPress = () => {
    // Validate all fields
    const nameError = validateFullName(fullName);
    const phoneError = validatePhone(phone);
    const emailError = validateEmail(email);
    const addressError = validateAddress(address);
    const birthdayError = validateBirthday(birthday);

    setErrors({
      fullName: nameError || '',
      phone: phoneError || '',
      email: emailError || '',
      address: addressError || '',
      birthday: birthdayError || '',
    });

    setTouched({
      fullName: true,
      phone: true,
      email: true,
      address: true,
      birthday: true,
    });

    // If all valid, proceed with registration
    if (!nameError && !phoneError && !emailError && !addressError && !birthdayError) {
      handleRegister();
    }
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
                    borderColor: touched.fullName && errors.fullName ? colors.error : colors.border,
                  },
                ]}
                placeholder="Họ và tên của bạn"
                placeholderTextColor={colors.icon}
                value={fullName}
                onChangeText={handleFullNameChange}
                onBlur={() => handleBlur('fullName')}
                autoCapitalize="words"
                editable={!isRegistering}
              />
              {touched.fullName && errors.fullName ? (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.fullName}</ThemedText>
              ) : null}
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
                    borderColor: touched.phone && errors.phone ? colors.error : colors.border,
                  },
                ]}
                placeholder="0912345678"
                placeholderTextColor={colors.icon}
                value={phone}
                onChangeText={handlePhoneChange}
                onBlur={() => handleBlur('phone')}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!isRegistering}
              />
              {touched.phone && errors.phone ? (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.phone}</ThemedText>
              ) : null}
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
                    borderColor: touched.email && errors.email ? colors.error : colors.border,
                  },
                ]}
                placeholder="example@email.com"
                placeholderTextColor={colors.icon}
                value={email}
                onChangeText={handleEmailChange}
                onBlur={() => handleBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isRegistering}
              />
              {touched.email && errors.email ? (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.email}</ThemedText>
              ) : null}
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
                    borderColor: touched.address && errors.address ? colors.error : colors.border,
                  },
                ]}
                placeholder="Địa chỉ của bạn"
                placeholderTextColor={colors.icon}
                value={address}
                onChangeText={handleAddressChange}
                onBlur={() => handleBlur('address')}
                autoCapitalize="words"
                editable={!isRegistering}
              />
              {touched.address && errors.address ? (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.address}</ThemedText>
              ) : null}
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
                      borderColor: touched.birthday && errors.birthday ? colors.error : colors.border,
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
              {touched.birthday && errors.birthday ? (
                <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.birthday}</ThemedText>
              ) : null}
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
              onPress={handleRegisterPress}
              style={[
                styles.registerButton,
                { backgroundColor: colors.tint },
                isRegistering && styles.registerButtonDisabled,
              ]}
              activeOpacity={0.9}
              disabled={isRegistering}
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
  errorText: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    marginTop: normalize(4),
    lineHeight: normalize(18),
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