import CustomText from '@/components/base/CustomText';
import FormattedMoneyInput from '@/components/base/FormattedMoneyInput';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import { useRegisterService } from '@/features/auth/hooks/useResgisterService';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
import StorageService from '@/services/StorageService';
import { Images } from '@/utils/images';
import { hasNotch, normalize } from '@/utils/layout';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const logoImg = Images.appLogoLight;

const RegisterScreen = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();

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
    currency,
    setCurrency,
    initialBalance,
    setInitialBalance,
  } = useRegisterService();

  const { defaultCurrency, loading: loadingDefaultCurrency } = useDefaultCurrency();
  const [currencySymbol, setCurrencySymbol] = useState('đ');
  const [currencyName, setCurrencyName] = useState('Vietnamese Dong');

  useEffect(() => {
    if (!loadingDefaultCurrency && defaultCurrency) {
      setCurrency(defaultCurrency.currencyId);
      setCurrencySymbol(defaultCurrency.symbol);
      setCurrencyName(defaultCurrency.name);
    }
  }, [loadingDefaultCurrency, defaultCurrency]);

  useFocusEffect(
    useCallback(() => {
      const loadSelectedData = async () => {
        try {
          const selectedCurrencyStr = await StorageService.getItem('temp_selected_currency');
          if (selectedCurrencyStr) {
            try {
              const selectedCurrency = JSON.parse(selectedCurrencyStr);
              setCurrency(selectedCurrency.currencyId || 'VND');
              setCurrencySymbol(selectedCurrency.symbol || 'đ');
              setCurrencyName(selectedCurrency.name || 'Vietnamese Dong');
              await StorageService.removeItem('temp_selected_currency');
            } catch (parseError) {
              console.error('Failed to parse currency:', parseError);
            }
          }
        } catch (error) {
          console.error('Failed to load selected data:', error);
        }
      };
      loadSelectedData();
    }, [])
  );

  const handleSelectCurrency = () => {
    router.push({
      pathname: '/(protected)/select-currency',
      params: {
        selectedCurrencyId: currency,
      }
    });
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [step, setStep] = useState(1);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Animate when step changes
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: step === 1 ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step]);
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

  // Validation helpers inside component to use translation
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return t('validation.required_email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return t('validation.invalid_email');
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) return t('validation.required_phone');
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(phone.trim())) {
      return t('validation.invalid_phone');
    }
    return null;
  };

  const validateFullName = (name: string): string | null => {
    if (!name.trim()) return t('validation.required_fullname');
    if (name.trim().length < 2) return t('validation.invalid_fullname');
    return null;
  };

  const validateAddress = (address: string): string | null => {
    if (!address.trim()) return t('validation.required_address');
    if (address.trim().length < 5) return t('validation.invalid_address');
    return null;
  };

  const validateBirthday = (birthday: string): string | null => {
    if (!birthday) return t('validation.required_birthday');
    return null;
  };

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

  const handleBalanceChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setInitialBalance(cleaned);
  };

  const getBalanceDisplay = (): string => {
    if (!initialBalance) return '';
    const number = parseFloat(initialBalance);
    if (isNaN(number)) return '';
    return `${number.toLocaleString('en-US')} ${currencySymbol}`;
  };

  const handleContinue = () => {
    // Validate Step 1 fields
    const nameError = validateFullName(fullName);
    const phoneError = validatePhone(phone);
    const emailError = validateEmail(email);
    const addressError = validateAddress(address);
    const birthdayError = validateBirthday(birthday);

    setErrors(prev => ({
      ...prev,
      fullName: nameError || '',
      phone: phoneError || '',
      email: emailError || '',
      address: addressError || '',
      birthday: birthdayError || '',
    }));

    setTouched(prev => ({
      ...prev,
      fullName: true,
      phone: true,
      email: true,
      address: true,
      birthday: true,
    }));

    if (!nameError && !phoneError && !emailError && !addressError && !birthdayError) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };


  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.sliderContainer}>
          <Animated.View
            style={[
              styles.slider,
              {
                width: width * 2,
                transform: [{ translateX }],
              },
            ]}
          >
            {/* Step 1 */}
            <View style={{ width: width }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Logo */}
                <View style={styles.logoContainer}>
                  <View style={[styles.logoWrapper, { backgroundColor: colors.tint }]}>
                    <Image source={logoImg} style={styles.logo} resizeMode="contain" />
                  </View>
                </View>

                {/* Title */}
                <ThemedText style={[styles.title, { color: colors.text }]}>
                  {t("auth.register_title")}
                </ThemedText>

                {/* Form */}
                <View style={styles.formContainer}>
                  {/* Full Name Input */}
                  <View style={styles.inputContainer}>
                    <ThemedText style={[styles.label, { color: colors.text }]}>
                      {t("auth.fullname")}
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
                      placeholder={t("auth.fullname_placeholder")}
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
                      {t("auth.phone")}
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
                      placeholder={t("auth.phone_placeholder")}
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
                      {t("auth.email")}
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
                      placeholder={t("auth.email_placeholder")}
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
                      {t("auth.address")}
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
                      placeholder={t("auth.address_placeholder")}
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
                      {t("auth.birthday")}
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
                          {birthday ? formatDate(birthday) : t("auth.select_birthday")}
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
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  onPress={handleContinue}
                  style={[
                    styles.registerButton,
                    { backgroundColor: colors.tint },
                  ]}
                  activeOpacity={0.9}
                >
                  <ThemedText style={styles.registerButtonText}>{t("common.next") || "Next"}</ThemedText>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.footer}>
                  <ThemedText style={[styles.footerText, { color: colors.text }]}>
                    {t("auth.have_account")}{' '}
                  </ThemedText>
                  <TouchableOpacity onPress={handleLogin} disabled={isRegistering}>
                    <ThemedText style={[styles.loginLink, { color: colors.tint }]}>
                      {t("auth.login")}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

            {/* Step 2 */}
            <View style={{ width: width }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Header with Back Button */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={normalize(24)} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.logoContainer}>
                  <ThemedText style={[styles.title, { color: colors.text, marginTop: 0 }]}>
                    {t("wallet.setup_wallet") || "Setup Wallet"}
                  </ThemedText>
                </View>

                {/* Step 2 Form */}
                <View style={styles.formContainer}>
                  {/* Currency Selection */}
                  <View style={styles.inputContainer}>
                    <ThemedText style={[styles.label, { color: colors.text }]}>
                      {t('wallet.currency')}
                    </ThemedText>
                    <TouchableOpacity
                      style={[styles.currencySelector, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={handleSelectCurrency}
                    >
                      <View style={styles.currencyLeft}>
                        <View style={styles.currencyIconWrapper}>
                          <CustomText style={[styles.currencySymbolText, { color: colors.tint }]} type="bold">
                            {currencySymbol}
                          </CustomText>
                        </View>
                        <View style={styles.currencyInfo}>
                          <CustomText style={[styles.currencyNameText, { color: colors.icon }]} type="regular" numberOfLines={1}>
                            {currencyName}
                          </CustomText>
                          <CustomText style={[styles.currencyCode, { color: colors.text }]} type="semiBold">
                            {currency}
                          </CustomText>
                        </View>
                      </View>
                      <FontAwesome6 name="chevron-right" size={normalize(14)} color={colors.icon} />
                    </TouchableOpacity>
                  </View>

                  {/* Initial Balance */}
                  <View style={styles.inputContainer}>
                    <ThemedText style={[styles.label, { color: colors.text }]}>
                      {t('wallet.initial_balance')}
                    </ThemedText>

                    <FormattedMoneyInput
                      value={initialBalance ? parseFloat(initialBalance) : 0}
                      onChange={(val) => setInitialBalance(val ? val.toString() : '')}
                      currency={currencySymbol}
                      placeholder={`0 ${currencySymbol}`}
                      containerStyle={{
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: 1,
                        height: normalize(52),
                        paddingHorizontal: normalize(16),
                      }}
                      inputStyle={{
                        color: colors.text,
                        fontSize: normalize(16),
                        fontFamily: Fonts.regular,
                        textAlign: 'left'
                      }}
                    />

                    <ThemedText style={[styles.helperText, { color: colors.icon }]}>
                      {t('wallet.initial_balance_helper')}
                    </ThemedText>
                  </View>

                  {/* Register Button */}
                  <TouchableOpacity
                    onPress={handleRegister}
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
                      <ThemedText style={styles.registerButtonText}>{t("auth.register")}</ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
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
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: normalize(5),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyIconWrapper: {
    width: normalize(48),
    height: normalize(48),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
  },
  currencySymbolText: {
    fontSize: normalize(24),
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: normalize(14),
    marginBottom: normalize(2),
  },
  currencyNameText: {
    fontSize: normalize(13),
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
  balanceContainer: {
    height: normalize(52),
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexInput: {
    flex: 1,
    fontSize: normalize(16),
    fontFamily: Fonts.regular,
    height: '100%',
  },
  balanceDisplay: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    marginLeft: normalize(8),
  },
  helperText: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    marginTop: normalize(6),
  },
  header: {
    marginBottom: normalize(20),
    alignItems: 'flex-start',
  },
  backButton: {
    padding: normalize(8),
    marginLeft: -normalize(8),
  },
  sliderContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  slider: {
    flexDirection: 'row',
    flex: 1,
  },
});

export default RegisterScreen;