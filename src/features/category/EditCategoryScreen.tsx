import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import STORAGE_KEY from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useEditCategory } from "@/features/category/hooks/useEditCategory";
import { useCategory } from "@/hooks/useCategory";
import { Category } from "@/services/repositories/category.repository";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { translateText } from "@/utils/translation";

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
  const { updating, deleting, updateCategory, deleteCategory } = useEditCategory();
  const { clearCache } = useCategory({ autoFetch: false });
  const { showNotification, hideNotification } = useNotification();
  const { i18n } = useTranslation();
  const params = useLocalSearchParams<{
    category?: string;
    allCategories?: string;
  }>();

  // Ngôn ngữ hiện tại
  const currentLang = i18n.language as 'vi' | 'en';
  const otherLang = currentLang === 'vi' ? 'en' : 'vi';

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

  const [primaryName, setPrimaryName] = useState(
    currentLang === 'vi' ? parsedName.vi : parsedName.en
  );
  const [translatedName, setTranslatedName] = useState(
    currentLang === 'vi' ? parsedName.en : parsedName.vi
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(
    !!(currentLang === 'vi' ? parsedName.en : parsedName.vi)
  );
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);
  const translateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [icon, setIcon] = useState(category.icon);
  const [color, setColor] = useState(category.color);

  const [parentCategory, setParentCategory] = useState<Category | null>(() => {
    if (!category.parent_category_id || !allCategories.length) return null;
    return allCategories.find((c) => c.id == category.parent_category_id) || null;
  });

  const getLocalizedName = (nameJson: string) => {
    try {
      const parsed = JSON.parse(nameJson);
      return parsed[currentLang] || parsed.vi || parsed.en || '';
    } catch {
      return nameJson;
    }
  };

  useEffect(() => {
    if (translateTimeoutRef.current) {
      clearTimeout(translateTimeoutRef.current);
    }

    if (primaryName.trim() && !isEditingTranslation) {
      setIsTranslating(true);
      translateTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await translateText(primaryName.trim(), currentLang, otherLang);
          if (result.success) {
            setTranslatedName(result.translatedText);
            setShowTranslation(true);
          }
        } catch (err) {
          console.error('[EditCategory] Translation failed:', err);
        } finally {
          setIsTranslating(false);
        }
      }, 800);
    } else {
      setIsTranslating(false);
      if (!primaryName.trim()) {
        setTranslatedName('');
        setShowTranslation(false);
      }
    }

    return () => {
      if (translateTimeoutRef.current) clearTimeout(translateTimeoutRef.current);
    };
  }, [primaryName, currentLang, otherLang, isEditingTranslation]);

  const handleRetryTranslation = async () => {
    if (!primaryName.trim()) return;
    setIsTranslating(true);
    try {
      const result = await translateText(primaryName.trim(), currentLang, otherLang);
      if (result.success) {
        setTranslatedName(result.translatedText);
        setShowTranslation(true);
      }
    } catch (err) {
      console.error('[EditCategory] Retry translation failed:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadSelectedData = async () => {
        try {
          const selectedIcon = await StorageService.getItem(STORAGE_KEY.TEMP_ICON_STORAGE);
          if (selectedIcon) {
            setIcon(selectedIcon);
            await StorageService.removeItem(STORAGE_KEY.TEMP_ICON_STORAGE);
          }

          const selectedColor = await StorageService.getItem(STORAGE_KEY.TEMP_COLOR_STORAGE);
          if (selectedColor) {
            setColor(selectedColor);
            await StorageService.removeItem(STORAGE_KEY.TEMP_COLOR_STORAGE);
          }

          const selectedCategoryJson = await StorageService.getItem(STORAGE_KEY.TEMP_CATEGORY_STORAGE);
          if (selectedCategoryJson) {
            try {
              const selectedCategory = JSON.parse(selectedCategoryJson) as Category;
              setParentCategory(selectedCategory);
            } catch (err) {
              console.error('[EditCategory] Failed to parse parent category:', err);
            }
            await StorageService.removeItem(STORAGE_KEY.TEMP_CATEGORY_STORAGE);
          }
        } catch (error) {
          console.error('[EditCategory] Failed to load selected data:', error);
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
        selectedType: category.category_group,
        isSelectParent: "true",
      },
    });
  };

  const handleClearParent = () => {
    if (!parentCategory) return;

    showNotification(
      "Xóa loại",
      "warning",
      "",
      "Bạn có muốn xóa danh mục cha (loại) hiện tại không?",
      () => {
        setParentCategory(null);
        hideNotification();
      }
    );
  };

  const handleSave = async () => {
    if (!primaryName.trim()) {
      showNotification("Tên nhóm không được để trống", "warning");
      return;
    }

    const viName = currentLang === 'vi' ? primaryName.trim() : translatedName.trim() || primaryName.trim();
    const enName = currentLang === 'en' ? primaryName.trim() : translatedName.trim() || primaryName.trim();

    const success = await updateCategory({
      id: category.id,
      parent_category_id: parentCategory?.id ?? 0,
      category_group: category.category_group,
      category_type: category.category_type,
      category_name: stringifyCategoryName(viName, enName),
      icon,
      color,
      contract_number: category.category_code ?? '',
    });

    if (success) {
      clearCache();
      showNotification(
        "Đã cập nhật nhóm thành công",
        "success",
        "",
        "",
        undefined,
        () => router.back()
      );
    } else {
      showNotification("Không thể cập nhật nhóm. Vui lòng thử lại.", "error");
    }
  };

  const handleDelete = () => {
    showNotification(
      "Xóa nhóm",
      "warning",
      "",
      "Bạn có chắc chắn muốn xóa nhóm này không?",
      async () => {
        hideNotification();
        const success = await deleteCategory(category.id);
        if (success) {
          clearCache();
          showNotification(
            "Đã xóa nhóm thành công",
            "success",
            "",
            "",
            undefined,
            () => router.back()
          );
        } else {
          showNotification("Không thể xóa nhóm. Vui lòng thử lại.", "error");
        }
      },
      undefined,
      undefined,
      () => hideNotification()
    );
  };

  /* =====================
     Render
  ===================== */
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Chỉnh sửa nhóm" showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : normalize(20)}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ICON PREVIEW */}
          <View style={styles.previewContainer}>
            <View style={[styles.iconPreview, { backgroundColor: color }]}>
              <AppIcon
                name={icon as any}
                size={normalize(33)}
                color="#fff"
              />
            </View>
          </View>

          {/* INFO CARD: Nhóm (readonly) */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.infoRow}>
              <CustomText style={[styles.infoLabel, { color: colors.icon }]}>
                Nhóm
              </CustomText>
              <View style={styles.readonlyValue}>
                <CustomText style={[styles.infoValue, { color: colors.text }]}>
                  {getCategoryGroupLabel(category.category_group)}
                </CustomText>
                <AppIcon
                  name="lock"
                  size={normalize(14)}
                  color={colors.icon}
                />
              </View>
            </View>
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
                <AppIcon
                  name={icon as any}
                  size={normalize(20)}
                  color={colors.text}
                />
                <AppIcon
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
                <AppIcon
                  name="chevron-right"
                  size={normalize(14)}
                  color={colors.icon}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Parent Category Selector - Optional */}
          <View style={styles.parentSection}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Danh mục cha
            </CustomText>
            <TouchableOpacity
              style={[
                styles.parentField,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleSelectParentCategory}
            >
              <View style={styles.parentFieldLeft}>
                {parentCategory ? (
                  <>
                    <View
                      style={[
                        styles.parentCategoryIcon,
                        { backgroundColor: parentCategory.color },
                      ]}
                    >
                      <AppIcon
                        name={parentCategory.icon as any}
                        size={normalize(18)}
                        color="#fff"
                      />
                    </View>
                    <CustomText style={[styles.parentFieldText, { color: colors.text }]}>
                      {getLocalizedName(parentCategory.category_name)}
                    </CustomText>
                  </>
                ) : (
                  <>
                    <View
                      style={[
                        styles.parentCategoryIcon,
                        { backgroundColor: colors.border },
                      ]}
                    />
                    <CustomText style={[styles.parentFieldText, { color: colors.icon }]}>
                      Chọn danh mục cha (tùy chọn)
                    </CustomText>
                  </>
                )}
              </View>
              {parentCategory && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleClearParent();
                  }}
                  hitSlop={10}
                >
                  <AppIcon name="circle-xmark" size={normalize(20)} color={colors.error} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* PRIMARY NAME (ngôn ngữ hiện tại) */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                {currentLang === 'vi' ? 'Tên nhóm (VI)' : 'Category name (EN)'}
              </CustomText>
              <View style={styles.langBadge}>
                <CustomText style={styles.langBadgeText}>
                  {currentLang.toUpperCase()}
                </CustomText>
              </View>
            </View>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TextInput
                value={primaryName}
                onChangeText={(text) => {
                  setPrimaryName(text);
                  setIsEditingTranslation(false);
                }}
                placeholder={currentLang === 'vi' ? 'Nhập tên nhóm...' : 'Enter category name...'}
                placeholderTextColor={colors.icon}
                style={[styles.input, { color: colors.text }]}
              />
              {isTranslating && (
                <ActivityIndicator size="small" color={colors.tint} />
              )}
            </View>
          </View>

          {/* TRANSLATED NAME (ngôn ngữ còn lại - auto) */}
          {showTranslation && primaryName.trim() && (
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <CustomText style={[styles.label, { color: colors.text }]}>
                  {otherLang === 'vi' ? 'Tên nhóm (VI)' : 'Category name (EN)'}
                </CustomText>
                <View style={[styles.langBadge, { backgroundColor: colors.border }]}>
                  <CustomText style={[styles.langBadgeText, { color: colors.text }]}>
                    {otherLang.toUpperCase()}
                  </CustomText>
                </View>
                <TouchableOpacity
                  style={styles.autoTranslateTag}
                  onPress={handleRetryTranslation}
                >
                  <AppIcon name="language" size={normalize(14)} color={colors.tint} />
                  <CustomText style={[styles.autoTranslateText, { color: colors.tint }]}>
                    Tự động dịch
                  </CustomText>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <TextInput
                  value={translatedName}
                  onChangeText={(text) => {
                    setTranslatedName(text);
                    setIsEditingTranslation(true);
                  }}
                  placeholder={otherLang === 'vi' ? 'Tên tiếng Việt...' : 'English name...'}
                  placeholderTextColor={colors.icon}
                  style={[styles.input, { color: colors.text }]}
                />
                {isEditingTranslation && (
                    <TouchableOpacity onPress={handleRetryTranslation} style={styles.refreshButton}>
                      <AppIcon name="rotate-right" size={normalize(18)} color={colors.tint} />
                    </TouchableOpacity>
                )}
              </View>
              <CustomText style={[styles.hintText, { color: colors.icon }]}>
                Có thể chỉnh sửa thủ công nếu cần
              </CustomText>
            </View>
          )}

          {/* SAVE */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: updating ? colors.icon : colors.tint },
            ]}
            onPress={handleSave}
            disabled={updating || deleting}
          >
            <CustomText style={styles.saveButtonText}>
              {updating ? "Đang lưu..." : "Lưu thay đổi"}
            </CustomText>
          </TouchableOpacity>

          {/* DELETE */}
          <TouchableOpacity
            style={[styles.deleteButton, { opacity: deleting ? 0.5 : 1 }]}
            onPress={handleDelete}
            disabled={updating || deleting}
          >
            <AppIcon
              name="trash-can"
              size={normalize(18)}
              color={colors.error}
            />
            <CustomText style={[styles.deleteText, { color: colors.error }]}>
              {deleting ? "Đang xóa..." : "Xóa nhóm"}
            </CustomText>
          </TouchableOpacity>

          <View style={{ height: hp(4) }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(8),
    gap: normalize(8),
  },
  label: {
    fontSize: normalize(14),
    fontWeight: "500",
  },
  langBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
    borderRadius: normalize(4),
  },
  langBadgeText: {
    fontSize: normalize(11),
    fontWeight: '600',
    color: '#fff',
  },
  autoTranslateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    marginLeft: 'auto',
  },
  autoTranslateText: {
    fontSize: normalize(12),
  },
  refreshButton: {
    padding: normalize(4),
  },
  hintText: {
    fontSize: normalize(12),
    marginTop: normalize(6),
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1,
    gap: normalize(8),
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

  // Parent Category Selector (giống CreateCategoryScreen)
  parentSection: {
    marginBottom: hp(2),
  },
  parentField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1,
    marginTop: normalize(8),
  },
  parentFieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    flex: 1,
  },
  parentCategoryIcon: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  parentFieldText: {
    fontSize: normalize(15),
  },
});
