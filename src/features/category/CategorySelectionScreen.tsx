import { router, useLocalSearchParams } from "expo-router";
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
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import i18n from "@/core/i18n/i18n";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useWallet } from "@/features/wallet/hooks/useWallet";
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

// const STATIC_LOAN_CATEGORIES: Category[] = [
//   {
//     id: -1,
//     category_code: "LOAN_COLLECT",
//     wallet_id: 0,
//     parent_category_id: 0,
//     category_group: "LOAN",
//     category_type: "LOAN_COLLECT",
//     category_name: JSON.stringify({ vi: "Thu nợ", en: "Debt Collection" }),
//     icon: "hand-holding-dollar",
//     color: "#4CAF50",
//     web_icon: "",
//   },
//   {
//     id: -2,
//     category_code: "LOAN_REPAY",
//     wallet_id: 0,
//     parent_category_id: 0,
//     category_group: "LOAN",
//     category_type: "LOAN_REPAY",
//     category_name: JSON.stringify({ vi: "Trả nợ", en: "Debt Repayment" }),
//     icon: "money-bill-transfer",
//     color: "#F44336",
//     web_icon: "",
//   },
// ];

/* =====================
   Screen
===================== */
const CategorySelectionScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const params = useLocalSearchParams<{
    selectedType?: string;
    walletId?: string;
    isSelectParent?: string;
    isBudget?: string;
    isInvoice?: string;
  }>();

  /* =====================
     Modes
  ===================== */
  const { wallets, defaultWalletId } = useWallet();

  const effectiveWalletId = useMemo(() => {
    if (params.walletId === "all") return "all";
    const paramWalletId = params.walletId ? parseInt(params.walletId) : 0;
    if (paramWalletId !== 0 && !isNaN(paramWalletId)) return paramWalletId;
    return defaultWalletId || (wallets.length > 0 ? wallets[0].walletId : 0);
  }, [params.walletId, defaultWalletId, wallets]);
  const isSelectParent = useMemo(
    () => params.isSelectParent === "true",
    [params.isSelectParent]
  );
  const isBudget = useMemo(() => params.isBudget === "true", [params.isBudget]);
  const isInvoice = useMemo(() => params.isInvoice === "true", [params.isInvoice]);

  /* =====================
     Available Tabs
  ===================== */
  const availableTabs = useMemo((): TabType[] => {
    if (isBudget || isInvoice) {
      return ["EXPENSE"];
    }
    if (isSelectParent) {
      return ["INCOME", "EXPENSE"];
    }
    return ["INCOME", "EXPENSE", "LOAN"];
  }, [isSelectParent, isBudget, isInvoice]);

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

    if (!availableTabs.includes(requestedTab)) {
      return availableTabs[0];
    }

    return requestedTab;
  }, [params.selectedType, availableTabs]);

  const [selectedTab, setSelectedTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  const { categories, loading, error, refetch } = useCategory({
    autoFetch: effectiveWalletId !== 0,
    walletId: effectiveWalletId !== "all" ? Number(effectiveWalletId) : 0,
  });

  useEffect(() => {
    setSelectedTab(initialTab);
  }, [initialTab]);

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

  const getCategoryName = useCallback(
    (nameJson: string): string => {
      const parsed = parseCategoryName(nameJson);
      const lang = i18n.language?.startsWith("vi") ? "vi" : "en";
      return parsed[lang] || parsed.vi || parsed.en || "";
    },
    [i18n.language]
  );

  /* =====================
     Group categories
  ===================== */
  const groupedCategories = useMemo(() => {
    let baseList = [...categories];

    // if (selectedTab === "LOAN") {
    //   baseList = [...baseList, ...STATIC_LOAN_CATEGORIES];
    // }

    // Deduplicate by category_code
    const uniqueBaseList = Array.from(
      new Map(baseList.map((cat) => [cat.category_code, cat])).values()
    );

    let filtered = uniqueBaseList.filter(
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

    if (isSelectParent) {
      return filtered
        .filter((cat) => !cat.parent_category_id)
        .reduce<Record<string, Category[]>>((acc, cat) => {
          acc[cat.id] = [cat];
          return acc;
        }, {});
    }

    const groups: Record<string, Category[]> = {};
    const parents = filtered.filter((cat) => !cat.parent_category_id);

    parents.forEach((parent) => {
      // Use id if available, otherwise fallback to category_code as unique key
      const groupingKey = parent.id !== undefined && parent.id !== null ? parent.id : parent.category_code;
      
      groups[groupingKey] = [
        parent,
        ...filtered.filter((cat) => {
          if (!cat.parent_category_id) return false;
          // Parent-child matching by numeric ID or by code if ID missing
          if (parent.id !== undefined && cat.parent_category_id === parent.id) return true;
          return false;
        }),
      ];
    });

    return groups;
  }, [categories, selectedTab, searchQuery, isSelectParent]);

  /* =====================
     Press handler
  ===================== */
  const handlePressCategory = async (category: Category) => {
    try {
      await StorageService.setItem(
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
            : t("category.title")
        }
        showBackButton
      />

      {/* TABS */}
      {availableTabs.length > 1 && (
        <View style={styles.tabContainer}>
          {availableTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                { backgroundColor: colors.card },
                selectedTab === tab && { backgroundColor: colors.tint },
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <CustomText
                style={{ color: selectedTab === tab ? "#fff" : colors.text }}
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
        <AppIcon name="magnifying-glass" size={normalize(20)} color={colors.icon} />
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
          {Object.values(groupedCategories).map((group, groupIndex) => {
            const parent = group[0];
            const children = group.slice(1);

            return (
              <View
                key={`group-${parent?.category_code || parent?.id}-${groupIndex}`}
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
                    <AppIcon
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
                    {getCategoryName(parent.category_name)}
                  </CustomText>
                </TouchableOpacity>

                {/* CHILDREN */}
                {!isSelectParent && children.length > 0 && (
                  <>
                    {children.map((child, childIndex) => {
                      return (
                        <TouchableOpacity
                          key={`child-${child?.category_code || child?.id}-${childIndex}`}
                          style={styles.childItem}
                          onPress={() => handlePressCategory(child)}
                        >
                          <View
                            style={[
                              styles.childIcon,
                              { backgroundColor: child.color },
                            ]}
                          >
                            <AppIcon
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
                            {getCategoryName(child.category_name)}
                          </CustomText>
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
    paddingBottom: hp(5),
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
