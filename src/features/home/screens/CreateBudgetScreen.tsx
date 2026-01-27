// src/features/home/screens/CreateBudgetScreen.tsx
import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import BottomDateRangeModal, {
  DateRangeResult,
  PeriodType,
} from "@/components/modals/BottomDateRangeModal";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SelectedCategoryData {
  category_id: string;
  category_name: string;
  category_type: "EXPENSE" | "INCOME" | "LOAN";
  icon: string;
  color: string;
}

type BudgetType = "income" | "expense" | "inout";

const CATEGORY_STORAGE_KEY = "temp_selected_category";
const WALLET_STORAGE_KEY = "temp_selected_wallet";

const CreateBudgetScreen = () => {
  const { colors } = useAppTheme();
  const { wallets, defaultWallet } = useWallet();

  const [selectedType, setSelectedType] = useState<BudgetType>("expense");
  const [sourceWalletId, setSourceWalletId] = useState<number | null>(null);
  const [selectedCategoryData, setSelectedCategoryData] =
    useState<SelectedCategoryData | null>(null);
  const [amount, setAmount] = useState("");

  // Date range states
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [periodType, setPeriodType] = useState<PeriodType>("MONTH");
  const [dateRangeLabel, setDateRangeLabel] = useState("");
  const [showDateModal, setShowDateModal] = useState(false);

  const [note, setNote] = useState("");
  const [includeInReport, setIncludeInReport] = useState(true);
  const [autoRepeat, setAutoRepeat] = useState(true);

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletId === sourceWalletId),
    [wallets, sourceWalletId]
  );

  const isValid =
    selectedWallet && selectedCategoryData && amount.trim() !== "";

  // Initialize default date range label
  useEffect(() => {
    if (!dateRangeLabel) {
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      setStartDate(monthStart);
      setEndDate(monthEnd);
      setDateRangeLabel(`Tháng này (${formatDateRange(monthStart, monthEnd)})`);
    }
  }, []);

  // Init default wallet
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
          // Load wallet
          const storedWallet = await StorageService.getAsyncItem(
            WALLET_STORAGE_KEY
          );
          if (storedWallet) {
            const { walletId } = JSON.parse(storedWallet);
            setSourceWalletId(walletId);
            await StorageService.removeAsyncItem(WALLET_STORAGE_KEY);
          }

          // Load category
          const storedCategory = await StorageService.getAsyncItem(
            CATEGORY_STORAGE_KEY
          );
          if (storedCategory) {
            const categoryData: SelectedCategoryData =
              JSON.parse(storedCategory);
            setSelectedCategoryData(categoryData);

            // Auto sync budget type
            const typeMap = {
              INCOME: "income",
              EXPENSE: "expense",
              LOAN: "inout",
            } as const;
            setSelectedType(typeMap[categoryData.category_type]);

            await StorageService.removeAsyncItem(CATEGORY_STORAGE_KEY);
          }
        } catch (error) {
          console.error("[CreateBudget] Load data failed:", error);
        }
      };
      loadData();
    }, [])
  );

  const handleTypeChange = (newType: BudgetType) => {
    setSelectedType(newType);

    // Clear category if type mismatch
    if (selectedCategoryData) {
      const typeMap = {
        income: "INCOME",
        expense: "EXPENSE",
        inout: "LOAN",
      } as const;
      if (selectedCategoryData.category_type !== typeMap[newType]) {
        setSelectedCategoryData(null);
      }
    }
  };

  const formatDateRange = (start: Date, end: Date) => {
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${day}/${month}`;
    };
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const handleDateRangeSelect = (result: DateRangeResult) => {
    setStartDate(result.startDate);
    setEndDate(result.endDate);
    setPeriodType(result.periodType);

    // Format label based on period type
    if (result.periodType === "CUSTOM") {
      setDateRangeLabel(result.label);
    } else {
      setDateRangeLabel(
        `${result.label} (${formatDateRange(result.startDate, result.endDate)})`
      );
    }
  };

  const handleCreate = () => {
    if (!isValid) return;

    console.log("Create budget", {
      type: selectedType,
      sourceWalletId,
      category: selectedCategoryData,
      amount,
      startDate,
      endDate,
      periodType,
      note,
      includeInReport,
      autoRepeat,
    });
    router.back();
  };

  const parseCategoryName = (nameJson: string) => {
    try {
      const parsed = JSON.parse(nameJson);
      return parsed.vi || parsed.en || "Chọn nhóm";
    } catch {
      return "Chọn nhóm";
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <AppHeader title="Tạo ngân sách" />

        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selector */}
          <View style={styles.section}>
            <View style={styles.typeContainer}>
              {[
                { type: "income" as const, label: "Khoản thu" },
                { type: "expense" as const, label: "Khoản chi" },
                { type: "inout" as const, label: "Vay/Nợ" },
              ].map(({ type, label }) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor:
                        selectedType === type ? colors.tint : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleTypeChange(type)}
                >
                  <CustomText
                    style={[
                      styles.typeText,
                      {
                        color: selectedType === type ? "#fff" : colors.text,
                        fontFamily:
                          selectedType === type
                            ? Fonts.semiBold
                            : Fonts.regular,
                      },
                    ]}
                  >
                    {label}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Source Wallet - REQUIRED */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Nguồn tiền <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={[
                styles.field,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
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
                <CustomText style={[styles.fieldText, { color: colors.text }]}>
                  {selectedWallet?.name || "Chọn ví"}
                </CustomText>
              </View>
            </TouchableOpacity>
          </View>

          {/* Category - REQUIRED */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Nhóm <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={[
                styles.field,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/(protected)/select-category",
                  params: { selectedType },
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
                    <CustomText
                      style={[styles.fieldText, { color: colors.text }]}
                    >
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
            </TouchableOpacity>
          </View>

          {/* Amount - REQUIRED */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Số tiền <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <View
              style={[
                styles.amountContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <CustomText style={[styles.currency, { color: colors.tint }]}>
                đ
              </CustomText>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Time Range */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Khoảng thời gian
            </CustomText>
            <TouchableOpacity
              style={[
                styles.field,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setShowDateModal(true)}
            >
              <CustomText style={[styles.fieldText, { color: colors.text }]}>
                {dateRangeLabel || "Chọn khoảng thời gian"}
              </CustomText>
              <FontAwesome6
                name="chevron-down"
                size={normalize(14)}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Note - Optional */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Ghi chú
            </CustomText>
            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Thêm ghi chú (tùy chọn)"
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={4}
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />
          </View>

          {/* Toggle Options */}
          <View
            style={[styles.toggleSection, { backgroundColor: colors.card }]}
          >
            <View style={styles.toggleRow}>
              <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
                Tính vào báo cáo
              </CustomText>
              <Switch
                value={includeInReport}
                onValueChange={setIncludeInReport}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor="#fff"
              />
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <View style={styles.toggleRow}>
              <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
                Tự động lặp lại
              </CustomText>
              <Switch
                value={autoRepeat}
                onValueChange={setAutoRepeat}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.tint }]}
            onPress={() => router.back()}
          >
            <CustomText style={[styles.cancelText, { color: colors.tint }]}>
              Hủy
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.createBtn,
              { backgroundColor: isValid ? colors.tint : colors.border },
            ]}
            onPress={handleCreate}
            disabled={!isValid}
          >
            <CustomText style={styles.createText}>Tạo</CustomText>
          </TouchableOpacity>
        </View>

        {/* Date Range Modal */}
        <BottomDateRangeModal
          visible={showDateModal}
          title="Khoảng thời gian"
          initialStartDate={startDate}
          initialEndDate={endDate}
          initialPeriodType={periodType}
          onSelect={handleDateRangeSelect}
          onClose={() => setShowDateModal(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  section: {
    paddingHorizontal: wp(5),
    marginTop: hp(2),
  },
  label: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
    marginBottom: normalize(8),
  },
  typeContainer: {
    flexDirection: "row",
    gap: normalize(8),
  },
  typeButton: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(20),
    alignItems: "center",
    borderWidth: 1,
  },
  typeText: {
    fontSize: normalize(13),
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    flex: 1,
  },
  fieldText: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
  },
  categoryIcon: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1,
    gap: normalize(12),
  },
  currency: {
    fontSize: normalize(20),
    fontFamily: Fonts.semiBold,
  },
  amountInput: {
    flex: 1,
    fontSize: normalize(18),
    fontFamily: Fonts.regular,
    padding: 0,
  },
  noteInput: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    borderWidth: 1,
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    minHeight: hp(12),
  },
  toggleSection: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: normalize(16),
  },
  toggleLabel: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
  },
  divider: {
    height: 1,
  },
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    gap: normalize(12),
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
    borderWidth: 2,
  },
  cancelText: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
  },
  createBtn: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
  },
  createText: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
    color: "#fff",
  },
});

export default CreateBudgetScreen;