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
import { isValidEmail, isValidPhone } from '@/utils/validation';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import DatePicker from 'react-native-date-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
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
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const styles = createStyles(colors, isDark);

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
  }, [loadingDefaultCurrency, defaultCurrency, setCurrency]);

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
    }, [setCurrency])
  );

  const handleSelectCurrency = () => {
    router.push({
      pathname: '/(protected)/select-currency',
      params: {
        selectedCurrencyId: currency,
      },
    });
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [step, setStep] = useState(1);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: step === 1 ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step, slideAnim]);

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

  const validateEmail = (value: string): string | null => {
    if (!value.trim()) return t('validation.required_email');
    if (!isValidEmail(value)) return t('validation.invalid_email');
    return null;
  };

  const validatePhone = (value: string): string | null => {
    if (!value.trim()) return t('validation.required_phone');
    if (!isValidPhone(value)) {
      return t('validation.invalid_phone');
    }
    return null;
  };

  const validateFullName = (value: string): string | null => {
    if (!value.trim()) return t('validation.required_fullname');
    if (value.trim().length < 2) return t('validation.invalid_fullname');
    return null;
  };

  const validateAddress = (value: string): string | null => {
    if (!value.trim()) return t('validation.required_address');
    if (value.trim().length < 5) return t('validation.invalid_address');
    return null;
  };

  const validateBirthday = (value: string): string | null => {
    if (!value) return t('validation.required_birthday');
    return null;
  };

  const handleLogin = () => {
    router.back();
  };

  const handleDateChange = (selectedDate: Date) => {
    setShowDatePicker(false);
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
    if (birthday) return new Date(birthday);
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
    const numericText = text.replace(/[^0-9]/g, '');
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

    switch (field) {
      case 'fullName': {
        const fullNameError = validateFullName(fullName);
        setErrors(prev => ({ ...prev, fullName: fullNameError || '' }));
        break;
      }
      case 'phone': {
        const phoneError = validatePhone(phone);
        setErrors(prev => ({ ...prev, phone: phoneError || '' }));
        break;
      }
      case 'email': {
        const emailError = validateEmail(email);
        setErrors(prev => ({ ...prev, email: emailError || '' }));
        break;
      }
      case 'address': {
        const addressError = validateAddress(address);
        setErrors(prev => ({ ...prev, address: addressError || '' }));
        break;
      }
      case 'birthday': {
        const birthdayError = validateBirthday(birthday);
        setErrors(prev => ({ ...prev, birthday: birthdayError || '' }));
        break;
      }
    }
  };

  const handleContinue = () => {
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

  const step1Invalid =
    !!errors.fullName ||
    !!errors.phone ||
    !!errors.email ||
    !!errors.address ||
    !!errors.birthday;

  return (
    <View style={[styles.container, { backgroundColor: colors.brandBg }]}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.brandBlue }]}>
        <View style={[styles.sliderContainer, { backgroundColor: colors.brandBg }]}>
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
            <View style={{ width }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.header, { backgroundColor: colors.brandBlue }]}>
                  <View style={styles.headerCircleLeftLine} />
                  <View style={styles.headerCircleLeft} />
                  <View style={styles.headerCircleRightLine} />
                  <View style={styles.headerCircleRight} />

                  <View style={styles.logoWrap}>
                    <Image source={logoImg} style={styles.logo} resizeMode="contain" />
                  </View>

                  <ThemedText style={styles.headerTitle}>
                    {t('auth.register_title')}
                  </ThemedText>
                </View>

                <View style={styles.body}>
                  <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                      <ThemedText style={[styles.label, { color: colors.brandTextPrimary }]}>
                        {t('auth.fullname')}
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.input,
                          touched.fullName && errors.fullName ? styles.inputError : null,
                          { color: colors.brandTextPrimary },
                        ]}
                        placeholder={t('auth.fullname_placeholder')}
                        placeholderTextColor={isDark ? "#636C77" : "#A8ADB7"}
                        value={fullName}
                        onChangeText={handleFullNameChange}
                        onBlur={() => handleBlur('fullName')}
                        autoCapitalize="words"
                        editable={!isRegistering}
                      />
                      {touched.fullName && errors.fullName ? (
                        <ThemedText style={styles.errorText}>{errors.fullName}</ThemedText>
                      ) : null}
                    </View>

                    <View style={styles.inputContainer}>
                      <ThemedText style={[styles.label, { color: colors.brandTextPrimary }]}>
                        {t('auth.phone')}
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.input,
                          touched.phone && errors.phone ? styles.inputError : null,
                          { color: colors.brandTextPrimary },
                        ]}
                        placeholder={t('auth.phone_placeholder')}
                        placeholderTextColor={isDark ? "#636C77" : "#A8ADB7"}
                        value={phone}
                        onChangeText={handlePhoneChange}
                        onBlur={() => handleBlur('phone')}
                        keyboardType="phone-pad"
                        maxLength={10}
                        editable={!isRegistering}
                      />
                      {touched.phone && errors.phone ? (
                        <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>
                      ) : null}
                    </View>

                    <View style={styles.inputContainer}>
                      <ThemedText style={[styles.label, { color: colors.brandTextPrimary }]}>
                        {t('auth.email')}
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.input,
                          touched.email && errors.email ? styles.inputError : null,
                          { color: colors.brandTextPrimary },
                        ]}
                        placeholder={t('auth.email_placeholder')}
                        placeholderTextColor={isDark ? "#636C77" : "#A8ADB7"}
                        value={email}
                        onChangeText={handleEmailChange}
                        onBlur={() => handleBlur('email')}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        editable={!isRegistering}
                      />
                      {touched.email && errors.email ? (
                        <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
                      ) : null}
                    </View>

                    <View style={styles.inputContainer}>
                      <ThemedText style={[styles.label, { color: colors.brandTextPrimary }]}>
                        {t('auth.address')}
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.input,
                          touched.address && errors.address ? styles.inputError : null,
                          { color: colors.brandTextPrimary },
                        ]}
                        placeholder={t('auth.address_placeholder')}
                        placeholderTextColor={isDark ? "#636C77" : "#A8ADB7"}
                        value={address}
                        onChangeText={handleAddressChange}
                        onBlur={() => handleBlur('address')}
                        autoCapitalize="words"
                        editable={!isRegistering}
                      />
                      {touched.address && errors.address ? (
                        <ThemedText style={styles.errorText}>{errors.address}</ThemedText>
                      ) : null}
                    </View>

                    <View style={styles.inputContainer}>
                      <ThemedText style={[styles.label, { color: colors.brandTextPrimary }]}>
                        {t('auth.birthday')}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        disabled={isRegistering}
                        activeOpacity={0.85}
                      >
                        <View
                          style={[
                            styles.input,
                            styles.dateInput,
                            touched.birthday && errors.birthday ? styles.inputError : null,
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.dateText,
                              { color: birthday ? colors.brandTextPrimary : (isDark ? "#636C77" : "#A8ADB7") },
                            ]}
                          >
                            {birthday
                              ? formatDate(birthday)
                              : t('auth.select_birthday')}
                          </ThemedText>
                          <Ionicons
                            name="calendar-outline"
                            size={normalize(20)}
                            color="#98A2B3"
                          />
                        </View>
                      </TouchableOpacity>

                      {touched.birthday && errors.birthday ? (
                        <ThemedText style={styles.errorText}>{errors.birthday}</ThemedText>
                      ) : null}

                      <DatePicker
                        modal
                        open={showDatePicker}
                        date={getDateValue()}
                        mode="date"
                        theme={isDark ? "dark" : "light"}
                        buttonColor={colors.brandBlue}
                        dividerColor={colors.brandBlue}
                        confirmText={t("common.confirm")}
                        cancelText={t("common.cancel")}
                        title={t("auth.select_birthday")}
                        onConfirm={handleDateChange}
                        onCancel={() => setShowDatePicker(false)}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleContinue}
                    activeOpacity={0.9}
                    style={styles.buttonWrap}
                    disabled={isRegistering || step1Invalid}
                  >
                    <LinearGradient
                      colors={colors.gradientPrimary as any}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={[
                        styles.primaryButton,
                        (isRegistering || step1Invalid) && styles.primaryButtonDisabled,
                      ]}
                    >
                      <ThemedText style={styles.primaryButtonText}>
                        {t('common.next')}
                      </ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.footer}>
                      <ThemedText style={[styles.footerText, { color: colors.brandTextSecondary }]}>
                        {t('auth.have_account')}{' '}
                      </ThemedText>
                    <TouchableOpacity onPress={handleLogin} disabled={isRegistering}>
                      <ThemedText style={[styles.loginLink, { color: colors.brandBlue }]}>
                        {t('auth.login')}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Step 2 */}
            <View style={{ width }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.header, { backgroundColor: colors.brandBlue }]}>
                  <View style={styles.headerCircleLeft} />
                  <View style={styles.headerCircleRight} />

                  <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={normalize(22)} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View style={styles.logoWrap}>
                    <Image source={logoImg} style={styles.logo} resizeMode="contain" />
                  </View>

                  <ThemedText style={styles.headerTitle}>
                    {t('wallet.setup_wallet')}
                  </ThemedText>
                </View>

                <View style={styles.body}>
                  <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                      <ThemedText style={[styles.label, { color: colors.brandTextPrimary }]}>
                        {t('wallet.currency')}
                      </ThemedText>

                      <TouchableOpacity
                        style={styles.currencySelector}
                        onPress={handleSelectCurrency}
                        activeOpacity={0.85}
                      >
                        <View style={styles.currencyLeft}>
                          <View style={styles.currencyIconWrapper}>
                            <CustomText style={[styles.currencySymbolText, { color: colors.brandBlue }]} type="bold">
                              {currencySymbol}
                            </CustomText>
                          </View>

                          <View style={styles.currencyInfo}>
                            <CustomText
                              style={styles.currencyNameText}
                              type="regular"
                              numberOfLines={1}
                            >
                              {currencyName}
                            </CustomText>
                            <CustomText style={[styles.currencyCode, { color: colors.brandTextPrimary }]} type="semiBold">
                              {currency}
                            </CustomText>
                          </View>
                        </View>

                        <FontAwesome6
                          name="chevron-right"
                          size={normalize(14)}
                          color="#98A2B3"
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                      <ThemedText style={[styles.label, { color: colors.brandTextPrimary }]}>
                        {t('wallet.initial_balance')}
                      </ThemedText>

                      <FormattedMoneyInput
                        value={initialBalance ? parseFloat(initialBalance) : 0}
                        onChange={(val) => setInitialBalance(val ? val.toString() : '')}
                        currency={currencySymbol}
                        placeholder={`0 ${currencySymbol}`}
                        containerStyle={{
                          backgroundColor: isDark ? colors.card : '#F4F4F5',
                          borderColor: isDark ? colors.border : 'transparent',
                          borderWidth: 1,
                          height: normalize(54),
                          paddingHorizontal: normalize(16),
                          borderRadius: normalize(14),
                        }}
                        inputStyle={{
                          color: colors.brandTextPrimary,
                          fontSize: normalize(15),
                          fontFamily: Fonts.regular,
                          textAlign: 'left',
                        }}
                      />

                      <ThemedText style={[styles.helperText, { color: colors.brandTextSecondary }]}>
                        {t('wallet.initial_balance_helper')}
                      </ThemedText>
                    </View>

                    <TouchableOpacity
                      onPress={handleRegister}
                      activeOpacity={0.9}
                      disabled={isRegistering || !isFormValid}
                      style={styles.buttonWrap}
                    >
                      <LinearGradient
                        colors={colors.gradientPrimary as any}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={[
                          styles.primaryButton,
                          (isRegistering || !isFormValid) && styles.primaryButtonDisabled,
                        ]}
                      >
                        {isRegistering ? (
                          <ActivityIndicator
                            color={Tokens.colors.main.white}
                            size="small"
                          />
                        ) : (
                          <ThemedText style={styles.primaryButtonText}>
                            {t('auth.register')}
                          </ThemedText>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  sliderContainer: {
    flex: 1,
    overflow: 'hidden',
  },

  slider: {
    flexDirection: 'row',
    flex: 1,
  },

  scrollContent: {
    paddingBottom: hasNotch() ? normalize(10) : normalize(30),
  },

  header: {
    height: normalize(255),
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
    zIndex: 1,
  },

  headerCircleLeftLine: {
    position: 'absolute',
    left: normalize(-63),
    bottom: normalize(7),
    width: normalize(185),
    height: normalize(185),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    zIndex: 1,
  },

  headerCircleRightLine: {
    position: 'absolute',
    right: normalize(-57),
    top: normalize(-7),
    width: normalize(178),
    height: normalize(178),
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  backButton: {
    position: 'absolute',
    top: normalize(16),
    left: normalize(20),
    zIndex: 5,
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(19),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
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

  formContainer: {
    marginBottom: normalize(8),
  },

  inputContainer: {
    marginBottom: normalize(20),
  },

  label: {
    fontSize: normalize(15),
    lineHeight: normalize(22),
    fontFamily: Fonts.medium,
    marginBottom: normalize(10),
  },

  input: {
    height: normalize(54),
    borderRadius: normalize(14),
    paddingHorizontal: normalize(16),
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    backgroundColor: isDark ? colors.card : '#F4F4F5',
    borderColor: isDark ? colors.border : 'transparent',
    borderWidth: 1,
  },

  inputError: {
    borderColor: '#EF4444',
  },

  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dateText: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    lineHeight: normalize(22),
  },

  errorText: {
    marginTop: normalize(6),
    fontSize: normalize(12),
    color: Tokens.colors.main.error,
    fontFamily: Fonts.regular,
  },

  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? colors.card : '#F4F4F5',
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: isDark ? colors.border : 'transparent',
    minHeight: normalize(54),
  },

  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  currencyIconWrapper: {
    width: normalize(42),
    height: normalize(42),
    borderRadius: normalize(21),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
    backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(13,99,230,0.08)',
  },

  currencySymbolText: {
    fontSize: normalize(20),
    color: Tokens.colors.main.primary,
  },

  currencyInfo: {
    flex: 1,
  },

  currencyCode: {
    fontSize: normalize(14),
    color: Tokens.colors.main.neutral,
  },

  currencyNameText: {
    fontSize: normalize(13),
    color: colors.brandTextSecondary,
    marginBottom: normalize(2),
  },

  helperText: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    marginTop: normalize(6),
    color: colors.brandTextSecondary,
  },

  buttonWrap: {
    marginTop: normalize(20),
    marginBottom: normalize(14),
  },

  primaryButton: {
    height: normalize(56),
    borderRadius: normalize(28),
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButtonDisabled: {
    opacity: 0.55,
  },

  primaryButtonText: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    color: Tokens.colors.main.white,
    lineHeight: normalize(24),
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: normalize(4),
    paddingBottom: normalize(10),
  },

  footerText: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    lineHeight: normalize(22),
    color: colors.brandTextSecondary,
  },

  loginLink: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    lineHeight: normalize(22),
    color: Tokens.colors.main.primary,
  },
});

export default RegisterScreen;