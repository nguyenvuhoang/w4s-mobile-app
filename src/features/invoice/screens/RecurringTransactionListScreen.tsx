import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import BottomActionModal, {
  ActionItem,
} from "@/components/modals/BottomActionModal";
import StorageKey from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { Fonts } from "@/core/theme/font";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useCategory } from "@/hooks/useCategory";
import { invoiceRepository } from "@/services/repositories/invoice.repository";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ---- API response types ----
interface RecurringInfo {
  type: string;       // "Monthly" | "Weekly" | "Daily" | "Yearly"
  count: number;
  is_forever: boolean;
  selected_days: number[] | null; // 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
}

export interface BillItem {
  bill_id: number;
  user_code: string;
  wallet_id: number;
  bill_name: string;
  category_id: number;
  business_type: string; // "1" = income, "2" = expense
  recurring: RecurringInfo;
  amount: number;
  currency_code: string;
  due_at_utc: string;
  status: string;
}

// ---- Helpers ----
const RECURRING_TYPE_LABELS: Record<string, string> = {
  Monthly: "Hàng tháng",
  Weekly: "Hàng tuần",
  Daily: "Hàng ngày",
  Yearly: "Hàng năm",
};

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatDueDate(utcStr: string): string {
  try {
    const d = new Date(utcStr);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return utcStr;
  }
}

/** Main recurring label e.g. "Hàng tuần · 12 lần" or "Hàng tháng" */
function getRecurringLabel(recurring: RecurringInfo): string {
  const base = RECURRING_TYPE_LABELS[recurring.type] ?? recurring.type;
  if (recurring.is_forever) return base;
  return `${base} · ${recurring.count} lần`;
}

/** Returns day abbreviation array for weekly bills, e.g. ["T2","T4","T5","T6"] */
function getWeeklyDays(recurring: RecurringInfo): string[] {
  if (
    recurring.type !== "Weekly" ||
    !recurring.selected_days ||
    recurring.selected_days.length === 0
  ) return [];
  return recurring.selected_days
    .map((d) => DAY_LABELS[Number(d)] ?? String(d))
    .sort();
}

/** Parses multi-language category name JSON e.g. {"vi": "...", "en": "..."} */
function parseCategoryName(nameStr: string): string {
  if (!nameStr) return "";
  if (!nameStr.startsWith("{")) return nameStr; // Not JSON
  try {
    const parsed = JSON.parse(nameStr);
    return parsed.vi || parsed.en || nameStr;
  } catch {
    return nameStr;
  }
}

const DEFAULT_ICON = "receipt";
const DEFAULT_COLOR = "#6B7280";

