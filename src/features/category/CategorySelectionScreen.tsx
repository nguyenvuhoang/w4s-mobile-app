import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
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
import { useCategory } from "@/hooks/useCategory";
import { Category } from "@/services/repositories/category.repository";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";

/* =====================
   Types
===================== */
interface ParsedCategoryName {
  vi: string;
  en: string;
}

type TabType = "INCOME" | "EXPENSE" | "LOAN";

const STORAGE_KEY = "temp_selected_category";

/* =====================
   Screen
===================== */
const CategorySelectionScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const params = useLocalSearchParams<{
    selectedType?: string;
    isEdit?: string;
    isSelectParent?: string;
    isBudget?: string;
  }>();

  /* =====================
     Modes
  ===================== */
  const isEdit = useMemo(() => params.isEdit === "true", [params.isEdit]);
  const isSelectParent = useMemo(
    () => params.isSelectParent === "true",
    [params.isSelectParent]
  );
  const isBudget = useMemo(() => params.isBudget === "true", [params.isBudget]);

  /* =====================
     Available Tabs
  ===================== */
  const availableTabs = useMemo((): TabType[] => {
    // 🔥 Nếu đang chọn cho ngân sách, chỉ cho chọn EXPENSE
    if (isBudget) {
      return ["EXPENSE"];
    }
    // 🔥 Nếu đang select parent, chỉ cho chọn INCOME hoặc EXPENSE
    if (isSelectParent) {
      return ["INCOME", "EXPENSE"];
    }
    // Normal mode: cho chọn cả 3
    return ["INCOME", "EXPENSE", "LOAN"];
  }, [isSelectParent, isBudget]);

  /* =====================
     Initial Tab
  ===================== */
  const initialTab = useMemo((): TabType => {
    let requestedTab: TabType = "INCOME";

    if (params.selectedType === "income") requestedTab = "INCOME";
    else if (params.selectedType === "expense") requestedTab = "EXPENSE";
    else if (params.selectedType === "inout") requestedTab = "LOAN";
    else if (params.selectedType === "INCOME") requestedTab = "INCOME";
    else if (params.selectedType === "EXPENSE") requestedTab = "EXPENSE";
    else if (params.selectedType === "LOAN") requestedTab = "LOAN";

    // 🔥 Nếu requested tab không có trong available tabs, fallback về tab đầu tiên
    if (!availableTabs.includes(requestedTab)) {
      return availableTabs[0];
    }

    return requestedTab;
  }, [params.selectedType, availableTabs]);

  const [selectedTab, setSelectedTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  const { categories, loading, error, refetch } = useCategory({
    autoFetch: true,
  });

  useEffect(() => {
    setSelectedTab(initialTab);
  }, [initialTab]);

  // Khi quay lại từ EditCategoryScreen → refetch để lấy data mới nhất
  useFocusEffect(
    useCallback(() => {
      if (isEdit) {
        refetch();
      }
    }, [isEdit])
  );

  /* =====================
     Helpers
  ===================== */
  const parseCategoryName = (nameJson: string): ParsedCategoryName => {
    try {
      return JSON.parse(nameJson);
    } catch {
      return { vi: "", en: "" };
    }
  };

  /* =====================
     Group categories
  ===================== */
  const groupedCategories = useMemo(() => {
    let filtered = categories.filter(
      (cat) => cat.category_group === selectedTab
    );

    if (searchQuery) {
      filtered = filtered.filter((cat) => {
        const name = parseCategoryName(cat.category_name);
        return (
          name.vi.toLowerCase().includes(searchQuery.toLowerCase()) ||
          name.en.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    /* =====================
       SELECT PARENT MODE
    ===================== */
    if (isSelectParent) {
      return filtered
        .filter((cat) => !cat.parent_category_id)
        .reduce<Record<string, Category[]>>((acc, cat) => {
          acc[cat.id] = [cat];
          return acc;
        }, {});
    }

    /* =====================
       NORMAL MODE
    ===================== */
    const groups: Record<string, Category[]> = {};
    const parents = filtered.filter((cat) => !cat.parent_category_id);

    parents.forEach((parent) => {
      groups[parent.id] = [
        parent,
        ...filtered.filter(
          (cat) => cat.parent_category_id === parent.id
        ),
      ];
    });

    return groups;
  }, [categories, selectedTab, searchQuery, isSelectParent]);

  /* =====================
     Press handler
  ===================== */
  const handlePressCategory = async (category: Category) => {
    // 🔥 SELECT PARENT MODE - Lưu toàn bộ category object
    if (isSelectParent) {
      await StorageService.setAsyncItem(
        STORAGE_KEY,
        JSON.stringify(category)
      );
      router.back();
      return;
    }

    // ✏️ EDIT MODE
    if (isEdit) {
      router.push({
        pathname: "/(protected)/edit-category",
        params: {
          category: encodeURIComponent(JSON.stringify(category)),
          allCategories: encodeURIComponent(JSON.stringify(categories)),
        },
      });
      return;
    }

    // ✅ SELECT MODE
    try {
      await StorageService.setAsyncItem(
        STORAGE_KEY,
        JSON.stringify(category)
      );
      router.back();
    } catch (err) {
      console.error("Save category error:", err);
    }
  };

  /* =====================
     Error UI
  ===================== */
  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title={t("category.title")} showBackButton />
        <View style={styles.centerContainer}>
          <CustomText style={[styles.errorText, { color: colors.text }]}>
            {error}
          </CustomText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={refetch}
          >
            <CustomText style={styles.retryButtonText}>{t("common.retry")}</CustomText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* =====================
     Render
  ===================== */
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader
        title={
          isSelectParent
            ? t("category.select_type_parent")
            : isEdit
              ? t("category.edit_category")
              : t("category.title")
        }
        showBackButton
      />

      {/* CREATE BUTTON */}
      {!isSelectParent && (
        <View style={styles.createButtonContainer}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.tint }]}
            onPress={() => {
              router.push({
                pathname: "/(protected)/category/create-category",
                params: {
                  type: selectedTab,
                },
              });
            }}
          >
            <CustomText style={styles.createButtonText}>
              {t("category.create_new_category")}
            </CustomText>
          </TouchableOpacity>
        </View>
      )}

      {/* TABS */}
      {availableTabs.length > 1 && (
        <View style={styles.tabContainer}>
          {availableTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab && { backgroundColor: colors.tint },
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <CustomText
                style={{ color: selectedTab === tab ? "#fff" : "#666" }}
              >
                {tab === "INCOME"
                  ? t("transaction.type_income")
                  : tab === "EXPENSE"
                    ? t("transaction.type_expense")
                    : t("transaction.type_debt_loan")}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* SEARCH */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={normalize(20)} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={
            isSelectParent ? t("category.search_type_placeholder") : t("category.search_category_placeholder")
          }
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {Object.values(groupedCategories).map((group) => {
            const parent = group[0];
            const children = group.slice(1);
            const parentName = parseCategoryName(parent.category_name);

            return (
              <View
                key={parent.id}
                style={[
                  styles.categoryGroup,
                  { backgroundColor: colors.card },
                ]}
              >
                {/* PARENT */}
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => handlePressCategory(parent)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: parent.color },
                    ]}
                  >
                    <FontAwesome6
                      name={parent.icon as any}
                      size={normalize(20)}
                      color="#fff"
                    />
                  </View>

                  <CustomText
                    style={[
                      styles.categoryName,
                      { color: colors.text, flex: 1 },
                    ]}
                  >
                    {parentName.vi}
                  </CustomText>

                  {isEdit && !isSelectParent && (
                    <Ionicons
                      name="chevron-forward"
                      size={normalize(18)}
                      color={colors.icon}
                    />
                  )}
                </TouchableOpacity>

                {/* CHILDREN - Chỉ render khi KHÔNG phải select parent mode */}
                {!isSelectParent && children.length > 0 && (
                  <>
                    {children.map((child) => {
                      const childName = parseCategoryName(child.category_name);

                      return (
                        <TouchableOpacity
                          key={child.id}
                          style={styles.childItem}
                          onPress={() => handlePressCategory(child)}
                        >
                          <View
                            style={[
                              styles.childIcon,
                              { backgroundColor: child.color },
                            ]}
                          >
                            <FontAwesome6
                              name={child.icon as any}
                              size={normalize(16)}
                              color="#fff"
                            />
                          </View>

                          <CustomText
                            style={[
                              styles.childName,
                              { color: colors.text, flex: 1 },
                            ]}
                          >
                            {childName.vi}
                          </CustomText>

                          {isEdit && (
                            <Ionicons
                              name="chevron-forward"
                              size={normalize(18)}
                              color={colors.icon}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default CategorySelectionScreen;

/* =====================
   Styles
===================== */
const styles = StyleSheet.create({
  container: { flex: 1 },

  createButtonContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
  },
  createButton: {
    paddingVertical: normalize(14),
    borderRadius: normalize(100),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    fontSize: normalize(16),
    fontWeight: "600",
    color: "#fff",
  },

  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    gap: normalize(8),
  },
  tab: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(100),
    alignItems: "center",
    backgroundColor: "#eee",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    gap: normalize(8),
  },
  searchInput: { flex: 1 },

  scrollContent: {
    paddingHorizontal: wp(5),
    gap: normalize(12),
  },

  categoryGroup: {
    borderRadius: normalize(16),
    padding: normalize(12),
  },

  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    paddingVertical: normalize(8),
  },
  categoryIcon: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: normalize(16),
    fontWeight: "600",
  },

  childItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    paddingLeft: normalize(56),
    paddingVertical: normalize(8),
  },
  childIcon: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  childName: {
    fontSize: normalize(15),
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: normalize(16),
    textAlign: "center",
    marginBottom: normalize(20),
  },
  retryButton: {
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(24),
    borderRadius: normalize(12),
  },
  retryButtonText: {
    fontSize: normalize(16),
    fontWeight: "600",
    color: "#fff",
  },
});