import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import STORAGE_KEY from "@/constants/StorageKey";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface SelectedCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

type TransactionType = "income" | "expense" | "inout";

const AddTransactionScreen = () => {
  const { colors } = useAppTheme();
  const { wallets, defaultWallet } = useWallet();
  const { currencies, parseCurrencyName } = useCurrency({ autoFetch: true });
  const { convert } = useExchangeRate();

  const [selectedType, setSelectedType] = useState<TransactionType>("expense");
  const [sourceWalletId, setSourceWalletId] = useState<string | null>(null);
  const [selectedCategoryData, setSelectedCategoryData] =
    useState<SelectedCategoryData | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [includeInReport, setIncludeInReport] = useState(true);
  
  const [inputCurrency, setInputCurrency] = useState<SelectedCurrency>({
    currencyId: "VND",
    symbol: "đ",
    name: "Việt Nam Đồng",
  });

  // Ref để track xem user đã manually chọn currency chưa
  const hasManuallySelectedCurrencyRef = useRef(false);

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletId === sourceWalletId),
    [wallets, sourceWalletId]
  );

  const walletCurrency = useMemo<SelectedCurrency>(() => {
    if (!selectedWallet) {
      return {
        currencyId: "VND",
        symbol: "đ",
        name: "Việt Nam Đồng",
      };
    }
    
    const currency = currencies.find((c) => c.currency_id === selectedWallet.currency);
    
    if (currency) {
      return {
        currencyId: currency.currency_id,
        symbol: currency.symbol,
        name: parseCurrencyName(currency),
      };
    }

    // Fallback nếu không tìm thấy
    return {
      currencyId: selectedWallet.currency || "VND",
      symbol: selectedWallet.currency === "USD" ? "$" : "đ",
      name: selectedWallet.currency || "Việt Nam Đồng",
    };
  }, [selectedWallet, currencies, parseCurrencyName]);

  // Kiểm tra có chần chuyển đổi tiền tệ không
  const needsConversion = useMemo(
    () => inputCurrency.currencyId !== walletCurrency.currencyId,
    [inputCurrency.currencyId, walletCurrency.currencyId]
  );

  // tính rate để hiển thị
  const exchangeRate = useMemo(() => {
    if (!needsConversion) return null;
    
    const rate = convert(1, inputCurrency.currencyId, walletCurrency.currencyId);
    if (rate === null) return null;

    if (walletCurrency.currencyId === "VND" || walletCurrency.currencyId === "VNĐ") {
      return Math.round(rate);
    } else {
      return Math.round(rate * 10000) / 10000;
    }
  }, [needsConversion, inputCurrency.currencyId, walletCurrency.currencyId, convert]);

  // tính số tiền đã chuyển đổi
  const convertedAmount = useMemo(() => {
    if (!needsConversion || !amount || amount === "0") return null;
    
    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(numAmount)) return null;

    const result = convert(
      numAmount,
      inputCurrency.currencyId,
      walletCurrency.currencyId
    );

    if (result === null) return null;

    if (walletCurrency.currencyId === "VND" || walletCurrency.currencyId === "VNĐ") {
      return Math.round(result);
    } else {
      return Math.round(result * 100) / 100;
    }
  }, [amount, needsConversion, inputCurrency.currencyId, walletCurrency.currencyId, convert]);

  const isValid =
    selectedWallet && selectedCategoryData && amount.trim() !== "";

  // Init default wallet
  useEffect(() => {
    if (!sourceWalletId && defaultWallet) {
      setSourceWalletId(defaultWallet.walletId);
    }
  }, [defaultWallet, sourceWalletId]);

  useEffect(() => {
    if (selectedWallet && currencies.length > 0) {
      console.log('[AddTransaction] Wallet changed:', selectedWallet.walletId, 'Currency:', walletCurrency.currencyId);
      // Nếu user chưa manually chọn currency -> tự động sync với wallet
      if (!hasManuallySelectedCurrencyRef.current) {
        console.log('[AddTransaction] Auto-updating input currency to:', walletCurrency);
        setInputCurrency(walletCurrency);
      } else {
        console.log('[AddTransaction] User has manually selected currency, skip auto-update');
      }
    }
  }, [selectedWallet?.walletId, walletCurrency.currencyId, currencies.length]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        console.log('[AddTransaction] useFocusEffect - Loading data...');
        
        try {
          // Load wallet
          const storedWallet = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_WALLET_STORAGE
          );
          if (storedWallet) {
            console.log('[AddTransaction] Found stored wallet:', storedWallet);
            const { walletId } = JSON.parse(storedWallet);
            setSourceWalletId(walletId);
            // Reset flag khi chọn wallet mới
            hasManuallySelectedCurrencyRef.current = false;
            console.log('[AddTransaction] Reset manual currency flag');
            await StorageService.removeAsyncItem(STORAGE_KEY.TEMP_WALLET_STORAGE);
          } else {
            console.log('[AddTransaction] No stored wallet found');
          }

          // Load category
          const storedCategory = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_CATEGORY_STORAGE
          );
          if (storedCategory) {
            console.log('[AddTransaction] Found stored category:', storedCategory);
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

            await StorageService.removeAsyncItem(STORAGE_KEY.TEMP_CATEGORY_STORAGE);
          } else {
            console.log('[AddTransaction] No stored category found');
          }
          const storedCurrency = await StorageService.getItem(STORAGE_KEY.TEMP_CURRENCY_STORAGE);
          if (storedCurrency) {
            console.log('[AddTransaction] Found stored currency:', storedCurrency);
            const currency: SelectedCurrency = JSON.parse(storedCurrency);
            setInputCurrency(currency);
            // User đã manually chọn currency
            hasManuallySelectedCurrencyRef.current = true;
            console.log('[AddTransaction] Set manual currency flag');
            await StorageService.removeItem(STORAGE_KEY.TEMP_CURRENCY_STORAGE);
          } else {
            console.log('[AddTransaction] No stored currency found');
          }
        } catch (error) {
          console.error("[AddTransaction] Load data failed:", error);
        }
      };
      loadData();
    }, []) // ✅ Dependencies array rỗng vẫn OK vì useFocusEffect tự chạy mỗi khi focus
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

    // Tính số tiền cuối cùng theo đơn vị tiền tệ của ví
    const finalAmount = needsConversion ? convertedAmount : parseFloat(amount.replace(/,/g, ""));

    console.log("Create transaction", {
      type: selectedType,
      sourceWalletId,
      category: selectedCategoryData,
      amount: finalAmount, // Số tiền theo đơn vị ví
      originalAmount: parseFloat(amount.replace(/,/g, "")), // Số tiền người dùng nhập
      inputCurrency: inputCurrency.currencyId,
      walletCurrency: walletCurrency.currencyId,
      note,
      date: selectedDate,
      imageUri,
      includeInReport,
    });
    router.back();
  };

  const parseCategoryNameJSON = (nameJson: string) => {
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

  const formatConvertedAmount = (amount: number) => {
    if (walletCurrency.currencyId === "VND" || walletCurrency.currencyId === "VNĐ") {
      return Math.round(amount).toLocaleString("vi-VN");
    }
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatExchangeRate = (rate: number) => {
    if (walletCurrency.currencyId === "VND" || walletCurrency.currencyId === "VNĐ") {
      return Math.round(rate).toLocaleString("vi-VN");
    }
    return rate.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
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
                      {parseCategoryNameJSON(selectedCategoryData.category_name)}
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
              <TouchableOpacity
                onPress={() => {
                  hasManuallySelectedCurrencyRef.current = true;
                  router.push("/(protected)/select-currency");
                }}
                style={styles.currencyButton}
              >
                <CustomText style={[styles.currency, { color: colors.tint }]}>
                  {inputCurrency.symbol}
                </CustomText>
              </TouchableOpacity>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
            
            {/* Conversion Display */}
            {needsConversion && convertedAmount !== null && exchangeRate !== null && (
              <View style={styles.conversionContainer}>
                <FontAwesome6
                  name="arrow-right-arrow-left"
                  size={normalize(12)}
                  color={colors.icon}
                />
                <View style={styles.conversionTextContainer}>
                  <CustomText style={[styles.conversionText, { color: colors.icon }]}>
                    ≈ {walletCurrency.symbol} {formatConvertedAmount(convertedAmount)}
                    <CustomText style={{ fontSize: normalize(11), opacity: 0.7 }}>
                      {" "}({walletCurrency.currencyId})
                    </CustomText>
                  </CustomText>
                  <CustomText style={[styles.exchangeRateText, { color: colors.icon }]}>
                    1 {inputCurrency.currencyId} = {formatExchangeRate(exchangeRate)} {walletCurrency.currencyId}
                  </CustomText>
                </View>
              </View>
            )}
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
  currencyButton: {
    paddingVertical: normalize(4),
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
  conversionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: normalize(8),
    marginTop: normalize(8),
    paddingHorizontal: normalize(4),
  },
  conversionTextContainer: {
    flex: 1,
    gap: normalize(2),
  },
  conversionText: {
    fontSize: normalize(13),
    fontFamily: Fonts.medium,
  },
  exchangeRateText: {
    fontSize: normalize(11),
    fontFamily: Fonts.regular,
    opacity: 0.7,
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