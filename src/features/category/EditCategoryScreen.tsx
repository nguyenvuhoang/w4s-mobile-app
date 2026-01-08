import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Category } from "@/services/repositories/category.repository";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";

/* =====================
   Helpers
===================== */
const parseCategoryName = (json: string) => {
  try {
    return JSON.parse(json) as { vi: string; en: string };
  } catch {
    return { vi: "", en: "" };
  }
};

const stringifyCategoryName = (vi: string, en: string) =>
  JSON.stringify({ vi, en });

const getCategoryGroupLabel = (group: string) => {
  switch (group) {
    case "EXPENSE":
      return "Khoản chi";
    case "INCOME":
      return "Khoản thu";
    case "LOAN":
      return "Khoản vay";
    default:
      return group;
  }
};

/* =====================
   Screen
===================== */
const EditCategoryScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{
    category?: string;
    allCategories?: string;
  }>();

  /* =====================
     Parse category param
  ===================== */
  const category = useMemo<Category | null>(() => {
    if (!params.category) return null;
    try {
      return JSON.parse(decodeURIComponent(params.category)) as Category;
    } catch {
      return null;
    }
  }, [params.category]);

  /* =====================
     Parse all categories list
  ===================== */
  const allCategories = useMemo<Category[]>(() => {
    if (!params.allCategories) return [];
    try {
      return JSON.parse(decodeURIComponent(params.allCategories)) as Category[];
    } catch {
      return [];
    }
  }, [params.allCategories]);

  if (!category) return null;

  const parsedName = parseCategoryName(category.category_name);

  /* =====================
     Local state
  ===================== */
  const [nameVi, setNameVi] = useState(parsedName.vi);
  const [nameEn, setNameEn] = useState(parsedName.en);
  const [icon, setIcon] = useState(category.icon);
  const [color, setColor] = useState(category.color);

  // ✅ Lưu toàn bộ parent category object
  const [parentCategory, setParentCategory] = useState<Category | null>(() => {
    if (!category.parent_category_id || !allCategories.length) return null;
    return (
      allCategories.find((c) => c.category_id === category.parent_category_id) ||
      null
    );
  });

  const parentParsedName = useMemo(() => {
    return parentCategory
      ? parseCategoryName(parentCategory.category_name)
      : null;
  }, [parentCategory]);

  /* =====================
     Load selected icon/color/parent from storage
  ===================== */
  useFocusEffect(
    useCallback(() => {
      const loadSelectedData = async () => {
        // ✅ Load icon - dùng getAsyncItem
        const selectedIcon = await StorageService.getAsyncItem("temp_selected_icon");
        if (selectedIcon) {
          setIcon(selectedIcon);
          await StorageService.removeAsyncItem("temp_selected_icon");
        }

        // ✅ Load color - dùng getAsyncItem
        const selectedColor = await StorageService.getAsyncItem("temp_selected_color");
        if (selectedColor) {
          setColor(selectedColor);
          await StorageService.removeAsyncItem("temp_selected_color");
        }

        // ✅ Load parent category - dùng getAsyncItem
        const selectedCategoryJson = await StorageService.getAsyncItem("temp_selected_category");
        if (selectedCategoryJson) {
          try {
            const selectedCategory = JSON.parse(selectedCategoryJson) as Category;
            setParentCategory(selectedCategory);
          } catch (err) {
            console.error("Parse parent category error:", err);
          }
          await StorageService.removeAsyncItem("temp_selected_category");
        }
      };

      loadSelectedData();
    }, [])
  );

  /* =====================
     Handlers
  ===================== */
  const handleSelectIcon = () => {
    router.push({
      pathname: "/(protected)/select-icon",
      params: { color },
    });
  };

  const handleSelectColor = () => {
    router.push({
      pathname: "/(protected)/select-color",
      params: { icon },
    });
  };

  const handleSelectParentCategory = () => {
    router.push({
      pathname: "/(protected)/select-category",
      params: {
        selectedType: category.category_type,
        isSelectParent: "true",
      },
    });
  };

  const handleClearParent = () => {
    if (!parentCategory) return;

    Alert.alert(
      "Xóa loại",
      "Bạn có muốn xóa danh mục cha (loại) hiện tại không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => setParentCategory(null),
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!nameVi.trim()) {
      Alert.alert("Lỗi", "Tên nhóm (VI) không được để trống");
      return;
    }

    const payload = {
      ...category,
      category_name: stringifyCategoryName(nameVi, nameEn),
      icon,
      color,
      parent_category_id: parentCategory?.category_id || null, // ✅ lấy ID từ object
    };

    console.log("UPDATE CATEGORY:", payload);

    // TODO: call API update category
    // await updateCategory(payload)

    Alert.alert("Thành công", "Đã cập nhật nhóm", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Xóa nhóm", "Bạn có chắc chắn muốn xóa nhóm này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          console.log("DELETE CATEGORY:", category.category_id);

          // TODO: call API delete
          // await deleteCategory(category.category_id)

          router.back();
        },
      },
    ]);
  };

  /* =====================
     Render
  ===================== */
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Chỉnh sửa nhóm" showBackButton />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ICON PREVIEW */}
        <View style={styles.previewContainer}>
          <View style={[styles.iconPreview, { backgroundColor: color }]}>
            <FontAwesome6
              name={icon as any}
              size={normalize(33)}
              color="#fff"
            />
          </View>
        </View>

        {/* INFO CARD: Nhóm (readonly) + Loại (parent category) */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* NHÓM - READONLY */}
          <View style={styles.infoRow}>
            <CustomText style={[styles.infoLabel, { color: colors.icon }]}>
              Nhóm
            </CustomText>

            <View style={styles.readonlyValue}>
              <CustomText style={[styles.infoValue, { color: colors.text }]}>
                {getCategoryGroupLabel(category.category_group)}
              </CustomText>
              <Ionicons
                name="lock-closed-outline"
                size={normalize(14)}
                color={colors.icon}
              />
            </View>
          </View>

          <View
            style={[styles.infoDivider, { backgroundColor: colors.border }]}
          />

          {/* LOẠI - PARENT CATEGORY (EDITABLE) */}
          <TouchableOpacity
            style={styles.infoRow}
            activeOpacity={0.7}
            onPress={handleSelectParentCategory}
          >
            <CustomText style={[styles.infoLabel, { color: colors.icon }]}>
              Loại
            </CustomText>

            <View style={styles.parentValue}>
              {parentCategory ? (
                <>
                  <View
                    style={[
                      styles.parentIconSmall,
                      { backgroundColor: parentCategory.color },
                    ]}
                  >
                    <FontAwesome6
                      name={parentCategory.icon as any}
                      size={normalize(14)}
                      color="#fff"
                    />
                  </View>
                  <CustomText
                    style={[styles.infoValue, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {parentParsedName?.vi || "N/A"}
                  </CustomText>
                </>
              ) : (
                <CustomText
                  style={[styles.placeholderText, { color: colors.icon }]}
                >
                  Chọn loại
                </CustomText>
              )}

              <TouchableOpacity
                onPress={(e) => {
                  // tránh trigger onPress của row
                  e.stopPropagation?.();
                  handleClearParent();
                }}
                disabled={!parentCategory}
                hitSlop={10}
                style={{ opacity: parentCategory ? 1 : 0.35 }}
              >
                <Ionicons
                  name="close-circle"
                  size={normalize(18)}
                  color={colors.error}
                />
              </TouchableOpacity>

              <FontAwesome6
                name="chevron-right"
                size={normalize(12)}
                color={colors.icon}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* ICON & COLOR SELECTORS */}
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[
              styles.selectorCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleSelectIcon}
          >
            <CustomText style={[styles.selectorLabel, { color: colors.text }]}>
              Icon
            </CustomText>
            <View style={styles.selectorValue}>
              <FontAwesome6
                name={icon as any}
                size={normalize(20)}
                color={colors.text}
              />
              <FontAwesome6
                name="chevron-right"
                size={normalize(14)}
                color={colors.icon}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleSelectColor}
          >
            <CustomText style={[styles.selectorLabel, { color: colors.text }]}>
              Màu sắc
            </CustomText>
            <View style={styles.selectorValue}>
              <View style={[styles.colorDot, { backgroundColor: color }]} />
              <FontAwesome6
                name="chevron-right"
                size={normalize(14)}
                color={colors.icon}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* NAME VI */}
        <View style={styles.field}>
          <CustomText style={[styles.label, { color: colors.text }]}>
            Tên nhóm (VI)
          </CustomText>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={nameVi}
              onChangeText={setNameVi}
              placeholder="Nhập tên nhóm"
              placeholderTextColor={colors.icon}
              style={[styles.input, { color: colors.text }]}
            />
          </View>
        </View>

        {/* NAME EN */}
        <View style={styles.field}>
          <CustomText style={[styles.label, { color: colors.text }]}>
            Tên nhóm (EN)
          </CustomText>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={nameEn}
              onChangeText={setNameEn}
              placeholder="Enter category name"
              placeholderTextColor={colors.icon}
              style={[styles.input, { color: colors.text }]}
            />
          </View>
        </View>

        {/* SAVE */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.tint }]}
          onPress={handleSave}
        >
          <CustomText style={styles.saveButtonText}>Lưu thay đổi</CustomText>
        </TouchableOpacity>

        {/* DELETE */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons
            name="trash-outline"
            size={normalize(18)}
            color={colors.error}
          />
          <CustomText style={[styles.deleteText, { color: colors.error }]}>
            Xóa nhóm
          </CustomText>
        </TouchableOpacity>

        <View style={{ height: hp(4) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditCategoryScreen;

/* =====================
   Styles
===================== */
const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
  },

  previewContainer: {
    alignItems: "center",
    marginBottom: hp(2),
  },
  iconPreview: {
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(15),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  infoCard: {
    borderRadius: normalize(12),
    padding: normalize(16),
    marginBottom: hp(2),
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: normalize(10),
  },
  infoLabel: {
    fontSize: normalize(14),
    fontWeight: "500",
  },
  infoValue: {
    fontSize: normalize(14),
    fontWeight: "600",
  },
  infoDivider: {
    height: 1,
    marginVertical: normalize(4),
  },

  readonlyValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
  },

  parentValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    maxWidth: "72%",
  },

  parentIconSmall: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(8),
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    fontSize: normalize(14),
    fontWeight: "500",
  },

  selectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: normalize(12),
    marginBottom: hp(2),
  },
  selectorCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: normalize(16),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  selectorLabel: {
    fontSize: normalize(15),
    fontWeight: "500",
  },
  selectorValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  colorDot: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
  },

  field: {
    marginBottom: hp(2),
  },
  label: {
    fontSize: normalize(14),
    fontWeight: "500",
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
  },

  saveButton: {
    marginTop: hp(2),
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: normalize(16),
    fontWeight: "600",
    color: "#fff",
  },

  deleteButton: {
    marginTop: hp(2),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: normalize(6),
  },
  deleteText: {
    fontSize: normalize(15),
    fontWeight: "500",
  },
});