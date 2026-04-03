import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import BottomRecurringModal, {
  RecurringResult,
  RecurringType,
} from "@/components/modals/BottomRecurringModal";
import STORAGE_KEY from "@/constants/StorageKey";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SelectedCategoryData {
  category_id: string;
  category_name: string;
  category_type: "EXPENSE" | "INCOME";
  icon: string;
  color: string;
}

// Interface for autofill data
interface AutofillData {
  walletId?: number;
  category?: {
    category_id: string;
    category_name: string;
    category_type: "EXPENSE" | "INCOME";
    icon: string;
    color: string;
  };
  amount?: string | number;
  date?: string | Date; // Can be ISO string or Date object
  note?: string;
  recurring?: {
    type?: RecurringType;
    count?: number;
    isForever?: boolean;
    selectedDays?: number[];
  };
}

const CreateRecurringInvoiceScreen = () => {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();
  const { wallets, defaultWallet } = useWallet();

  // Determine if we're in edit mode
  const isEditMode = (params.mode as string) === "edit";
  const editId = params.id as string | undefined;

  // Get title from params or use default based on mode
  const screenTitle = isEditMode
    ? "Chỉnh sửa giao dịch định kỳ"
    : (params.title as string) || "Tạo hóa đơn định kỳ";

  // Form states
  const [sourceWalletId, setSourceWalletId] = useState<number | null>(null);
  const [selectedCategoryData, setSelectedCategoryData] =
    useState<SelectedCategoryData | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [note, setNote] = useState("");

  // Recurring states
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringType, setRecurringType] = useState<RecurringType>("monthly");
  const [recurringCount, setRecurringCount] = useState<number | null>(12);
  const [isForever, setIsForever] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);
  const [recurringLabel, setRecurringLabel] = useState("Hàng Tháng - 12 lần");

  // Process autofill data from params
  useEffect(() => {
    if (params.autofillData) {
      try {
        const autofillData: AutofillData =
          typeof params.autofillData === 'string'
            ? JSON.parse(params.autofillData as string)
            : params.autofillData;

        console.log("[CreateInvoice] Autofill data:", autofillData);

        // Autofill wallet
        if (autofillData.walletId !== undefined) {
          setSourceWalletId(autofillData.walletId);
        }

        // Autofill category
        if (autofillData.category) {
          setSelectedCategoryData(autofillData.category);
        }

        // Autofill amount
        if (autofillData.amount !== undefined) {
          setAmount(String(autofillData.amount));
        }

        // Autofill date
        if (autofillData.date) {
          const date = typeof autofillData.date === 'string'
            ? new Date(autofillData.date)
            : autofillData.date;
          if (date instanceof Date && !isNaN(date.getTime())) {
            setSelectedDate(date);
          }
        }

        // Autofill note
        if (autofillData.note) {
          setNote(autofillData.note);
        }

        // Autofill recurring settings
        if (autofillData.recurring) {
          if (autofillData.recurring.type) {
            setRecurringType(autofillData.recurring.type);

            // Update label based on type
            const labelMap: Record<string, string> = {
              daily: "Hàng ngày",
              weekly: "Hàng tuần",
              monthly: "Hàng tháng",
              yearly: "Hàng năm",
            };

            let label = labelMap[autofillData.recurring.type] || "Hàng tháng";

            if (autofillData.recurring.count && !autofillData.recurring.isForever) {
              label += ` - ${autofillData.recurring.count} lần`;
            } else if (autofillData.recurring.isForever) {
              label += " - Mãi mãi";
            }

            setRecurringLabel(label);
          }

          if (autofillData.recurring.count !== undefined) {
            setRecurringCount(autofillData.recurring.count);
          }

          if (autofillData.recurring.isForever !== undefined) {
            setIsForever(autofillData.recurring.isForever);
          }

          if (autofillData.recurring.selectedDays) {
            setSelectedDays(autofillData.recurring.selectedDays);
          }
        }
      } catch (error) {
        console.error("[CreateInvoice] Failed to parse autofill data:", error);
      }
    }
  }, [params.autofillData]);

  // Load edit data from params
  useEffect(() => {
    if (isEditMode) {
      // Pre-fill amount
      if (params.amount) {
        setAmount(params.amount as string);
      }
      // Pre-fill note
      if (params.note) {
        setNote(params.note as string);
      }
      // Pre-fill recurring type
      if (params.recurring) {
        const recurType = params.recurring as RecurringType;
        setRecurringType(recurType);
        // Set matching label
        const labelMap: Record<string, string> = {
          daily: "Hàng ngày",
          weekly: "Hàng tuần",
          monthly: "Hàng tháng",
          yearly: "Hàng năm",
        };
        setRecurringLabel(labelMap[recurType] || "Hàng Tháng - 12 lần");
      }
      // Pre-fill date
      if (params.nextDate) {
        const dateParts = (params.nextDate as string).split("/");
        if (dateParts.length === 3) {
          const date = new Date(
            parseInt(dateParts[2]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[0]),
          );
          if (!isNaN(date.getTime())) {
            setSelectedDate(date);
          }
        }
      }
      // Pre-fill category from params (icon, color, type)
      if (params.icon && params.color) {
        setSelectedCategoryData({
          category_id: params.categoryId as string || "",
          category_name: JSON.stringify({ vi: params.editTitle || params.title || "" }),
          category_type: (params.type as string) === "income" ? "INCOME" : "EXPENSE",
          icon: params.icon as string,
          color: params.color as string,
        });
      }
    }
  }, [isEditMode]);

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletId === sourceWalletId),
    [wallets, sourceWalletId],
  );

  const isValid = useMemo(
    () =>
      selectedWallet &&
      selectedCategoryData &&
      amount.trim() !== "" &&
      amount !== "0" &&
      recurringType !== "none",
    [selectedWallet, selectedCategoryData, amount, recurringType],
  );

  // Set default wallet
  useEffect(() => {
    if (!sourceWalletId && defaultWallet) {
      setSourceWalletId(defaultWallet.walletId);
    }
  }, [defaultWallet, sourceWalletId]);

  // Load selected data from storage
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const storedWallet = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_WALLET_STORAGE,
          );
          if (storedWallet) {
            const { walletId } = JSON.parse(storedWallet);
            setSourceWalletId(walletId);
            await StorageService.removeAsyncItem(
              STORAGE_KEY.TEMP_WALLET_STORAGE,
            );
          }

          const storedCategory = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_CATEGORY_STORAGE,
          );
          if (storedCategory) {
            const categoryData: SelectedCategoryData =
              JSON.parse(storedCategory);

            // Only accept EXPENSE or INCOME for recurring invoices
            if (
              categoryData.category_type === "EXPENSE" ||
              categoryData.category_type === "INCOME"
            ) {
              setSelectedCategoryData(categoryData);
            }

            await StorageService.removeAsyncItem(
              STORAGE_KEY.TEMP_CATEGORY_STORAGE,
            );
          }
        } catch (error) {
          console.error("[CreateRecurringInvoice] Load data failed:", error);
        }
      };
      loadData();
    }, []),
  );

  const parseCategoryName = useCallback((nameJson: string) => {
    try {
      const parsed = JSON.parse(nameJson);
      return parsed.vi || parsed.en || "Chọn nhóm";
    } catch {
      return "Chọn nhóm";
    }
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const handleRecurringSelect = useCallback((result: RecurringResult) => {
    setRecurringType(result.type);
    setRecurringCount(result.count);
    setIsForever(result.isForever);
    setSelectedDays(result.selectedDays || [1]);
    setRecurringLabel(result.label);
  }, []);

  const handleCreate = useCallback(() => {
    if (!isValid) return;

    const invoiceData = {
      wallet: selectedWallet,
      category: selectedCategoryData,
      amount: parseFloat(amount.replace(/,/g, "")),
      startDate: selectedDate,
      note,
      recurring: {
        type: recurringType,
        count: recurringCount,
        isForever,
        selectedDays: recurringType === "weekly" ? selectedDays : null,
      },
    };

    if (isEditMode) {
      console.log("Update recurring invoice", { id: editId, ...invoiceData });
      // TODO: Call update API
    } else {
      console.log("Create recurring invoice", invoiceData);
      // TODO: Call create API
    }

    router.back();
  }, [
    isValid,
    isEditMode,
    editId,
    selectedWallet,
    selectedCategoryData,
    amount,
    selectedDate,
    note,
    recurringType,
    recurringCount,
    selectedDays,
    isForever,
  ]);

  // Delete handler (only in edit mode)
  const handleDelete = useCallback(() => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa giao dịch định kỳ này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            console.log("Delete recurring invoice:", editId);
            // TODO: Call delete API with editId
            router.back();
          },
        },
      ],
    );
  }, [editId]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <AppHeader
          title={screenTitle}
          rightComponent={
            // Ẩn nút Scan đi nếu màn hình đang load dữ liệu autofill từ màn Scan
            params.autofillData ? null : (
              <TouchableOpacity
                onPress={() => router.push("/(protected)/invoice/scan")}
                style={styles.scanBtn}
                activeOpacity={0.7}
              >
                <FontAwesome6
                  name="expand"
                  size={normalize(18)}
                  color={colors.tint}
                  solid
                />
              </TouchableOpacity>
            )
          }
        />

        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Source Wallet - REQUIRED */}
          <View style={styles.section}>
            <CustomText style={styles.label}>
              Nguồn tiền thanh toán{" "}
              <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={styles.field}
              onPress={() =>
                router.push("/(protected)/wallet/wallet-list?mode=select")
              }
            >
              <View style={styles.fieldLeft}>
                <FontAwesome6
                  name={(selectedWallet?.icon as any) || "wallet"}
                  size={normalize(18)}
                  color={selectedWallet?.color || colors.icon}
                  solid
                />
                <CustomText style={styles.fieldText}>
                  {selectedWallet?.name || "Chọn ví"}
                </CustomText>
              </View>
              <FontAwesome6
                name="chevron-right"
                size={normalize(16)}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Category - REQUIRED */}
          <View style={styles.section}>
            <CustomText style={styles.label}>
              Nhóm <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={styles.field}
              onPress={() =>
                router.push({
                  pathname: "/(protected)/select-category",
                  params: { selectedType: "expense" }, // Default to expense for invoices
                })
              }
            >
              <View style={styles.fieldLeft}>
                {selectedCategoryData ? (
                  <>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: selectedCategoryData.color },
                      ]}
                    >
                      <FontAwesome6
                        name={selectedCategoryData.icon as any}
                        size={normalize(18)}
                        color="#fff"
                      />
                    </View>
                    <CustomText style={styles.fieldText}>
                      {parseCategoryName(selectedCategoryData.category_name)}
                    </CustomText>
                  </>
                ) : (
                  <>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: colors.border },
                      ]}
                    />
                    <CustomText
                      style={[styles.fieldText, { color: colors.icon }]}
                    >
                      Chọn nhóm
                    </CustomText>
                  </>
                )}
              </View>
              <FontAwesome6
                name="chevron-right"
                size={normalize(16)}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Amount - REQUIRED */}
          <View style={styles.section}>
            <CustomText style={styles.label}>
              Số tiền <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <View style={styles.amountContainer}>
              <CustomText style={styles.currency}>
                {selectedWallet?.currency === "USD" ? "$" : "₫"}
              </CustomText>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Recurring Period - REQUIRED */}
          <View style={styles.section}>
            <CustomText style={styles.label}>
              Chu kỳ lặp lại <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={styles.field}
              onPress={() => setShowRecurringModal(true)}
            >
              <View style={styles.fieldLeft}>
                <FontAwesome6
                  name="rotate"
                  size={normalize(18)}
                  color={recurringType !== "none" ? colors.tint : colors.icon}
                  solid
                />
                <CustomText
                  style={[
                    styles.fieldText,
                    recurringType === "none" && { color: colors.icon },
                  ]}
                >
                  {recurringLabel}
                </CustomText>
              </View>
              <FontAwesome6
                name="chevron-right"
                size={normalize(16)}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Start Date */}
          <View style={styles.section}>
            <CustomText style={styles.label}>Ngày bắt đầu</CustomText>
            <View style={styles.datePicker}>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 1);
                  setSelectedDate(newDate);
                }}
              >
                <FontAwesome6
                  name="chevron-left"
                  size={normalize(16)}
                  color={colors.text}
                />
              </TouchableOpacity>

              <CustomText style={styles.dateText}>
                {formatDate(selectedDate)}
              </CustomText>

              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + 1);
                  setSelectedDate(newDate);
                }}
              >
                <FontAwesome6
                  name="chevron-right"
                  size={normalize(16)}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Note - Optional */}
          <View style={styles.section}>
            <CustomText style={styles.label}>Ghi chú</CustomText>
            <TextInput
              style={styles.noteInput}
              placeholder="Thêm ghi chú (tùy chọn)"
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={3}
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />
          </View>

          {/* Info box for recurring invoices */}
          {recurringType !== "none" && (
            <View style={styles.infoBox}>
              <FontAwesome6
                name="circle-info"
                size={normalize(16)}
                color={colors.tint}
                solid
              />
              <View style={styles.infoTextContainer}>
                <CustomText style={styles.infoText}>
                  Hóa đơn định kỳ sẽ tự động tạo giao dịch theo chu kỳ đã chọn.
                </CustomText>
                {recurringType === "weekly" && selectedDays.length > 0 && (
                  <CustomText
                    style={[styles.infoText, { marginTop: normalize(4) }]}
                  >
                    Giao dịch sẽ được tạo vào:{" "}
                    {selectedDays
                      .map((d) => {
                        const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                        return days[d];
                      })
                      .join(", ")}
                  </CustomText>
                )}
              </View>
            </View>
          )}

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomBar}>
          {isEditMode ? (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
            >
              <FontAwesome6
                name="trash-can"
                size={normalize(16)}
                color="#EF4444"
                solid
              />
              <CustomText style={styles.deleteText}>Xóa</CustomText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
            >
              <CustomText style={styles.cancelText}>Hủy</CustomText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.createBtn,
              { backgroundColor: isValid ? colors.tint : colors.border },
            ]}
            onPress={handleCreate}
            disabled={!isValid}
          >
            <CustomText style={styles.createText}>
              {isEditMode ? "Lưu" : "Tạo"}
            </CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Recurring Modal */}
      <BottomRecurringModal
        visible={showRecurringModal}
        title="Chu kỳ lặp lại"
        initialRecurringType={recurringType}
        initialRecurringCount={recurringCount || 1}
        initialIsForever={isForever}
        initialSelectedDays={selectedDays}
        onSelect={handleRecurringSelect}
        onClose={() => setShowRecurringModal(false)}
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
    flex: {
      flex: 1,
    },
    section: {
      paddingHorizontal: wp(4),
      marginTop: hp(2),
    },
    label: {
      fontSize: normalize(14),
      color: colors.text,
      marginBottom: hp(1),
      fontFamily: Fonts.medium,
    },
    field: {
      backgroundColor: colors.card,
      borderRadius: normalize(12),
      padding: normalize(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.border,
    },
    fieldLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    fieldText: {
      fontSize: normalize(15),
      color: colors.text,
      marginLeft: wp(3),
      fontFamily: Fonts.regular,
    },
    categoryIcon: {
      width: normalize(40),
      height: normalize(40),
      borderRadius: normalize(10),
      alignItems: "center",
      justifyContent: "center",
    },
    amountContainer: {
      backgroundColor: colors.card,
      borderRadius: normalize(12),
      padding: normalize(16),
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    currency: {
      fontSize: normalize(16),
      color: colors.tint,
      fontFamily: Fonts.semiBold,
      marginRight: wp(2),
    },
    amountInput: {
      flex: 1,
      fontSize: normalize(18),
      color: colors.text,
      fontFamily: Fonts.regular,
    },
    datePicker: {
      backgroundColor: colors.card,
      borderRadius: normalize(12),
      padding: normalize(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateText: {
      fontSize: normalize(15),
      color: colors.text,
      fontFamily: Fonts.medium,
    },
    noteInput: {
      backgroundColor: colors.card,
      borderRadius: normalize(12),
      padding: normalize(16),
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontSize: normalize(15),
      fontFamily: Fonts.regular,
      minHeight: hp(10),
    },
    infoBox: {
      marginHorizontal: wp(4),
      marginTop: hp(2),
      backgroundColor: colors.tint + "15",
      borderRadius: normalize(12),
      padding: normalize(16),
      flexDirection: "row",
      gap: normalize(12),
      borderWidth: 1,
      borderColor: colors.tint + "30",
    },
    infoTextContainer: {
      flex: 1,
    },
    infoText: {
      fontSize: normalize(13),
      color: colors.text,
      fontFamily: Fonts.regular,
      lineHeight: normalize(18),
    },
    bottomBar: {
      backgroundColor: colors.background,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: "row",
      gap: wp(3),
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: hp(1.5),
      borderRadius: normalize(12),
      borderWidth: 2,
      borderColor: colors.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: {
      fontSize: normalize(16),
      color: colors.tint,
      fontFamily: Fonts.semiBold,
    },
    createBtn: {
      flex: 1,
      paddingVertical: hp(1.5),
      borderRadius: normalize(12),
      alignItems: "center",
      justifyContent: "center",
    },
    createText: {
      fontSize: normalize(16),
      color: "#fff",
      fontFamily: Fonts.semiBold,
    },
    deleteBtn: {
      flex: 1,
      paddingVertical: hp(1.5),
      borderRadius: normalize(12),
      borderWidth: 2,
      borderColor: "#EF4444",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: wp(2),
    },
    deleteText: {
      fontSize: normalize(16),
      color: "#EF4444",
      fontFamily: Fonts.semiBold,
    },
    scanBtn: {
      width: normalize(40),
      height: normalize(40),
      alignItems: "center",
      justifyContent: "center",
    },
  });

export default CreateRecurringInvoiceScreen;
