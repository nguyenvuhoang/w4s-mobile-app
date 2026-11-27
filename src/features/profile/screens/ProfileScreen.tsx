import AppHeader from '@/components/base/AppHeader';
import { ThemedText } from '@/components/themed-text';
import { GlobalContext } from '@/contexts/GlobalContext';
import { useNotification } from '@/contexts/NotificationContext';
import { apiService } from '@/core/api/ApiService';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useLoginService } from '@/features/auth/hooks/useLoginService';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { styles } from '@/features/profile/styles/ProfileScreen.styles';
import { Images, getAvatarSource } from '@/utils/images';
import { hp, normalize } from '@/utils/layout';
import { requestMediaLibraryPermission } from '@/utils/permissionHelper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { appInfo } = useContext(GlobalContext);

  const { profile, loading, getUserProfile, uploadAvatar } = useProfile();
  const { handleGetAppInfo } = useLoginService();
  const { showNotification } = useNotification();
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getUserProfile();
    }, [getUserProfile])
  );

  const userData = useMemo(() => {
    if (!profile) return {
      name: 'N/A',
      email: 'N/A',
      phone: 'N/A',
      dateOfBirth: 'N/A',
      gender: 'N/A',
      address: 'N/A',
      nationality: 'N/A',
      place_of_origin: 'N/A',
      place_of_residence: 'N/A',
      identity_number: 'N/A',
      issued_date: 'N/A',
      issued_place: 'N/A',
      avatar: null,
    };

    const fullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ');

    let genderStr = 'N/A';
    if (profile.gender === 1 || profile.gender === '1' || profile.gender === 'M') genderStr = t('profile.male', 'Nam');
    else if (profile.gender === 2 || profile.gender === '2' || profile.gender === 'F' || profile.gender === 0 || profile.gender === '0') genderStr = t('profile.female', 'Nữ');
    else if (profile.gender === 3 || profile.gender === '3') genderStr = t('profile.other', 'Khác');
    else if (profile.gender) genderStr = String(profile.gender);

    let dob = profile.date_of_birth || 'N/A';
    if (dob && dob.includes('T')) {
      const datePart = dob.split('T')[0];
      const [y, m, d] = datePart.split('-');
      if (y && m && d) dob = `${d}/${m}/${y}`;
    }

    let issued = profile.issued_date || 'N/A';
    if (issued && issued.includes('T')) {
      const datePart = issued.split('T')[0];
      const [y, m, d] = datePart.split('-');
      if (y && m && d) issued = `${d}/${m}/${y}`;
    }

    return {
      name: fullName || 'N/A',
      email: profile.email || 'N/A',
      phone: profile.phone || 'N/A',
      dateOfBirth: dob,
      gender: genderStr,
      address: profile.address || 'N/A',
      nationality: profile.nationality || 'N/A',
      place_of_origin: profile.place_of_origin || 'N/A',
      place_of_residence: profile.place_of_residence || 'N/A',
      identity_number: profile.identity_number || 'N/A',
      issued_date: issued,
      issued_place: profile.issued_place || 'N/A',
      avatar: localAvatar || profile.avatar || appInfo?.avatar,
    };
  }, [profile, t, localAvatar, appInfo?.avatar]);

  const profileItems = [
    { icon: 'person-outline', label: t('profile.fullname', 'Họ và tên'), value: userData.name },
    { icon: 'mail-outline', label: t('profile.email', 'Email'), value: userData.email },
    { icon: 'call-outline', label: t('profile.phone', 'Số điện thoại'), value: userData.phone },
    { icon: 'calendar-outline', label: t('profile.birthday', 'Ngày sinh'), value: userData.dateOfBirth },
    { icon: 'male-female-outline', label: t('profile.gender', 'Giới tính'), value: userData.gender },
    { icon: 'location-outline', label: t('profile.address', 'Địa chỉ liên hệ'), value: userData.address },
    { icon: 'flag-outline', label: t('profile.nationality', 'Quốc tịch'), value: userData.nationality },
    { icon: 'home-outline', label: t('profile.place_of_origin', 'Quê quán'), value: userData.place_of_origin },
    { icon: 'home', label: t('profile.place_of_residence', 'Nơi thường trú'), value: userData.place_of_residence },
    { icon: 'card-outline', label: t('profile.identity_number', 'Số CMND/CCCD'), value: userData.identity_number },
    { icon: 'calendar', label: t('profile.issued_date', 'Ngày cấp'), value: userData.issued_date },
    { icon: 'business-outline', label: t('profile.issued_place', 'Nơi cấp'), value: userData.issued_place },
  ];

  const handleChangeAvatar = async () => {
    if (isUploadingAvatar) return;
    try {
      const hasPermission = await requestMediaLibraryPermission(
        t('profile.permission_denied', 'Thất bại'),
        t('profile.need_permission_gallery', 'Vui lòng cấp quyền truy cập thư viện ảnh để đổi Avatar!')
      );

      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        const userCode = appInfo?.user_code || '';

        setIsUploadingAvatar(true);
        try {
          const uploadResponse = await apiService.uploadImage(uri, 'avatars', userCode, false);
          const avatarUrl = uploadResponse?.file_url || uploadResponse?.data?.file_url;

          if (!avatarUrl) {
            showNotification(t('profile.upload_failed', 'Lỗi khi upload ảnh'), 'error');
            return;
          }

          await uploadAvatar(avatarUrl);
          setLocalAvatar(uri);
          await getUserProfile();
          await handleGetAppInfo();

          showNotification(t('profile.avatar_updated', 'Cập nhật ảnh đại diện thành công'), 'success');
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    } catch (error) {
      console.error('Lỗi khi đổi avatar:', error);
      showNotification(t('profile.avatar_update_failed', 'Cập nhật ảnh đại diện thất bại'), 'error');
    }
  };

  const handleEditProfile = () => {
    router.push('/(protected)/edit-profile');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('profile.title')} showBackButton />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading && !profile ? (
          <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: hp(5) }} />
        ) : (
          <>
            <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
              <View style={styles.avatarContainer}>
                <Image
                  source={getAvatarSource(userData.avatar)}
                  style={styles.avatar}
                />
                <TouchableOpacity
                  style={[styles.cameraButton, { backgroundColor: colors.tint }]}
                  onPress={handleChangeAvatar}
                  disabled={isUploadingAvatar}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={normalize(18)} color="#fff" />
                </TouchableOpacity>
              </View>

              <ThemedText style={[styles.userName, { color: colors.text }]}>
                {userData.name}
              </ThemedText>
              <ThemedText style={[styles.userEmail, { color: colors.icon }]}>
                {userData.email}
              </ThemedText>

              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.tint }]}
                onPress={handleEditProfile}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={normalize(18)} color="#fff" />
                <ThemedText style={styles.editButtonText}>{t('profile.edit_info')}</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {profileItems.map((item, itemIndex) => (
                <View key={itemIndex}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoLeft}>
                      <View style={styles.iconWrapper}>
                        <Ionicons
                          name={item.icon as any}
                          size={normalize(20)}
                          color={colors.tint}
                        />
                      </View>
                      <ThemedText style={[styles.infoLabel, { color: colors.icon }]}>
                        {item.label}
                      </ThemedText>
                    </View>
                    <ThemedText
                      style={[styles.infoValue, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {item.value}
                    </ThemedText>
                  </View>
                  {itemIndex < profileItems.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={isUploadingAvatar}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              paddingHorizontal: normalize(24),
              paddingVertical: normalize(20),
              borderRadius: normalize(16),
              alignItems: 'center',
              gap: normalize(12),
            }}
          >
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={{ color: colors.text, fontSize: normalize(14) }}>
              {t('profile.updating_avatar', 'Đang cập nhật ảnh đại diện...')}
            </ThemedText>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;