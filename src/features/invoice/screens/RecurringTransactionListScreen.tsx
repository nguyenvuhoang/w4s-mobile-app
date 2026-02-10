import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import BottomActionModal, {
  ActionItem,
} from "@/components/modals/BottomActionModal";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Type for recurring transaction
export interface RecurringTransaction {
  id: string;
  title: string;
  nextDate: string;
  amount: number;
  icon: string;
  color: string;
  type: "expense" | "income";
  recurring?: string;
  note?: string;
  walletId?: number;
  categoryId?: string;
}

// Mock Data - Recurring Transactions
const INITIAL_MOCK_RECURRING_TRANSACTIONS: RecurringTransaction[] = [
  {
    id: "1",
    title: "Gửi Xe",
    nextDate: "03/02/2026",
    amount: -150000,
    icon: "motorcycle",
    color: "#3B82F6", // Blue
    type: "expense",
    recurring: "monthly",
  },
  {
    id: "2",
    title: "Starbucks",
    nextDate: "05/02/2026",
    amount: -95000,
    icon: "mug-hot",
    color: "#10B981", // Green
    type: "expense",
    recurring: "monthly",
  },
  {
    id: "3",
    title: "Lãi suất tiết kiệm",
    nextDate: "01/03/2026",
    amount: 2500000,
    icon: "piggy-bank",
    color: "#8B5CF6", // Purple
    type: "income",
    recurring: "monthly",
  },
  {
    id: "4",
    title: "Netflix",
    nextDate: "15/02/2026",
    amount: -180000,
    icon: "tv",
    color: "#EF4444", // Red
    type: "expense",
    recurring: "monthly",
  },
  {
    id: "5",
    title: "Spotify",
    nextDate: "20/02/2026",
    amount: -59000,
    icon: "music",
    color: "#22C55E", // Green
    type: "expense",
    recurring: "monthly",
  },
  {
    id: "6",
    title: "Lương tháng",
    nextDate: "01/02/2026",
    amount: 25000000,
    icon: "wallet",
    color: "#F59E0B", // Amber
    type: "income",
    recurring: "monthly",
  },
  {
    id: "7",
    title: "Điện thoại",
    nextDate: "10/02/2026",
    amount: -150000,
    icon: "mobile-screen",
    color: "#06B6D4", // Cyan
    type: "expense",
    recurring: "monthly",
  },
  {
    id: "8",
    title: "Internet",
    nextDate: "12/02/2026",
    amount: -220000,
    icon: "wifi",
    color: "#EC4899", // Pink
    type: "expense",
    recurring: "monthly",
  },
];

