import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import { hasNotch, normalize } from '@/utils/layout';
import { useForgotPasswordService } from '@/features/auth/hooks/useForgotPasswordService';
import { ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const {
    phone,
    setPhone,
    email,
    setEmail,
    birthday,
    setBirthday,
    isLoading,
    handleCheckUserAndSendOTP,
  } = useForgotPasswordService();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleCancel = () => {
    router.back();
  };

  const handleConfirm = () => {
    handleCheckUserAndSendOTP();
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      // Format as yyyy-MM-dd for the server
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      setBirthday(`${year}-${month}-${day}`);
    }
  };

  const getDateValue = (): Date => {
    if (birthday) {
      const [year, month, day] = birthday.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={normalize(24)}
              color={colors.text}
            />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            {t('auth.forgot_password_title')}
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Form */}
          <View style={styles.formContainer}>

            {/* Phone Input */}
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
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t('auth.phone_placeholder')}
                placeholderTextColor={colors.icon}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                {t('auth.email')}
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
                placeholder={t('auth.email_placeholder')}
                placeholderTextColor={colors.icon}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Birthday Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                {t('auth.birthday')}
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.85}
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
                  <ThemedText
                    style={[
                      styles.dateText,
                      { color: birthday ? colors.text : colors.icon },
                    ]}
                  >
                    {birthday ? birthday.split('-').reverse().join('/') : t('auth.select_birthday')}
                  </ThemedText>
                  <Ionicons
                    name="calendar-outline"
                    size={normalize(20)}
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

            {/* Agreement Checkbox */}
            {/* <TouchableOpacity
              onPress={() => setAgreed(!agreed)}
              style={styles.checkboxContainer}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: agreed ? colors.tint : colors.border,
                    backgroundColor: agreed ? colors.tint : 'transparent',
                  },
                ]}
              >
                {agreed && (
                  <Ionicons
                    name="checkmark"
                    size={normalize(18)}
                    color={Tokens.colors.main.white}
                  />
                )}
              </View>
              <View style={styles.checkboxTextContainer}>
                <ThemedText style={[styles.checkboxText, { color: colors.text }]}>
                  Tôi đã đọc, hiểu, đồng ý và cam kết tuân thủ các{' '}
                </ThemedText>
                <TouchableOpacity>
                  <ThemedText style={[styles.linkText, { color: colors.tint }]}>
                    điều khoản và điều kiện
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={[styles.checkboxText, { color: colors.text }]}>
                  {' '}cùng cấp và{' '}
                </ThemedText>
                <TouchableOpacity>
                  <ThemedText style={[styles.linkText, { color: colors.tint }]}>
                    sử dụng dịch vụ
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={[styles.checkboxText, { color: colors.text }]}>
                  {' '}của ứng dụng cho khách hàng cá nhân
                </ThemedText>
              </View>
            </TouchableOpacity> */}
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footerButtons}>
          <TouchableOpacity
            onPress={handleCancel}
            style={[
              styles.cancelButton,
              {
                borderColor: colors.tint,
                backgroundColor: colors.background,
              },
            ]}
            activeOpacity={0.9}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.tint }]}>
              {t('common.cancel')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirm}
            style={[
              styles.confirmButton,
              isLoading && styles.disabledButton,
            ]}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            <LinearGradient
              colors={colors.gradianBase}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              {isLoading ? (
                <ActivityIndicator color={Tokens.colors.main.white} />
              ) : (
                <ThemedText style={styles.confirmButtonText}>{t('common.confirm')}</ThemedText>
              )}
            </LinearGradient>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
  },
  backButton: {
    padding: normalize(8),
  },
  headerTitle: {
    fontSize: normalize(18),
    fontFamily: Fonts.semiBold,
    lineHeight: normalize(24),
  },
  placeholder: {
    width: normalize(40),
  },
  scrollContent: {
    paddingHorizontal: normalize(24),
    paddingTop: normalize(16),
    paddingBottom: normalize(24),
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: normalize(16),
    fontFamily: Fonts.regular,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: normalize(8),
  },
  checkbox: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(6),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
    marginTop: normalize(2),
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    lineHeight: normalize(20),
  },
  linkText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
    lineHeight: normalize(20),
  },
  footerButtons: {
    flexDirection: 'row',
    paddingHorizontal: normalize(24),
    paddingBottom: hasNotch() ? normalize(10) : normalize(24),
    gap: normalize(12),
  },
  cancelButton: {
    flex: 1,
    height: normalize(52),
    borderRadius: normalize(100),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: normalize(18),
    fontFamily: Fonts.semiBold,
    lineHeight: normalize(24),
  },
  confirmButton: {
    flex: 1,
    height: normalize(52),
    borderRadius: normalize(100),
    overflow: 'hidden',
    shadowColor: Tokens.colors.main.black,
    shadowOffset: { width: 0, height: normalize(4) },
    shadowOpacity: 0.15,
    shadowRadius: normalize(8),
    elevation: 4,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  confirmButtonText: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    color: Tokens.colors.main.white,
    lineHeight: normalize(24),
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ForgotPasswordScreen;