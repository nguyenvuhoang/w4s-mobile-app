import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useProfile, UserProfile } from "@/features/profile/hooks/useProfile";
import { hp, normalize, wp } from "@/utils/layout";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EditProfileScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { profile, loading, updating, getUserProfile, updateUserProfile } = useProfile();

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    last_name: "",
    middle_name: "",
    first_name: "",
    phone: "",
    email: "",
    address: "",
    identity_number: "",
    nationality: "",
    place_of_origin: "",
    place_of_residence: "",
    issued_date: "",
    issued_place: "",
    date_of_birth: "",
    gender: "",
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        const data = await getUserProfile();
        if (data) {
          setFormData({
            last_name: data.last_name || "",
            middle_name: data.middle_name || "",
            first_name: data.first_name || "",
            phone: data.phone || "",
            email: data.email || "",
            address: data.address || "",
            identity_number: data.identity_number || "",
            nationality: data.nationality || "",
            place_of_origin: data.place_of_origin || "",
            place_of_residence: data.place_of_residence || "",
            issued_date: data.issued_date || "",
            issued_place: data.issued_place || "",
            gender: data.gender != null ? String(data.gender) : "",
            date_of_birth: data.date_of_birth || "",
          });
        }
      };
      fetchProfile();
    }, [getUserProfile])
  );

  const handleUpdateField = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (!formData.first_name?.trim() || !formData.last_name?.trim()) {
        showNotification(t("profile.error_name_required", "Vui lòng nhập đầy đủ họ và tên"), "error");
        return;
      }

      await updateUserProfile(formData);
      showNotification(t("profile.update_success", "Cập nhật thành công"), "success");
      router.back();
    } catch (error) {
      showNotification(t("profile.update_failed", "Cập nhật thất bại"), "error");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t("profile.edit_info", "Sửa thông tin")} showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              {/* Họ */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.last_name", "Họ")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.last_name_placeholder", "Nhập họ")}
                    placeholderTextColor={colors.icon}
                    value={formData.last_name}
                    onChangeText={(val) => handleUpdateField("last_name", val)}
                  />
                </View>
              </View>

              {/* Tên Phụ/Đệm */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.middle_name", "Tên đệm")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.middle_name_placeholder", "Nhập tên đệm")}
                    placeholderTextColor={colors.icon}
                    value={formData.middle_name}
                    onChangeText={(val) => handleUpdateField("middle_name", val)}
                  />
                </View>
              </View>

              {/* Tên */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.first_name", "Tên")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.first_name_placeholder", "Nhập tên")}
                    placeholderTextColor={colors.icon}
                    value={formData.first_name}
                    onChangeText={(val) => handleUpdateField("first_name", val)}
                  />
                </View>
              </View>

              {/* Số điện thoại */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.phone", "Số điện thoại")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.phone_placeholder", "Nhập số điện thoại")}
                    placeholderTextColor={colors.icon}
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(val) => handleUpdateField("phone", val)}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.email", "Email")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.email_placeholder", "Nhập email")}
                    placeholderTextColor={colors.icon}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(val) => handleUpdateField("email", val)}
                  />
                </View>
              </View>

              {/* Địa chỉ */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.address", "Địa chỉ")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.address_placeholder", "Nhập địa chỉ")}
                    placeholderTextColor={colors.icon}
                    value={formData.address}
                    onChangeText={(val) => handleUpdateField("address", val)}
                  />
                </View>
              </View>

              {/* CMND/CCCD */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.identity_number", "CMND / CCCD")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.identity_number_placeholder", "Nhập số CMND/CCCD")}
                    placeholderTextColor={colors.icon}
                    keyboardType="number-pad"
                    value={formData.identity_number}
                    onChangeText={(val) => handleUpdateField("identity_number", val)}
                  />
                </View>
              </View>

              {/* Giới tính */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.gender", "Giới tính")}
                </CustomText>
                <View style={styles.genderContainer}>
                  {[
                    { label: "Nam", value: "1" },
                    { label: "Nữ", value: "0" },
                  ].map((option) => {
                    const isSelected = String(formData.gender) === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.genderButton,
                          {
                            borderColor: isSelected ? colors.tint : colors.border,
                            backgroundColor: isSelected ? colors.tint + "1A" : colors.card,
                          },
                        ]}
                        onPress={() => handleUpdateField("gender", option.value)}
                      >
                        <CustomText
                          style={{
                            color: isSelected ? colors.tint : colors.text,
                          }}
                          type={isSelected ? "semiBold" : "regular"}
                        >
                          {option.label}
                        </CustomText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Ngày sinh */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.date_of_birth", "Ngày sinh")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.date_of_birth_placeholder", "VD: 2000-01-01")}
                    placeholderTextColor={colors.icon}
                    value={formData.date_of_birth || ""}
                    onChangeText={(val) => handleUpdateField("date_of_birth", val)}
                  />
                </View>
              </View>

              {/* Ngày cấp */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.issued_date", "Ngày cấp")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.issued_date_placeholder", "VD: 2020-01-01")}
                    placeholderTextColor={colors.icon}
                    value={formData.issued_date || ""}
                    onChangeText={(val) => handleUpdateField("issued_date", val)}
                  />
                </View>
              </View>

              {/* Nơi cấp */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.issued_place", "Nơi cấp")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.issued_place_placeholder", "Nhập nơi cấp")}
                    placeholderTextColor={colors.icon}
                    value={formData.issued_place || ""}
                    onChangeText={(val) => handleUpdateField("issued_place", val)}
                  />
                </View>
              </View>

              {/* Quốc tịch */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.nationality", "Quốc tịch")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.nationality_placeholder", "Nhập quốc tịch")}
                    placeholderTextColor={colors.icon}
                    value={formData.nationality || ""}
                    onChangeText={(val) => handleUpdateField("nationality", val)}
                  />
                </View>
              </View>

              {/* Quê quán */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.place_of_origin", "Quê quán")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.place_of_origin_placeholder", "Nhập quê quán")}
                    placeholderTextColor={colors.icon}
                    value={formData.place_of_origin || ""}
                    onChangeText={(val) => handleUpdateField("place_of_origin", val)}
                  />
                </View>
              </View>

              {/* Nơi thường trú */}
              <View style={styles.section}>
                <CustomText style={[styles.label, { color: colors.text }]} type="semiBold">
                  {t("profile.place_of_residence", "Nơi thường trú")}
                </CustomText>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("profile.place_of_residence_placeholder", "Nhập nơi thường trú")}
                    placeholderTextColor={colors.icon}
                    value={formData.place_of_residence || ""}
                    onChangeText={(val) => handleUpdateField("place_of_residence", val)}
                  />
                </View>
              </View>

              <View style={{ height: hp(4) }} />
            </>
          )}
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomButtons, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={updating || loading}
          >
            <CustomText style={[styles.cancelButtonText, { color: colors.text }]} type="semiBold">
              {t("common.cancel", "Hủy")}
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
              {updating ? t("common.saving", "Đang lưu...") : t("common.save", "Lưu thay đổi")}
            </CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },

  section: {
    paddingHorizontal: wp(5),
    marginTop: hp(2.5),
  },
  label: {
    fontSize: normalize(14),
    marginBottom: normalize(8),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
    padding: 0,
    fontFamily: "Quicksand-Regular", // Consistent with text inputs in the app
  },
  genderContainer: {
    flexDirection: "row",
    gap: normalize(12),
  },
  genderButton: {
    flex: 1,
    paddingVertical: normalize(14),
    alignItems: "center",
    borderRadius: normalize(12),
    borderWidth: 1,
  },

  bottomButtons: {
    flexDirection: "row",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(12),
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontSize: normalize(16),
  },
  saveButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: normalize(16),
    color: "#fff",
  },
});

export default EditProfileScreen;
