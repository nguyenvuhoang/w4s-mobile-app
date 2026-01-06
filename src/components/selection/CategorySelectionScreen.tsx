import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

// Types
interface ParsedCategoryName {
  vi: string;
  en: string;
}

type TabType = "INCOME" | "EXPENSE" | "LOAN";

const STORAGE_KEY = "temp_selected_category";

const CategorySelectionScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();

  // Map selectedType from params to TabType
  const initialTab = useMemo((): TabType => {
    const type = params.selectedType as string;
    if (type === "income") return "INCOME";
    if (type === "expense") return "EXPENSE";
    if (type === "inout") return "LOAN";
    return "INCOME"; // default
  }, [params.selectedType]);

  const [selectedTab, setSelectedTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories using hook
  const { categories, loading, error, refetch } = useCategory({
    autoFetch: true,
  });

  // Update tab when params change
  useEffect(() => {
    setSelectedTab(initialTab);
  }, [initialTab]);

  const parseCategoryName = (nameJson: string): ParsedCategoryName => {
    try {
      return JSON.parse(nameJson);
    } catch {
      return { vi: "", en: "" };
    }
  };

  // Filter and group categories
  const groupedCategories = useMemo(() => {
    // Filter by tab
    let filtered = categories.filter(
      (cat) => cat.category_type === selectedTab
    );

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter((cat) => {
        const name = parseCategoryName(cat.category_name);
        return (
          name.vi.toLowerCase().includes(searchQuery.toLowerCase()) ||
          name.en.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Group by parent
    const groups: { [key: string]: Category[] } = {};
    const parents = filtered.filter((cat) => !cat.parent_category_id);

    parents.forEach((parent) => {
      groups[parent.category_id] = [
        parent,
        ...filtered.filter(
          (cat) => cat.parent_category_id === parent.category_id
        ),
      ];
    });

    return groups;
  }, [categories, selectedTab, searchQuery]);

  const handleSelectCategory = async (category: Category) => {
    const categoryData = {
      category_id: category.category_id,
      category_name: category.category_name,
      category_type: category.category_type,
      icon: category.icon,
      color: category.color,
    };

    try {
      await StorageService.setAsyncItem(
        STORAGE_KEY,
        JSON.stringify(categoryData)
      );
      router.back();
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleCreateNew = () => {
    console.log("Create new category");
  };

  // Error state
  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Chọn nhóm" showBackButton />
        <View style={styles.centerContainer}>
          <CustomText style={[styles.errorText, { color: colors.text }]}>
            {error}
          </CustomText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={refetch}
          >
            <CustomText style={styles.retryButtonText}>Thử lại</CustomText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Chọn nhóm" showBackButton />

      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.tint }]}
          onPress={handleCreateNew}
        >
          <CustomText style={styles.createButtonText}>
            + Tạo nhóm mới
          </CustomText>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "INCOME" && [
              styles.tabActive,
              { backgroundColor: colors.tint },
            ],
          ]}
          onPress={() => setSelectedTab("INCOME")}
        >
          <CustomText
            style={[
              styles.tabText,
              selectedTab === "INCOME" && styles.tabTextActive,
            ]}
          >
            Khoản thu
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "EXPENSE" && [
              styles.tabActive,
              { backgroundColor: colors.tint },
            ],
          ]}
          onPress={() => setSelectedTab("EXPENSE")}
        >
          <CustomText
            style={[
              styles.tabText,
              selectedTab === "EXPENSE" && styles.tabTextActive,
            ]}
          >
            Khoản chi
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "LOAN" && [
              styles.tabActive,
              { backgroundColor: colors.tint },
            ],
          ]}
          onPress={() => setSelectedTab("LOAN")}
        >
          <CustomText
            style={[
              styles.tabText,
              selectedTab === "LOAN" && styles.tabTextActive,
            ]}
          >
            Vay/Nợ
          </CustomText>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={normalize(20)} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Tìm kiếm nhóm..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={normalize(20)}
              color={colors.icon}
            />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText style={[styles.loadingText, { color: colors.text }]}>
            Đang tải...
          </CustomText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {Object.keys(groupedCategories).length === 0 ? (
            <View style={styles.emptyContainer}>
              <CustomText style={[styles.emptyText, { color: colors.icon }]}>
                Không tìm thấy nhóm nào
              </CustomText>
            </View>
          ) : (
            Object.entries(groupedCategories).map(([parentId, group]) => {
              const parent = group[0];
              const children = group.slice(1);
              const parentName = parseCategoryName(parent.category_name);

              return (
                <View
                  key={parentId}
                  style={[
                    styles.categoryGroup,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.categoryItem}
                    onPress={() => handleSelectCategory(parent)}
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
                      style={[styles.categoryName, { color: colors.text }]}
                    >
                      {parentName.vi}
                    </CustomText>
                  </TouchableOpacity>

                  {children.length > 0 && (
                    <View style={styles.childrenContainer}>
                      {children.map((child) => {
                        const childName = parseCategoryName(
                          child.category_name
                        );
                        return (
                          <TouchableOpacity
                            key={child.category_id}
                            style={styles.childItem}
                            onPress={() => handleSelectCategory(child)}
                          >
                            <View style={styles.childIndicator}>
                              <View
                                style={[
                                  styles.childLine,
                                  { borderColor: colors.border },
                                ]}
                              />
                              <View
                                style={[
                                  styles.childDot,
                                  { backgroundColor: colors.border },
                                ]}
                              />
                            </View>
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
                              style={[styles.childName, { color: colors.text }]}
                            >
                              {childName.vi}
                            </CustomText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
          <View style={{ height: hp(2) }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  createButtonContainer: { paddingHorizontal: wp(5), paddingVertical: hp(1.5) },
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
    gap: normalize(8),
    marginBottom: hp(2),
  },
  tab: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(100),
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  tabActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: normalize(14), fontWeight: "500", color: "#666" },
  tabTextActive: { color: "#fff", fontWeight: "600" },
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
  searchInput: { flex: 1, fontSize: normalize(15) },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(5), gap: normalize(12) },
  categoryGroup: {
    borderRadius: normalize(16),
    padding: normalize(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  categoryName: { fontSize: normalize(16), fontWeight: "600" },
  childrenContainer: { marginTop: normalize(4) },
  childItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: normalize(8),
    paddingLeft: normalize(12),
    gap: normalize(12),
  },
  childIndicator: {
    width: normalize(24),
    alignItems: "center",
    justifyContent: "center",
  },
  childLine: {
    position: "absolute",
    left: normalize(12),
    top: 0,
    bottom: 0,
    width: 2,
    borderLeftWidth: 2,
  },
  childDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
  },
  childIcon: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  childName: { fontSize: normalize(15), fontWeight: "500" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(10),
  },
  loadingText: { marginTop: normalize(12), fontSize: normalize(14) },
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: hp(10),
  },
  emptyText: { fontSize: normalize(16) },
});

export default CategorySelectionScreen;
