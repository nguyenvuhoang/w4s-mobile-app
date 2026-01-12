import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { hasNotch, normalize } from '@/utils/layout';

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [username, setUsername] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleCancel = () => {
    router.back();
  };

  const handleConfirm = () => {
    console.log('Confirm:', { username, idNumber, phone, email, agreed });
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
            Quên mật khẩu
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
              />
            </View>

            {/* ID Number Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Số Căn cước
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
                placeholder="Số căn cước của bạn"
                placeholderTextColor={colors.icon}
                value={idNumber}
                onChangeText={setIdNumber}
                keyboardType="number-pad"
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
                placeholder="Số điện thoại đăng ký"
                placeholderTextColor={colors.icon}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Email
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
              />
            </View>

            {/* Agreement Checkbox */}
            <TouchableOpacity
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
            </TouchableOpacity>
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
              Hủy
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.confirmButton, { backgroundColor: colors.tint }]}
            activeOpacity={0.9}
          >
            <ThemedText style={styles.confirmButtonText}>Xác nhận</ThemedText>
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Tokens.colors.main.black,
    shadowOffset: { width: 0, height: normalize(4) },
    shadowOpacity: 0.15,
    shadowRadius: normalize(8),
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    color: Tokens.colors.main.white,
    lineHeight: normalize(24),
  },
});

export default ForgotPasswordScreen;