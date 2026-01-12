// src/features/settings/screens/ChangePasswordScreen.tsx
import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { useChangePassword } from '@/features/settings/hooks/useChangePassword';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChangePasswordScreen = () => {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();
  const oldPass = params.oldPass as string | undefined;
  const isFirstLogin = params.isFirstLogin === 'true';

  // Use custom hook
  const {
    password,
    setPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    valid,
    loading,
    changePassword,
  } = useChangePassword();

  const slideAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = React.useState(false);

  // Set initial password if provided
  useEffect(() => {
    if (oldPass) {
      setPassword(oldPass);
    }
  }, [oldPass]);

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const handleChangePassword = async () => {
    if (!valid) return;

    await changePassword({
      currentPassword: password,
      newPassword: newPassword,
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <AppHeader title="Đổi mật khẩu" />

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* First Login Notice */}
          {isFirstLogin && (
            <View style={[styles.firstLoginNotice, { backgroundColor: '#FFF7E6' }]}>
              <FontAwesome6 
                name="circle-exclamation" 
                size={normalize(18)} 
                color="#FF9900" 
                style={styles.noticeIconLeft}
              />
              <CustomText style={styles.firstLoginNoticeText}>
                Đây là lần đăng nhập đầu tiên, vui lòng đổi mật khẩu để bảo mật tài khoản
              </CustomText>
            </View>
          )}

          

          {/* Current Password */}
          {!isFirstLogin && (
            <View style={styles.section}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                Mật khẩu hiện tại
              </CustomText>
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor={colors.icon}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <FontAwesome6 
                    name={showPassword ? 'eye' : 'eye-slash'} 
                    size={normalize(16)} 
                    color={colors.icon} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* New Password */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Mật khẩu mới
            </CustomText>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor={colors.icon}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <FontAwesome6 
                  name={showNewPassword ? 'eye' : 'eye-slash'} 
                  size={normalize(16)} 
                  color={colors.icon} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Xác nhận mật khẩu
            </CustomText>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={colors.icon}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <FontAwesome6 
                  name={showConfirmPassword ? 'eye' : 'eye-slash'} 
                  size={normalize(16)} 
                  color={colors.icon} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Regulations Notice */}
          <View style={[styles.noticeBox, { backgroundColor: colors.background }]}>
            <View style={[styles.noticeIconCircle, { backgroundColor: colors.tint + '20' }]}>
              <FontAwesome6 
                name="circle-info" 
                size={normalize(20)} 
                color={colors.tint} 
              />
            </View>
            <TouchableOpacity onPress={openModal} style={styles.noticeTextContainer}>
              <CustomText style={[styles.noticeText, { color: colors.tint }]}>
                Quy định thiết lập mật khẩu
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* Spacing for bottom buttons */}
          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomButtons, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.createButton,
              { 
                backgroundColor: valid ? colors.tint : colors.border,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={handleChangePassword}
            disabled={!valid || loading}
          >
            {loading ? (
              <CustomText style={styles.createButtonText}>Đang xử lý...</CustomText>
            ) : (
              <CustomText style={styles.createButtonText}>Đổi mật khẩu</CustomText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Password Regulations Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              backgroundColor: colors.card,
              transform: [{ translateY }] 
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <CustomText style={[styles.modalTitle, { color: colors.text }]}>
              Quy định thiết lập mật khẩu
            </CustomText>
            <Pressable onPress={closeModal}>
              <FontAwesome6 name="xmark" size={normalize(24)} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <CustomText style={[styles.modalText, { color: colors.text }]}>
              Mật khẩu phải đáp ứng các yêu cầu sau:
            </CustomText>
            
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <FontAwesome6 name="check" size={normalize(12)} color="#4CAF50" />
                <CustomText style={[styles.requirementText, { color: colors.text }]}>
                  Tối thiểu 8 ký tự
                </CustomText>
              </View>
              
              <View style={styles.requirementItem}>
                <FontAwesome6 name="check" size={normalize(12)} color="#4CAF50" />
                <CustomText style={[styles.requirementText, { color: colors.text }]}>
                  Ít nhất 1 chữ in hoa (A-Z)
                </CustomText>
              </View>
              
              <View style={styles.requirementItem}>
                <FontAwesome6 name="check" size={normalize(12)} color="#4CAF50" />
                <CustomText style={[styles.requirementText, { color: colors.text }]}>
                  Ít nhất 1 chữ thường (a-z)
                </CustomText>
              </View>
              
              <View style={styles.requirementItem}>
                <FontAwesome6 name="check" size={normalize(12)} color="#4CAF50" />
                <CustomText style={[styles.requirementText, { color: colors.text }]}>
                  Ít nhất 1 chữ số (0-9)
                </CustomText>
              </View>
              
              <View style={styles.requirementItem}>
                <FontAwesome6 name="check" size={normalize(12)} color="#4CAF50" />
                <CustomText style={[styles.requirementText, { color: colors.text }]}>
                  Ít nhất 1 ký tự đặc biệt (!@#$%^&*)
                </CustomText>
              </View>
            </View>

            <View style={[styles.exampleBox, { backgroundColor: colors.background }]}>
              <CustomText style={[styles.exampleLabel, { color: colors.icon }]}>
                Ví dụ:
              </CustomText>
              <CustomText style={[styles.exampleText, { color: colors.text }]}>
                Anhben@3894
              </CustomText>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  firstLoginNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: normalize(12),
    padding: normalize(16),
    marginHorizontal: wp(5),
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  noticeIconLeft: {
    marginRight: normalize(12),
  },
  firstLoginNoticeText: {
    color: '#FF9900',
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    flex: 1,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(10),
    borderRadius: normalize(12),
    marginHorizontal: wp(5),
    marginTop: hp(2),
  },
  noticeIconCircle: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(12),
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
  },
  section: {
    paddingHorizontal: wp(5),
    marginTop: hp(2),
  },
  label: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    marginBottom: normalize(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(16),
  },
  input: {
    flex: 1,
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    paddingVertical: normalize(14),
  },
  eyeButton: {
    padding: normalize(8),
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(12),
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
  },
  createButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    padding: normalize(24),
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: hp(80),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  modalTitle: {
    fontSize: normalize(20),
    fontFamily: Fonts.semiBold,
  },
  modalBody: {
    paddingTop: normalize(5),
  },
  modalText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    marginBottom: normalize(16),
  },
  requirementsList: {
    gap: normalize(12),
    marginBottom: normalize(20),
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  requirementText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },
  exampleBox: {
    padding: normalize(16),
    borderRadius: normalize(12),
  },
  exampleLabel: {
    fontSize: normalize(12),
    fontFamily: Fonts.medium,
    marginBottom: normalize(4),
  },
  exampleText: {
    fontSize: normalize(15),
    fontFamily: Fonts.semiBold,
  },
});

export default ChangePasswordScreen;