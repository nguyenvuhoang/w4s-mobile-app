import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useProfile, UserProfile } from '@/features/profile/hooks/useProfile';
import { styles } from '@/features/profile/styles/EditProfileScreen.styles';
import { hp, normalize } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditProfileScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { profile, loading, updating, getUserProfile, updateUserProfile } = useProfile();

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    id: undefined,
    user_id: '',
    user_code: '',
    last_name: '',
    middle_name: '',
    first_name: '',
    phone: '',
    email: '',
    address: '',
    identity_number: '',
    nationality: '',
    place_of_origin: '',
    place_of_residence: '',
    issued_date: '',
    issued_place: '',
    date_of_birth: '',
    gender: '',
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<'date_of_birth' | 'issued_date'>('date_of_birth');

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        const data = await getUserProfile();
        if (data) {
          setFormData({
            id: data.id,
            user_id: data.user_id || '',
            user_code: data.user_code || '',
            last_name: data.last_name || '',
            middle_name: data.middle_name || '',
            first_name: data.first_name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            identity_number: data.identity_number || '',
            nationality: data.nationality || '',
            place_of_origin: data.place_of_origin || '',
            place_of_residence: data.place_of_residence || '',
            issued_date: data.issued_date || '',
            issued_place: data.issued_place || '',
            gender: data.gender != null ? String(data.gender) : '',
            date_of_birth: data.date_of_birth || '',
          });
        }
      };
      fetchProfile();
    }, [getUserProfile])
  );

  const handleUpdateField = (field: keyof UserProfile, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    try {
      const requiredFields: (keyof UserProfile)[] = [
        'last_name',
        'middle_name',
        'first_name',
        'phone',
        'email',
        'address',
        'identity_number',
        'gender',
        'date_of_birth',
        'issued_date',
        'issued_place',
        'nationality',
        'place_of_origin',
        'place_of_residence',
      ];

      const newErrors: Record<string, boolean> = {};
      let hasError = false;

      for (const field of requiredFields) {
        const value = formData[field];
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && !value.trim())
        ) {
          newErrors[field as string] = true;
          hasError = true;
        }
      }

      if (hasError) {
        setErrors(newErrors);
        showNotification(
          t('profile.error_all_fields_required', 'Vui lòng nhập đầy đủ tất cả các thông tin'),
          'error'
        );
        return;
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showNotification(t('profile.error_invalid_email', 'Email không hợp lệ'), 'error');
        return;
      }

      if (formData.phone && formData.phone.length < 10) {
        showNotification(t('profile.error_invalid_phone', 'Số điện thoại không hợp lệ'), 'error');
        return;
      }

      await updateUserProfile(formData);
      showNotification(t('profile.update_success', 'Cập nhật thành công'), 'success');
      router.back();
    } catch (error) {
      showNotification(t('profile.update_failed', 'Cập nhật thất bại'), 'error');
    }
  };

  const openDatePicker = (field: 'date_of_birth' | 'issued_date') => {
    setCurrentDateField(field);
    setShowDatePicker(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('profile.edit_info', 'Sửa thông tin')} showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading && !profile ? (
            <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: hp(5) }} />
          ) : (
            <>
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.first_name', 'Họ')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.first_name ? 'red' : colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('profile.first_name_placeholder', 'Nhập họ')}
                    placeholderTextColor={colors.icon}
                    value={formData.first_name}
                    onChangeText={(val) => handleUpdateField('first_name', val)}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.middle_name', 'Tên đệm')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.middle_name ? 'red' : colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('profile.middle_name_placeholder', 'Nhập tên đệm')}
                    placeholderTextColor={colors.icon}
                    value={formData.middle_name}
                    onChangeText={(val) => handleUpdateField('middle_name', val)}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.last_name', 'Tên')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.last_name ? 'red' : colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('profile.last_name_placeholder', 'Nhập tên')}
                    placeholderTextColor={colors.icon}
                    value={formData.last_name}
                    onChangeText={(val) => handleUpdateField('last_name', val)}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.phone', 'Số điện thoại')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.phone ? 'red' : colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('profile.phone_placeholder', 'Nhập số điện thoại')}
                    placeholderTextColor={colors.icon}
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(val) => handleUpdateField('phone', val)}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.email', 'Email')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.email ? 'red' : colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('profile.email_placeholder', 'Nhập email')}
                    placeholderTextColor={colors.icon}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(val) => handleUpdateField('email', val)}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.address', 'Địa chỉ')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.address ? 'red' : colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('profile.address_placeholder', 'Nhập địa chỉ')}
                    placeholderTextColor={colors.icon}
                    value={formData.address}
                    onChangeText={(val) => handleUpdateField('address', val)}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.identity_number', 'CMND / CCCD')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.identity_number ? 'red' : colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('profile.identity_number_placeholder', 'Nhập số CMND/CCCD')}
                    placeholderTextColor={colors.icon}
                    keyboardType="number-pad"
                    value={formData.identity_number}
                    onChangeText={(val) => handleUpdateField('identity_number', val)}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.gender', 'Giới tính')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.genderContainer, errors.gender && { borderColor: 'red', borderWidth: 1.5, borderRadius: normalize(12), padding: normalize(4) }]}>
                  {[
                    { label: t('profile.male', 'Nam'), value: 1 },
                    { label: t('profile.female', 'Nữ'), value: 2 },
                    { label: t('profile.other', 'Khác'), value: 3 },
                  ].map((option) => {
                    const isSelected = Number(formData.gender) === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.genderButton,
                          {
                            borderColor: isSelected ? colors.tint : colors.border,
                            backgroundColor: isSelected ? colors.tint + '1A' : colors.card,
                          },
                        ]}
                        onPress={() => handleUpdateField('gender', option.value)}
                      >
                        <CustomText
                          style={{ color: isSelected ? colors.tint : colors.text }}
                          type={isSelected ? 'semiBold' : 'regular'}
                        >
                          {option.label}
                        </CustomText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.date_of_birth', 'Ngày sinh')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <TouchableOpacity
                  style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.date_of_birth ? 'red' : colors.border, justifyContent: 'space-between' }]}
                  onPress={() => openDatePicker('date_of_birth')}
                >
                  <CustomText style={[styles.dateText, { color: formData.date_of_birth ? colors.text : colors.icon }]}>
                    {formData.date_of_birth ? dayjs(formData.date_of_birth).format('DD/MM/YYYY') : t('profile.date_of_birth_placeholder', 'Chọn ngày sinh')}
                  </CustomText>
                  <Ionicons name="calendar-outline" size={normalize(20)} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.issued_date', 'Ngày cấp')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <TouchableOpacity
                  style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.issued_date ? 'red' : colors.border, justifyContent: 'space-between' }]}
                  onPress={() => openDatePicker('issued_date')}
                >
                  <CustomText style={[styles.dateText, { color: formData.issued_date ? colors.text : colors.icon }]}>
                    {formData.issued_date ? dayjs(formData.issued_date).format('DD/MM/YYYY') : t('profile.issued_date_placeholder', 'Chọn ngày cấp')}
                  </CustomText>
                  <Ionicons name="calendar-outline" size={normalize(20)} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.issued_place', 'Nơi cấp')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.issued_place ? 'red' : colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('profile.issued_place_placeholder', 'Nhập nơi cấp')}
                    placeholderTextColor={colors.icon}
                    value={formData.issued_place || ''}
                    onChangeText={(val) => handleUpdateField('issued_place', val)}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.nationality', 'Quốc tịch')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.nationality ? 'red' : colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('profile.nationality_placeholder', 'Nhập quốc tịch')}
                    placeholderTextColor={colors.icon}
                    value={formData.nationality || ''}
                    onChangeText={(val) => handleUpdateField('nationality', val)}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.place_of_origin', 'Quê quán')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.place_of_origin ? 'red' : colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('profile.place_of_origin_placeholder', 'Nhập quê quán')}
                    placeholderTextColor={colors.icon}
                    value={formData.place_of_origin || ''}
                    onChangeText={(val) => handleUpdateField('place_of_origin', val)}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t('profile.place_of_residence', 'Nơi thường trú')} <CustomText style={{ color: 'red' }}>*</CustomText>
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: errors.place_of_residence ? 'red' : colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('profile.place_of_residence_placeholder', 'Nhập nơi thường trú')}
                    placeholderTextColor={colors.icon}
                    value={formData.place_of_residence || ''}
                    onChangeText={(val) => handleUpdateField('place_of_residence', val)}
                  />
                </View>
              </View>

              <View style={{ height: hp(4) }} />
            </>
          )}
        </ScrollView>

        <View style={[styles.bottomButtons, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={updating || loading}
          >
            <CustomText style={[styles.cancelButtonText, { color: colors.text }]} type="semiBold">
              {t('common.cancel', 'Hủy')}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.tint,
                opacity: updating || loading ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={updating || loading}
          >
            <CustomText style={styles.saveButtonText} type="bold">
              {updating ? t('common.saving', 'Đang lưu...') : t('common.save', 'Lưu thay đổi')}
            </CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <DatePicker
        modal
        open={showDatePicker}
        date={formData[currentDateField] ? new Date(formData[currentDateField]!) : new Date()}
        mode="date"
        title={currentDateField === 'date_of_birth' ? t('profile.select_dob', 'Chọn ngày sinh') : t('profile.select_issued_date', 'Chọn ngày cấp')}
        confirmText={t('common.confirm', 'Xác nhận')}
        cancelText={t('common.cancel', 'Hủy')}
        onConfirm={(date) => {
          setShowDatePicker(false);
          handleUpdateField(currentDateField, dayjs(date).format('YYYY-MM-DD'));
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
};

export default EditProfileScreen;
