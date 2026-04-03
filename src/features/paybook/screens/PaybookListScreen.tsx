import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  Paybook,
  PaybookFilterType,
  PaybookStatus,
  PaybookSummary,
} from "../types";

// Mock Data với originalAmount và paidAmount
const MOCK_PAYBOOKS: Paybook[] = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    note: "Tiền ăn tối cuối tuần",
    originalAmount: 500000,
    paidAmount: 200000,
    type: "receivable",
    status: "pending",
    dueDate: "15/02/2026",
    createdAt: "01/01/2026",
  },
  {
    id: "2",
    name: "Cửa hàng điện tử B",
    note: "Mua laptop trả góp",
    originalAmount: 12000000,
    paidAmount: 4000000,
    type: "payable",
    status: "pending",
    dueDate: "01/03/2026",
    createdAt: "15/12/2025",
  },
  {
    id: "3",
    name: "Trần Thị C",
    note: "Cho mượn tiền mua xe",
    originalAmount: 5000000,
    paidAmount: 0,
    type: "receivable",
    status: "overdue",
    dueDate: "10/01/2026",
    createdAt: "10/11/2025",
  },
  {
    id: "4",
    name: "Lê Văn D",
    note: "Tiền cafe",
    originalAmount: 150000,
    paidAmount: 150000,
    type: "receivable",
    status: "paid",
    dueDate: "20/01/2026",
    createdAt: "18/01/2026",
  },
  {
    id: "5",
    name: "Công ty TNHH E",
    note: "Phí dịch vụ tháng 1",
    originalAmount: 2300000,
    paidAmount: 2300000,
    type: "payable",
    status: "paid",
    dueDate: "31/01/2026",
    createdAt: "01/01/2026",
  },
  {
    id: "6",
    name: "Phạm Văn F",
    note: "Tiền đám cưới",
    originalAmount: 1000000,
    paidAmount: 500000,
    type: "receivable",
    status: "pending",
    dueDate: "28/02/2026",
    createdAt: "20/01/2026",
  },
];

const MOCK_SUMMARY: PaybookSummary = {
  totalReceivable: 6650000,
  totalPayable: 14300000,
};

const STATUS_CONFIG: Record<
  PaybookStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  pending: {
    label: "Chưa trả",
    color: "#B45309",
    bgColor: "#FEF3C7",
    icon: "clock",
  },
  paid: {
    label: "Đã trả",
    color: "#15803D",
    bgColor: "#DCFCE7",
    icon: "check",
  },
  overdue: {
    label: "Quá hạn",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    icon: "triangle-exclamation",
  },
};

