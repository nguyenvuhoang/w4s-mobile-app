import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import WalletPickerModal, { WalletPickerId } from "@/components/modals/WalletPickerModal";
import i18n from "@/core/i18n/i18n";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useCategory } from "@/hooks/useCategory";
import { Category } from "@/services/repositories/category.repository";
import { WalletSummary } from "@/types/wallet";
import { hp, normalize, wp } from "@/utils/layout";

/* =====================
   Types
 ===================== */
interface ParsedCategoryName {
  vi: string;
  en: string;
}

type TabType = "INCOME" | "EXPENSE" | "LOAN";


/* =====================
   Screen
 ===================== */
const CategoryManagementScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const {
    wallets,
    defaultWalletId,
    defaultWallet: contextDefaultWallet,
    loading: walletLoading,
  } = useWallet();

  const isInitialMount = useRef(true);

  // ID ví đang chọn (0 nghĩa là đang chờ load ví mặc định)
  const [selectedWalletId, setSelectedWalletId] = useState<WalletPickerId>(
    defaultWalletId || 0
  );
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Xác định ví "hiệu lực" để hiển thị và fetch data
  // Ưu tiên: ID đang chọn -> ID mặc định từ context -> Ví đầu tiên trong danh sách
  const effectiveWalletId = useMemo(() => {
    if (selectedWalletId !== 0) return selectedWalletId;
    return defaultWalletId || (wallets.length > 0 ? wallets[0].walletId : 0);
  }, [selectedWalletId, defaultWalletId, wallets]);

  // Thông tin ví để hiển thị trên header
  const selectedWallet = useMemo<WalletSummary | null>(() => {
    if (effectiveWalletId === "all") return null;
    if (effectiveWalletId === 0) return contextDefaultWallet || wallets[0] || null;
    return (
      wallets.find((w) => w.walletId === effectiveWalletId) ||
      contextDefaultWallet ||
      wallets[0] ||
      null
    );
  }, [wallets, effectiveWalletId, contextDefaultWallet]);

  // Đồng bộ selectedWalletId khi context load xong dữ liệu ví lần đầu
  useEffect(() => {
    if (selectedWalletId === 0 && defaultWalletId) {
      setSelectedWalletId(defaultWalletId);
    }
  }, [defaultWalletId, selectedWalletId]);

  const [selectedTab, setSelectedTab] = useState<TabType>("EXPENSE");
  const [searchQuery, setSearchQuery] = useState("");

  const { categories, loading, error, refetch } = useCategory({
    // Fetch nếu đã có walletId (hoặc đã xác định được ví hiệu lực)
    autoFetch: effectiveWalletId !== 0,
    walletId: effectiveWalletId !== "all" ? Number(effectiveWalletId) : 0,
  });

  // Khi quay lại từ EditCategoryScreen → refetch để lấy data mới nhất
  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      refetch();
    }, [refetch])
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
    const uniqueBaseList = Array.from(
      new Map(baseList.map((cat) => [cat.category_code, cat])).values()
    );

    let filtered = uniqueBaseList.filter((cat) => cat.category_group === selectedTab);

    if (searchQuery) {
      filtered = filtered.filter((cat) => {
        const name = parseCategoryName(cat.category_name);
        return (
          name.vi.toLowerCase().includes(searchQuery.toLowerCase()) ||
          name.en.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
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
          // Match by ID if both have it, otherwise match by code (if that's how the API works) or just skip
          if (parent.id !== undefined && cat.parent_category_id === parent.id) return true;
          return false;
        }),
      ];
    });

    return groups;
  }, [categories, selectedTab, searchQuery]);

  /* =====================
     Press handler
  ===================== */
  const handlePressCategory = (category: Category) => {
    if (category.id < 0) return;

    router.push({
      pathname: "/(protected)/edit-category",
      params: {
        category: encodeURIComponent(JSON.stringify(category)),
        allCategories: encodeURIComponent(JSON.stringify(categories)),
      },
    });
  };

  const handleWalletSelect = (walletId: WalletPickerId) => {
    setSelectedWalletId(walletId);
    setShowWalletModal(false);
  };

  /* =====================
     Render
  ===================== */
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader
        title={t("category.management_title") || "Quản lý danh mục"}
        showBackButton
      />

      <WalletPickerModal
        visible={showWalletModal}
        wallets={wallets}
        selectedId={selectedWalletId}
        onSelect={handleWalletSelect}
        showAllOption={false}
        onClose={() => setShowWalletModal(false)}
      />

      {/* TOP ACTIONS: CREATE NEW GROUP & WALLET SELECTOR */}
      <View style={styles.topActionsContainer}>
        <TouchableOpacity
          style={styles.createGroupButton}
          onPress={() => {
            router.push({
              pathname: "/(protected)/category/create-category",
              params: {
                type: selectedTab,
                walletId:
                  effectiveWalletId === "all" ? 0 : Number(effectiveWalletId),
              },
            });
          }}
        >
          <LinearGradient
            colors={colors.gradianBase}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: normalize(25) }]}
          />
          <CustomText style={styles.createGroupButtonText} type="semiBold">
            {t("category.create_new_category")}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.walletSelector,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => setShowWalletModal(true)}
        >
          <AppIcon
            name={(selectedWallet?.icon as any) ?? "wallet"}
            size={normalize(14)}
            color={selectedWallet?.color || colors.tint}
          />
          <CustomText style={styles.walletSelectorText} numberOfLines={1}>
            {selectedWallet?.name || t("wallet.select_wallet")}
          </CustomText>
          <AppIcon
            name="chevron-down"
            size={normalize(10)}
            color={colors.tint}
          />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        {(["INCOME", "EXPENSE", "LOAN"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              { backgroundColor: colors.card },
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            {selectedTab === tab && (
              <LinearGradient
                colors={colors.gradianBase}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: normalize(100) }]}
              />
            )}
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

      {/* SEARCH */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <AppIcon name="magnifying-glass" size={normalize(20)} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t("category.search_category_placeholder")}
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
                key={`group-${parent?.id}-${groupIndex}`}
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

                  <AppIcon
                    name="chevron-right"
                    size={normalize(18)}
                    color={colors.icon}
                  />
                </TouchableOpacity>

                {/* CHILDREN */}
                {children.length > 0 && (
                  <View style={styles.childrenWrapper}>
                    {children.map((child, childIndex) => {
                      const isLast = childIndex === children.length - 1;
                      return (
                        <TouchableOpacity
                          key={`child-${child?.id}-${childIndex}`}
                          style={styles.childItem}
                          onPress={() => handlePressCategory(child)}
                        >
                          {/* Per-item tree connector */}
                          <View style={styles.treeConnector}>
                            {/* Top half — always visible */}
                            <View
                              style={[
                                styles.treeLineTop,
                                { backgroundColor: colors.border },
                              ]}
                            />
                            {/* Bottom half — hidden for last child */}
                            {!isLast && (
                              <View
                                style={[
                                  styles.treeLineBottom,
                                  { backgroundColor: colors.border },
                                ]}
                              />
                            )}
                            {/* Horizontal branch */}
                            <View
                              style={[
                                styles.treeBranchLine,
                                { backgroundColor: colors.border },
                              ]}
                            />
                            {/* Dot */}
                            <View
                              style={[
                                styles.treeDot,
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

                          <AppIcon
                            name="chevron-right"
                            size={normalize(18)}
                            color={colors.icon}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, normalize(16)) + normalize(16) }]}
        onPress={() => {
          router.push({
            pathname: "/(protected)/category/create-category",
            params: {
              type: selectedTab,
              walletId:
                effectiveWalletId === "all" ? 0 : Number(effectiveWalletId),
            },
          });
        }}
      >
        <LinearGradient
          colors={colors.gradianBase}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: normalize(28) }]}
        />
        <AppIcon name="plus" size={normalize(32)} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CategoryManagementScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  walletSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(14),
    borderRadius: normalize(25),
    borderWidth: 1,
    gap: normalize(6),
    width: wp(46),
  },
  walletSelectorText: {
    flex: 1,
    fontSize: normalize(13),
  },
  fab: {
    position: "absolute",
    bottom: normalize(30),
    right: normalize(20),
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: wp(5),
    marginBottom: hp(1.5),
    gap: normalize(8),
  },
  tab: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(100),
    alignItems: "center",
    overflow: "hidden",
  },
  topActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: wp(5),
    marginTop: hp(1.5),
    marginBottom: hp(1.5),
    gap: normalize(10),
    alignItems: "center",
  },
  createGroupButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: normalize(14),
    borderRadius: normalize(25),
    gap: normalize(8),
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createGroupButtonText: {
    color: "#fff",
    fontSize: normalize(14),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: wp(5),
    marginBottom: hp(1.5),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
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
  childrenWrapper: {
    marginLeft: normalize(22),
  },
  childItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(10),
    paddingVertical: normalize(7),
  },
  treeConnector: {
    width: normalize(28),
    alignSelf: "stretch",
    position: "relative",
    marginVertical: -normalize(7), // cancel parent's paddingVertical so lines connect
  },
  treeLineTop: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: "50%",
    width: 1.5,
  },
  treeLineBottom: {
    position: "absolute",
    left: 0,
    top: "50%",
    bottom: 0,
    width: 1.5,
  },
  treeBranchLine: {
    position: "absolute",
    left: 0,
    top: "50%",
    width: normalize(18),
    height: 1.5,
  },
  treeDot: {
    width: normalize(5),
    height: normalize(5),
    borderRadius: normalize(3),
    position: "absolute",
    left: normalize(15),
    top: "50%",
    marginTop: -normalize(2.5),
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
});