const RecurringTransactionListScreen = () => {
  const { colors } = useAppTheme();
  const { showNotification, showNotificationAPI } = useNotification();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // Load category cache (uses session cache, no extra network cost if already fetched)
  const { categories } = useCategory({ autoFetch: true });

  // Build a fast lookup map: category id → { icon, color, name }
  // Normalize key to Number — API may return ids as strings
  const categoryMap = useMemo(() => {
    const map = new Map<number, { icon: string; color: string; name: string }>();
    categories.forEach((cat) => {
      map.set(Number(cat.id), {
        icon: cat.icon ?? DEFAULT_ICON,
        color: cat.color ?? DEFAULT_COLOR,
        name: parseCategoryName(cat.category_name ?? ""),
      });
    });
    return map;
  }, [categories]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.abs(amount));
  }, []);

  // ---- Fetch data ----
  const fetchBills = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
      const res = await invoiceRepository.advancedSearchInvoice({
        user_code: userCode,
        wallet_id: 0,
        business_type: null,
        schedule_type: null,
        status: null,
        from_due_at_utc: null,
        to_due_at_utc: null,
        page_index: 0,
        page_size: 20,
      });

      if (res?.success && res?.data?.items) {
        const items = res.data.items as BillItem[];
        // 🔍 Debug: check category_id in API response
        if (items.length > 0) {
          console.log("[DEBUG] First bill category_id:", items[0].category_id, "type:", typeof items[0].category_id);
          console.log("[DEBUG] bills sample:", JSON.stringify(items[0], null, 2));
        }
        setBills(items);
      }
    } catch (error) {
      console.error("[RecurringTransactionListScreen] fetchBills error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-fetch whenever this screen comes into focus (handles post-edit/delete refresh)
  useFocusEffect(
    useCallback(() => {
      fetchBills();
    }, [fetchBills]),
  );

  const onRefresh = useCallback(() => {
    fetchBills(true);
  }, [fetchBills]);

  // ---- Handlers ----
  const handleBillPress = useCallback((bill: BillItem) => {
    setSelectedBill(bill);
    setShowActionModal(true);
  }, []);

  const handleEditBill = useCallback(() => {
    setShowActionModal(false);
    if (!selectedBill) return;
    setTimeout(() => {
      router.push({
        pathname: "/(protected)/invoice/edit-invoice",
        params: {
          mode: "edit",
          id: selectedBill.bill_id.toString(),
        },
      });
    }, 300);
  }, [selectedBill]);

  const handleViewHistory = useCallback(() => {
    setShowActionModal(false);
    if (!selectedBill) return;
    setTimeout(() => {
      router.push({
        pathname: "/(protected)/invoice/transaction-history",
        params: {
          billId: selectedBill.bill_id.toString(),
        },
      });
    }, 300);
  }, [selectedBill]);

  const handleDeleteBill = useCallback(() => {
    if (!selectedBill) return;
    setShowActionModal(false);
    setTimeout(() => {
      showNotification(
        `Bạn có chắc muốn xóa "${selectedBill.bill_name}"?`,
        "warning",
        undefined,
        undefined,
        async () => {
          try {
            await invoiceRepository.deleteInvoice(selectedBill.bill_id);
            setBills((prev) =>
              prev.filter((b) => b.bill_id !== selectedBill.bill_id),
            );
          } catch (err) {
            console.error("[RecurringTransactionListScreen] delete error:", err);
            showNotification("Có lỗi xảy ra khi xóa hóa đơn", "error");
          }
          setSelectedBill(null);
        }
      );
    }, 300);
  }, [selectedBill, showNotification]);

  const billActions: ActionItem[] = useMemo(
    () => [
      {
        id: "history",
        icon: "receipt-outline",
        label: "Lịch sử giao dịch",
        onPress: handleViewHistory,
      },
      {
        id: "edit",
        icon: "create-outline",
        label: "Chỉnh sửa",
        onPress: handleEditBill,
      },
      {
        id: "delete",
        icon: "trash-outline",
        label: "Xóa giao dịch",
        onPress: handleDeleteBill,
        destructive: true,
      },
    ],
    [handleEditBill, handleDeleteBill, handleViewHistory],
  );

  const handleCreateRecurringTransaction = useCallback(() => {
    router.push("/(protected)/invoice/create-invoice");
  }, []);

  // ---- Render card ----
  const renderBillCard = useCallback(
    (bill: BillItem) => {
      // Normalize to Number in case API returns category_id as string
      const cat = categoryMap.get(Number(bill.category_id));
      const iconName = cat?.icon ?? DEFAULT_ICON;
      const iconColor = cat?.color ?? DEFAULT_COLOR;
      // Use parsed category name, fallback to parsed bill_name
      const categoryName = cat?.name || parseCategoryName(bill.bill_name);
      const amountColor = "#EF4444"; // Always expense color
      const amountPrefix = "-";      // Always negative prefix
      const recurringLabel = getRecurringLabel(bill.recurring);
      const weeklyDays = getWeeklyDays(bill.recurring);
      const dueDate = formatDueDate(bill.due_at_utc);

      return (
        <TouchableOpacity
          key={bill.bill_id}
          style={styles.card}
          onPress={() => handleBillPress(bill)}
          activeOpacity={0.72}
        >
          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: iconColor }]} />

          {/* Icon */}
          <View style={[styles.iconWrapper, { backgroundColor: iconColor + "22" }]}>
            <FontAwesome6 name={iconName} size={normalize(22)} color={iconColor} solid />
          </View>

          {/* Info */}
          <View style={styles.infoBlock}>
            {/* Category name is now the main title */}
            <CustomText style={styles.billName} numberOfLines={1}>
              {categoryName}
            </CustomText>

            {/* Recurring chip */}
            <View style={[styles.recurringChip, { backgroundColor: iconColor + "18" }]}>
              <FontAwesome6 name="repeat" size={normalize(9)} color={iconColor} />
              <CustomText style={[styles.recurringLabel, { color: iconColor }]}>
                {recurringLabel}
              </CustomText>
            </View>

            {/* Weekly day pills */}
            {weeklyDays.length > 0 && (
              <View style={styles.dayPillRow}>
                {weeklyDays.map((day) => (
                  <View
                    key={day}
                    style={[styles.dayPill, { backgroundColor: iconColor + "25", borderColor: iconColor + "60" }]}
                  >
                    <CustomText style={[styles.dayPillText, { color: iconColor }]}>
                      {day}
                    </CustomText>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right: amount + due date */}
          <View style={styles.rightBlock}>
            <View style={styles.amountRow}>
              <CustomText style={[styles.amountText, { color: amountColor }]}>
                {amountPrefix}{formatCurrency(bill.amount)}
              </CustomText>
              <View style={[styles.currencyBadge, { backgroundColor: amountColor + "18" }]}>
                <CustomText style={[styles.currencyCode, { color: amountColor }]}>
                  {bill.currency_code}
                </CustomText>
              </View>
            </View>
            <View style={styles.dueDateRow}>
              <FontAwesome6 name="calendar" size={normalize(9)} color={colors.icon} />
              <CustomText style={styles.dueDateText}>{dueDate}</CustomText>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [styles, formatCurrency, categoryMap, handleBillPress, colors.icon],
  );

  const selectedCat = selectedBill ? categoryMap.get(selectedBill.category_id) : null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader title="Giao dịch định kỳ" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {bills.length > 0 ? (
            <View style={styles.listContainer}>
              {bills.map(renderBillCard)}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome6
                name="repeat"
                size={normalize(64)}
                color={colors.icon}
                style={{ opacity: 0.3 }}
              />
              <CustomText style={styles.emptyText}>
                Chưa có giao dịch định kỳ nào
              </CustomText>
            </View>
          )}
          <View style={{ height: hp(12) }} />
        </ScrollView>
      )}

      {/* Create Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateRecurringTransaction}
          activeOpacity={0.8}
        >
          <FontAwesome6 name="plus" size={normalize(15)} color="#fff" />
          <CustomText style={styles.createButtonText}>Tạo giao dịch định kỳ</CustomText>
        </TouchableOpacity>
      </View>

      {/* Action Modal */}
      <BottomActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={selectedBill?.bill_name}
        subtitle={
          selectedBill
            ? `${selectedCat?.name ? selectedCat.name + " · " : ""}${getRecurringLabel(selectedBill.recurring)} · Hạn: ${formatDueDate(selectedBill.due_at_utc)}`
            : ""
        }
        actions={billActions}
        colors={colors}
        cancelText="Hủy"
      />
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
    contentContainer: {
      flexGrow: 1,
    },
    listContainer: {
      paddingHorizontal: wp(4),
      paddingTop: hp(2),
      gap: hp(1.5),
    },
    // ---- Card ----
    card: {
      backgroundColor: colors.card,
      borderRadius: normalize(16),
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    accentBar: {
      width: normalize(4),
      alignSelf: "stretch",
    },
    iconWrapper: {
      width: normalize(46),
      height: normalize(46),
      borderRadius: normalize(12),
      alignItems: "center",
      justifyContent: "center",
      marginLeft: wp(3),
      marginVertical: normalize(14),
    },
    infoBlock: {
      flex: 1,
      marginLeft: wp(3),
      paddingVertical: normalize(14),
      gap: hp(0.4),
    },
    billName: {
      fontSize: normalize(14),
      color: colors.text,
      fontFamily: Fonts.semiBold,
    },
    recurringChip: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: normalize(20),
      gap: wp(1),
      marginTop: hp(0.3),
    },
    recurringLabel: {
      fontSize: normalize(10),
      fontFamily: Fonts.semiBold,
    },
    dayPillRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: wp(1),
      marginTop: hp(0.4),
    },
    dayPill: {
      paddingHorizontal: wp(1.5),
      paddingVertical: hp(0.15),
      borderRadius: normalize(4),
      borderWidth: 1,
    },
    dayPillText: {
      fontSize: normalize(9),
      fontFamily: Fonts.semiBold,
    },
    // ---- Right block ----
    rightBlock: {
      alignItems: "flex-end",
      paddingRight: wp(4),
      paddingVertical: normalize(14),
      gap: hp(0.3),
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(1.5),
    },
    amountText: {
      fontSize: normalize(15),
      fontFamily: Fonts.bold,
    },
    currencyBadge: {
      paddingHorizontal: wp(1.5),
      paddingVertical: hp(0.2),
      borderRadius: normalize(4),
    },
    currencyCode: {
      fontSize: normalize(10),
      fontFamily: Fonts.semiBold,
    },
    dueDateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(1),
      marginTop: hp(0.3),
    },
    dueDateText: {
      fontSize: normalize(10),
      color: colors.icon,
      fontFamily: Fonts.regular,
    },
    // ---- Bottom ----
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
      flexDirection: "row",
      gap: wp(2),
      shadowColor: colors.tint,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    createButtonText: {
      fontSize: normalize(16),
      color: "#fff",
      fontFamily: Fonts.semiBold,
    },
    // ---- States ----
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
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

export default RecurringTransactionListScreen;