const PaybookListScreen = () => {
  const { colors } = useAppTheme();
  const [activeFilter, setActiveFilter] = useState<PaybookFilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const filteredPaybooks = useMemo(() => {
    if (activeFilter === "all") return MOCK_PAYBOOKS;
    return MOCK_PAYBOOKS.filter((p) => p.type === activeFilter);
  }, [activeFilter]);

  // Tính số giao dịch cho mỗi loại filter
  const transactionCounts = useMemo(() => {
    const receivableCount = MOCK_PAYBOOKS.filter((p) => p.type === "receivable").length;
    const payableCount = MOCK_PAYBOOKS.filter((p) => p.type === "payable").length;
    return {
      all: MOCK_PAYBOOKS.length,
      receivable: receivableCount,
      payable: payableCount,
    };
  }, []);

  // Tính chênh lệch
  const balance = useMemo(() => {
    return MOCK_SUMMARY.totalReceivable - MOCK_SUMMARY.totalPayable;
  }, []);

  // Filter tabs với số giao dịch
  const FILTER_TABS: { key: PaybookFilterType; label: string; icon: string }[] = [
    { key: "all", label: "Tất cả", icon: "list" },
    { key: "receivable", label: "Phải thu", icon: "arrow-trend-up" },
    { key: "payable", label: "Phải trả", icon: "arrow-trend-down" },
  ];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.abs(amount));
  }, []);

  const handlePaybookPress = useCallback((paybookId: string) => {
    router.push(`/(protected)/paybook/${paybookId}`);
  }, []);

  const handleCreatePaybook = useCallback(() => {
    router.push("/(protected)/paybook/create");
  }, []);

  const renderPaybookCard = useCallback(
    (paybook: Paybook, index: number) => {
      const isReceivable = paybook.type === "receivable";
      const amountColor = isReceivable ? "#22C55E" : "#EF4444";
      const amountPrefix = isReceivable ? "+" : "-";
      const statusConfig = STATUS_CONFIG[paybook.status];
      const currentAmount = paybook.originalAmount - paybook.paidAmount;

      return (
        <TouchableOpacity
          key={paybook.id}
          style={[styles.payBookCard, index === 0 && { marginTop: 0 }]}
          onPress={() => handlePaybookPress(paybook.id)}
          activeOpacity={0.7}
        >
          {/* Left side with avatar and info */}
          <View style={styles.cardLeft}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: isReceivable ? "#E8F5E9" : "#FFEBEE" },
              ]}
            >
              <FontAwesome6
                name="user"
                size={normalize(18)}
                color={isReceivable ? "#22C55E" : "#EF4444"}
                solid
              />
            </View>
            <View style={styles.cardInfo}>
              <CustomText style={styles.cardName} numberOfLines={1}>
                {paybook.name}
              </CustomText>
              {paybook.note && (
                <CustomText style={styles.cardNote} numberOfLines={1}>
                  {paybook.note}
                </CustomText>
              )}
              <View style={styles.dueDateContainer}>
                <FontAwesome6
                  name="calendar"
                  size={normalize(10)}
                  color={colors.icon}
                  style={{ marginRight: wp(1) }}
                />
                <CustomText style={styles.dueDateText}>
                  {paybook.dueDate}
                </CustomText>
              </View>
            </View>
          </View>

          {/* Right side with amounts and status */}
          <View style={styles.cardRight}>
            {/* Số nợ hiện tại (còn lại) */}
            <CustomText style={[styles.currentAmountText, { color: amountColor }]}>
              {amountPrefix}
              {formatCurrency(currentAmount)} đ
            </CustomText>
            {/* Số nợ ban đầu */}
            <CustomText style={styles.originalAmountText}>
              Gốc: {formatCurrency(paybook.originalAmount)} đ
            </CustomText>
            {/* Status badge */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bgColor },
              ]}
            >
              <FontAwesome6
                name={statusConfig.icon}
                size={normalize(9)}
                color={statusConfig.color}
                style={{ marginRight: wp(1) }}
              />
              <CustomText
                style={[styles.statusText, { color: statusConfig.color }]}
              >
                {statusConfig.label}
              </CustomText>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [styles, formatCurrency, handlePaybookPress, colors],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader title="Sổ nợ" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryIconWrapper}>
              <FontAwesome6
                name="arrow-trend-up"
                size={normalize(16)}
                color="#22C55E"
              />
            </View>
            <View style={styles.summaryTextContainer}>
              <CustomText style={styles.summaryLabel}>Phải thu</CustomText>
              <CustomText style={[styles.summaryAmount, styles.receivableColor]}>
                +{formatCurrency(MOCK_SUMMARY.totalReceivable)} đ
              </CustomText>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <View style={[styles.summaryIconWrapper, styles.payableIconWrapper]}>
              <FontAwesome6
                name="arrow-trend-down"
                size={normalize(16)}
                color="#EF4444"
              />
            </View>
            <View style={styles.summaryTextContainer}>
              <CustomText style={styles.summaryLabel}>Phải trả</CustomText>
              <CustomText style={[styles.summaryAmount, styles.payableColor]}>
                -{formatCurrency(MOCK_SUMMARY.totalPayable)} đ
              </CustomText>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <CustomText style={styles.filterSectionTitle}>Danh sách</CustomText>
          <View style={styles.filterContainer}>
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterTab, isActive && styles.filterTabActive]}
                  onPress={() => setActiveFilter(tab.key)}
                  activeOpacity={0.7}
                >
                  <CustomText
                    style={[
                      styles.filterTabText,
                      isActive && styles.filterTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </CustomText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {filteredPaybooks.length > 0 ? (
            filteredPaybooks.map((paybook, index) =>
              renderPaybookCard(paybook, index)
            )
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <FontAwesome6
                  name="book-open"
                  size={normalize(40)}
                  color={colors.tint}
                  style={{ opacity: 0.6 }}
                />
              </View>
              <CustomText style={styles.emptyTitle}>
                Chưa có sổ nợ nào
              </CustomText>
              <CustomText style={styles.emptySubtitle}>
                Nhấn nút bên dưới để tạo sổ nợ mới
              </CustomText>
            </View>
          )}
        </View>

        <View style={{ height: hp(12) }} />
      </ScrollView>

      {/* Create Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={handleCreatePaybook}
          activeOpacity={0.8}
          style={styles.createButton}
        >
          <FontAwesome6
            name="plus"
            size={normalize(16)}
            color="#fff"
            style={{ marginRight: wp(2) }}
          />
          <CustomText style={styles.createButtonText}>Thêm sổ nợ mới</CustomText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },

    // Summary Card Styles
    summaryCard: {
      marginHorizontal: wp(4),
      marginTop: hp(2),
      backgroundColor: colors.card,
      borderRadius: normalize(16),
      padding: normalize(16),
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    summaryIconWrapper: {
      width: normalize(40),
      height: normalize(40),
      borderRadius: normalize(12),
      backgroundColor: "#E8F5E9",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hp(1),
    },
    payableIconWrapper: {
      backgroundColor: "#FFEBEE",
    },
    summaryTextContainer: {
      alignItems: "center",
    },
    summaryDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginHorizontal: wp(2),
    },
    summaryLabel: {
      fontSize: normalize(12),
      color: colors.icon,
      fontFamily: Fonts.regular,
      marginBottom: hp(0.3),
      textAlign: "center",
    },
    summaryAmount: {
      fontSize: normalize(15),
      fontFamily: Fonts.bold,
    },
    receivableColor: {
      color: "#22C55E",
    },
    payableColor: {
      color: "#EF4444",
    },

    // Filter Section
    filterSection: {
      paddingHorizontal: wp(4),
      paddingTop: hp(2.5),
    },
    filterSectionTitle: {
      fontSize: normalize(16),
      fontFamily: Fonts.semiBold,
      color: colors.text,
      marginBottom: hp(1.5),
    },
    filterContainer: {
      flexDirection: "row",
      gap: wp(2),
    },
    filterTab: {
      flex: 1,
      paddingVertical: hp(1.2),
      borderRadius: normalize(12),
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterTabActive: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
    },
    filterTabText: {
      fontSize: normalize(14),
      color: colors.text,
      fontFamily: Fonts.medium,
    },
    filterTabTextActive: {
      color: "#FFFFFF",
      fontFamily: Fonts.semiBold,
    },

    // List Container
    listContainer: {
      paddingHorizontal: wp(4),
      paddingTop: hp(2),
    },

    // Paybook Card Styles
    payBookCard: {
      backgroundColor: colors.card,
      borderRadius: normalize(16),
      padding: normalize(16),
      flexDirection: "row",
      alignItems: "center",
      marginTop: hp(1.5),
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    avatar: {
      width: normalize(44),
      height: normalize(44),
      borderRadius: normalize(22),
      alignItems: "center",
      justifyContent: "center",
    },
    cardInfo: {
      marginLeft: wp(3),
      flex: 1,
    },
    cardName: {
      fontSize: normalize(15),
      color: colors.text,
      fontFamily: Fonts.semiBold,
      marginBottom: hp(0.2),
    },
    cardNote: {
      fontSize: normalize(12),
      color: colors.icon,
      fontFamily: Fonts.regular,
      marginBottom: hp(0.5),
    },
    dueDateContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    dueDateText: {
      fontSize: normalize(11),
      color: colors.icon,
      fontFamily: Fonts.regular,
    },
    cardRight: {
      alignItems: "flex-end",
      marginLeft: wp(2),
    },
    currentAmountText: {
      fontSize: normalize(15),
      fontFamily: Fonts.bold,
      marginBottom: hp(0.2),
    },
    originalAmountText: {
      fontSize: normalize(11),
      color: colors.icon,
      fontFamily: Fonts.regular,
      marginBottom: hp(0.5),
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.4),
      borderRadius: normalize(8),
    },
    statusText: {
      fontSize: normalize(10),
      fontFamily: Fonts.semiBold,
    },

    // Bottom Container & Create Button
    bottomContainer: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      paddingBottom: hp(3),
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    createButton: {
      backgroundColor: colors.tint,
      paddingVertical: hp(1.8),
      borderRadius: normalize(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.tint,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    createButtonText: {
      fontSize: normalize(16),
      color: "#FFFFFF",
      fontFamily: Fonts.semiBold,
    },

    // Empty State
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: hp(8),
    },
    emptyIconBg: {
      width: normalize(100),
      height: normalize(100),
      borderRadius: normalize(30),
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hp(2),
    },
    emptyTitle: {
      fontSize: normalize(18),
      color: colors.text,
      fontFamily: Fonts.semiBold,
      marginBottom: hp(0.5),
    },
    emptySubtitle: {
      fontSize: normalize(14),
      color: colors.icon,
      fontFamily: Fonts.regular,
      textAlign: "center",
    },
  });

export default PaybookListScreen;
