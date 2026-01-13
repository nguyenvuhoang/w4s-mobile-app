// src/features/home/screens/AddTransactionScreen.tsx
import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
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

type TransactionType = "income" | "expense" | "inout";

const CATEGORY_STORAGE_KEY = "temp_selected_category";
const WALLET_STORAGE_KEY = "temp_selected_wallet";

const AddTransactionScreen = () => {
  const { colors } = useAppTheme();
  const { wallets, defaultWallet } = useWallet();

  const [selectedType, setSelectedType] = useState<TransactionType>("expense");
  const [sourceWalletId, setSourceWalletId] = useState<string | null>(null);
  const [selectedCategoryData, setSelectedCategoryData] =
    useState<SelectedCategoryData | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [includeInReport, setIncludeInReport] = useState(true);

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletId === sourceWalletId),
    [wallets, sourceWalletId]
  );

  const isValid =
    selectedWallet && selectedCategoryData && amount.trim() !== "";

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

            // Auto sync transaction type
            const typeMap = {
              INCOME: "income",
              EXPENSE: "expense",
              LOAN: "inout",
            } as const;
            setSelectedType(typeMap[categoryData.category_type]);

            await StorageService.removeAsyncItem(CATEGORY_STORAGE_KEY);
          }
        } catch (error) {
          console.error("[AddTransaction] Load data failed:", error);
        }
      };
      loadData();
    }, [])
  );

  const handleTypeChange = (newType: TransactionType) => {
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

  const handlePickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return alert("Cần quyền truy cập thư viện ảnh!");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleCreate = () => {
    if (!isValid) return;

    console.log("Create transaction", {
      type: selectedType,
      sourceWalletId,
      category: selectedCategoryData,
      amount,
      note,
      date: selectedDate,
      imageUri,
      includeInReport,
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <AppHeader title="Thêm giao dịch" />

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
                router.push("/(protected)/wallet-list?mode=select")
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
              numberOfLines={3}
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />
          </View>

          {/* Date Picker */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Ngày
            </CustomText>
            <View style={[styles.datePicker, { backgroundColor: colors.card }]}>
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

              <CustomText style={[styles.dateText, { color: colors.text }]}>
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

          {/* Image Upload - Optional */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Hình ảnh
            </CustomText>
            {imageUri ? (
              <View
                style={[
                  styles.imageContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TouchableOpacity
                  style={[
                    styles.removeBtn,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() => setImageUri(null)}
                >
                  <FontAwesome6
                    name="xmark"
                    size={normalize(12)}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={handlePickImage}
              >
                <FontAwesome6
                  name="image"
                  size={normalize(32)}
                  color={colors.icon}
                />
                <CustomText style={[styles.uploadText, { color: colors.icon }]}>
                  Tải lên
                </CustomText>
              </TouchableOpacity>
            )}
          </View>

          {/* Include in Report Toggle */}
          <View style={[styles.toggle, { backgroundColor: colors.card }]}>
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
    minHeight: hp(10),
  },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
  },
  dateText: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
  },
  uploadBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: normalize(40),
    borderRadius: normalize(12),
    borderWidth: 2,
    borderStyle: "dashed",
  },
  uploadText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    marginTop: normalize(8),
  },
  imageContainer: {
    borderRadius: normalize(12),
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: normalize(150),
    borderRadius: normalize(12),
  },
  removeBtn: {
    position: "absolute",
    top: normalize(8),
    right: normalize(8),
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    alignItems: "center",
    justifyContent: "center",
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingVertical: normalize(16),
    marginHorizontal: wp(5),
    marginTop: hp(2),
    borderRadius: normalize(12),
  },
  toggleLabel: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
  },
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
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

export default AddTransactionScreen;
