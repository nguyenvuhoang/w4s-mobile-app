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

// Mock Data
const MOCK_INVOICES = {
  active: [
    {
      id: "1",
      title: "Quản lý chung cư",
      description: "Hóa đơn tiếp theo là ngày",
      nextDate: "03/01/2026",
      amount: 200000,
      icon: "building",
      color: "#3B82F6",
      recurring: "Hàng tháng",
    },
  ],
  upcoming: [
    {
      id: "2",
      title: "Gửi xe chung cư",
      description: "Hóa đơn tiếp theo là ngày",
      nextDate: "03/02/2026",
      amount: 150000,
      icon: "car",
      color: "#F59E0B",
      recurring: "Hàng tháng",
    },
    {
      id: "3",
      title: "Quản lý chung cư",
      description: "Hóa đơn tiếp theo là ngày",
      nextDate: "03/02/2026",
      amount: 200000,
      icon: "building",
      color: "#3B82F6",
      recurring: "Hàng tháng",
    },
  ],
  summary: {
    remaining: 15161000,
    thisMonth: -200000,
  },
};

type TabType = "active" | "completed";

const InvoiceListScreen = () => {
  const { colors } = useAppTheme();
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.abs(amount));
  }, []);

  const handleInvoicePress = useCallback((invoiceId: string) => {
    console.log("Navigate to invoice detail:", invoiceId);
    // router.push(`/(protected)/invoice/${invoiceId}`);
  }, []);

  const handleCreateInvoice = useCallback(() => {
    router.push("/(protected)/invoice/create-invoice");
  }, []);

  const renderInvoiceCard = useCallback(
    (invoice: any) => (
      <TouchableOpacity
        key={invoice.id}
        style={styles.invoiceCard}
        onPress={() => handleInvoicePress(invoice.id)}
        activeOpacity={0.7}
      >
        <View style={styles.invoiceLeft}>
          <View
            style={[styles.invoiceIcon, { backgroundColor: invoice.color }]}
          >
            <FontAwesome6
              name={invoice.icon}
              size={normalize(20)}
              color="#fff"
              solid
            />
          </View>
          <View style={styles.invoiceInfo}>
            <CustomText style={styles.invoiceTitle}>{invoice.title}</CustomText>
            <CustomText style={styles.invoiceDescription}>
              {invoice.description}
            </CustomText>
            <CustomText style={styles.invoiceDate}>
              {invoice.nextDate}
            </CustomText>
          </View>
        </View>
        <View style={styles.invoiceRight}>
          <View style={styles.amountBadge}>
            <CustomText style={styles.amountText}>
              Trả {formatCurrency(invoice.amount)} đ
            </CustomText>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [styles, formatCurrency, handleInvoicePress],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader
        title="Hóa đơn"
        rightComponent={
          <TouchableOpacity>
            <FontAwesome6
              name="ellipsis-vertical"
              size={normalize(20)}
              color={colors.text}
            />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.tabActive]}
          onPress={() => setActiveTab("active")}
        >
          <CustomText
            style={[
              styles.tabText,
              activeTab === "active" && styles.tabTextActive,
            ]}
          >
            Đang áp dụng
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.tabActive]}
          onPress={() => setActiveTab("completed")}
        >
          <CustomText
            style={[
              styles.tabText,
              activeTab === "completed" && styles.tabTextActive,
            ]}
          >
            Đã kết thúc
          </CustomText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "active" && (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <CustomText style={styles.summaryLabel}>
                  Các hóa đơn còn lại
                </CustomText>
                <CustomText style={styles.summaryAmount}>
                  {formatCurrency(MOCK_INVOICES.summary.remaining)} đ
                </CustomText>
              </View>
              <View style={[styles.summaryRow, { marginTop: hp(1) }]}>
                <CustomText style={styles.summaryLabel}>Kỳ này</CustomText>
                <CustomText
                  style={[styles.summaryAmount, styles.negativeAmount]}
                >
                  {MOCK_INVOICES.summary.thisMonth.toLocaleString("vi-VN")} đ
                </CustomText>
              </View>
            </View>

            {/* Current Period */}
            {MOCK_INVOICES.active.length > 0 && (
              <View style={styles.section}>
                <CustomText style={styles.sectionTitle}>Kỳ này</CustomText>
                {MOCK_INVOICES.active.map(renderInvoiceCard)}
              </View>
            )}

            {/* Upcoming Period */}
            {MOCK_INVOICES.upcoming.length > 0 && (
              <View style={styles.section}>
                <CustomText style={styles.sectionTitle}>
                  Kỳ tiếp theo
                </CustomText>
                {MOCK_INVOICES.upcoming.map(renderInvoiceCard)}
              </View>
            )}
          </>
        )}

        {activeTab === "completed" && (
          <View style={styles.emptyContainer}>
            <FontAwesome6
              name="file-invoice"
              size={normalize(64)}
              color={colors.icon}
              style={{ opacity: 0.3 }}
            />
            <CustomText style={styles.emptyText}>
              Chưa có hóa đơn đã kết thúc
            </CustomText>
          </View>
        )}

        <View style={{ height: hp(12) }} />
      </ScrollView>

      {/* Create Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateInvoice}
          activeOpacity={0.8}
        >
          <CustomText style={styles.createButtonText}>Tạo hóa đơn</CustomText>
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
    tabContainer: {
      flexDirection: "row",
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      gap: wp(3),
      backgroundColor: colors.background,
    },
    tab: {
      flex: 1,
      paddingVertical: hp(1.2),
      borderRadius: normalize(12),
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    tabActive: {
      backgroundColor: colors.tint,
    },
    tabText: {
      fontSize: normalize(15),
      color: colors.text,
      fontFamily: Fonts.regular,
    },
    tabTextActive: {
      color: "#fff",
      fontFamily: Fonts.semiBold,
    },
    content: {
      flex: 1,
    },
    summaryCard: {
      marginHorizontal: wp(4),
      marginTop: hp(2),
      backgroundColor: colors.card,
      borderRadius: normalize(16),
      padding: normalize(16),
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    summaryLabel: {
      fontSize: normalize(14),
      color: colors.text,
      fontFamily: Fonts.regular,
    },
    summaryAmount: {
      fontSize: normalize(16),
      color: colors.text,
      fontFamily: Fonts.semiBold,
    },
    negativeAmount: {
      color: "#EF4444",
    },
    section: {
      marginTop: hp(2.5),
      paddingHorizontal: wp(4),
    },
    sectionTitle: {
      fontSize: normalize(16),
      color: colors.text,
      fontFamily: Fonts.semiBold,
      marginBottom: hp(1.5),
    },
    invoiceCard: {
      backgroundColor: colors.card,
      borderRadius: normalize(16),
      padding: normalize(16),
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: hp(1.5),
      borderWidth: 1,
      borderColor: colors.border,
    },
    invoiceLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    invoiceIcon: {
      width: normalize(48),
      height: normalize(48),
      borderRadius: normalize(12),
      alignItems: "center",
      justifyContent: "center",
    },
    invoiceInfo: {
      marginLeft: wp(3),
      flex: 1,
    },
    invoiceTitle: {
      fontSize: normalize(15),
      color: colors.text,
      fontFamily: Fonts.semiBold,
      marginBottom: hp(0.3),
    },
    invoiceDescription: {
      fontSize: normalize(12),
      color: colors.icon,
      fontFamily: Fonts.regular,
    },
    invoiceDate: {
      fontSize: normalize(12),
      color: colors.icon,
      fontFamily: Fonts.regular,
      marginTop: hp(0.2),
    },
    invoiceRight: {
      alignItems: "flex-end",
    },
    amountBadge: {
      backgroundColor: "#EF4444",
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.7),
      borderRadius: normalize(8),
    },
    amountText: {
      fontSize: normalize(13),
      color: "#fff",
      fontFamily: Fonts.semiBold,
    },
    bottomContainer: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    createButton: {
      backgroundColor: colors.tint,
      paddingVertical: hp(1.8),
      borderRadius: normalize(16),
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.tint,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    createButtonText: {
      fontSize: normalize(16),
      color: "#fff",
      fontFamily: Fonts.semiBold,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: hp(15),
    },
    emptyText: {
      fontSize: normalize(15),
      color: colors.icon,
      fontFamily: Fonts.regular,
      marginTop: hp(2),
    },
  });

export default InvoiceListScreen;