const RecurringTransactionListScreen = () => {
  const { colors } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<RecurringTransaction[]>(
    INITIAL_MOCK_RECURRING_TRANSACTIONS,
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<RecurringTransaction | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

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

  // Open action modal when pressing a transaction card
  const handleTransactionPress = useCallback(
    (transaction: RecurringTransaction) => {
      setSelectedTransaction(transaction);
      setShowActionModal(true);
    },
    [],
  );

  // Edit handler - navigate to edit screen with transaction data
  const handleEditTransaction = useCallback(() => {
    setShowActionModal(false);
    if (!selectedTransaction) return;

    setTimeout(() => {
      router.push({
        pathname: "/(protected)/invoice/edit-invoice",
        params: {
          mode: "edit",
          id: selectedTransaction.id,
          editTitle: selectedTransaction.title,
          amount: Math.abs(selectedTransaction.amount).toString(),
          icon: selectedTransaction.icon,
          color: selectedTransaction.color,
          type: selectedTransaction.type,
          nextDate: selectedTransaction.nextDate,
          recurring: selectedTransaction.recurring || "monthly",
          note: selectedTransaction.note || "",
        },
      });
    }, 300);
  }, [selectedTransaction]);

  // Delete handler - show confirmation alert
  const handleDeleteTransaction = useCallback(() => {
    if (!selectedTransaction) return;
    setShowActionModal(false);

    setTimeout(() => {
      Alert.alert(
        "Xác nhận xóa",
        `Bạn có chắc muốn xóa giao dịch định kỳ "${selectedTransaction.title}"?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
            style: "destructive",
            onPress: () => {
              // TODO: call delete API with selectedTransaction.id
              setTransactions((prev) =>
                prev.filter((t) => t.id !== selectedTransaction.id),
              );
              setSelectedTransaction(null);
            },
          },
        ],
      );
    }, 300);
  }, [selectedTransaction]);

  // Action items for the bottom action modal
  const transactionActions: ActionItem[] = useMemo(
    () => [
      {
        id: "edit",
        icon: "create-outline",
        label: "Chỉnh sửa",
        onPress: handleEditTransaction,
      },
      {
        id: "delete",
        icon: "trash-outline",
        label: "Xóa giao dịch",
        onPress: handleDeleteTransaction,
        destructive: true,
      },
    ],
    [handleEditTransaction, handleDeleteTransaction],
  );

  const handleCreateRecurringTransaction = useCallback(() => {
    // Navigate to create invoice screen
    router.push("/(protected)/invoice/create-invoice");
  }, []);

  const renderTransactionCard = useCallback(
    (transaction: RecurringTransaction) => {
      const isIncome = transaction.type === "income";
      const amountColor = isIncome ? "#22C55E" : "#EF4444";
      const amountPrefix = isIncome ? "+" : "-";

      return (
        <TouchableOpacity
          key={transaction.id}
          style={styles.transactionCard}
          onPress={() => handleTransactionPress(transaction)}
          activeOpacity={0.7}
        >
          <View style={styles.transactionLeft}>
            <View
              style={[styles.transactionIcon, { backgroundColor: transaction.color }]}
            >
              <FontAwesome6
                name={transaction.icon}
                size={normalize(20)}
                color="#fff"
                solid
              />
            </View>
            <View style={styles.transactionInfo}>
              <CustomText style={styles.transactionTitle}>
                {transaction.title}
              </CustomText>
              <CustomText style={styles.transactionDescription}>
                Lần xuất hiện tiếp theo: {transaction.nextDate}
              </CustomText>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <CustomText style={[styles.amountText, { color: amountColor }]}>
              {amountPrefix}{formatCurrency(transaction.amount)} đ
            </CustomText>
          </View>
        </TouchableOpacity>
      );
    },
    [styles, formatCurrency, handleTransactionPress],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader title="Giao dịch định kỳ" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {transactions.length > 0 ? (
          <View style={styles.listContainer}>
            {transactions.map(renderTransactionCard)}
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

        {/* Bottom spacing for fixed button */}
        <View style={{ height: hp(12) }} />
      </ScrollView>

      {/* Create Button - Fixed at Bottom */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateRecurringTransaction}
          activeOpacity={0.8}
        >
          <CustomText style={styles.createButtonText}>
            Tạo giao dịch định kỳ
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Action Modal for Edit/Delete */}
      <BottomActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={selectedTransaction?.title}
        subtitle={`Lần tiếp theo: ${selectedTransaction?.nextDate || ""}`}
        actions={transactionActions}
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
    },
    transactionCard: {
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
    transactionLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    transactionIcon: {
      width: normalize(48),
      height: normalize(48),
      borderRadius: normalize(12),
      alignItems: "center",
      justifyContent: "center",
    },
    transactionInfo: {
      marginLeft: wp(3),
      flex: 1,
    },
    transactionTitle: {
      fontSize: normalize(15),
      color: colors.text,
      fontFamily: Fonts.semiBold,
      marginBottom: hp(0.5),
    },
    transactionDescription: {
      fontSize: normalize(12),
      color: colors.icon,
      fontFamily: Fonts.regular,
    },
    transactionRight: {
      alignItems: "flex-end",
      marginLeft: wp(2),
    },
    amountText: {
      fontSize: normalize(15),
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

export default RecurringTransactionListScreen;
