import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import BottomRecurringModal, {
  RecurringResult,
  RecurringType,
} from "@/components/modals/BottomRecurringModal";
import BottomSelectModal, { BottomSelectOption } from "@/components/modals/SelectModal";
import STORAGE_KEY from "@/constants/StorageKey";
import { GlobalContext } from "@/contexts/GlobalContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import TransactionAmountInput from "@/features/transaction/components/TransactionAmountInput";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import StorageService from "@/services/StorageService";
import { invoiceRepository } from "@/services/repositories/invoice.repository";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInvoice } from "../hooks/useInvoice";

interface SelectedCategoryData {
  id: number;
  category_id: string;
  category_name: string;
  category_type: string;
  category_group: "EXPENSE" | "INCOME" | "LOAN";
  icon: string;
  color: string;
}

interface SelectedCurrency {
  currencyId: string;
  symbol: string;
  name: string;
}

// Interface for autofill data
interface AutofillData {
  walletId?: number;
  category?: SelectedCategoryData;
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
  const { appInfo } = React.useContext(GlobalContext);
  const { createInvoice, updateInvoice, deleteInvoice, loading: creating } = useInvoice();
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const { parseCurrencyName, currencies } = useCurrency({ autoFetch: true });
  const { convert } = useExchangeRate();

  const selectedType = "expense";

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

  const [inputCurrency, setInputCurrency] = useState<SelectedCurrency>({
    currencyId: "VND",
    symbol: "đ",
    name: "Việt Nam Đồng",
  });
  const hasManuallySelectedCurrencyRef = React.useRef(false);

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

  // Update selectedType based on category if it changes
  useEffect(() => {
    if (selectedCategoryData) {
      // Invoices are always expenses, but we keep this check if needed for logging/validation
    }
  }, [selectedCategoryData]);

  // Load edit data from API when in edit mode
  useEffect(() => {
    if (!isEditMode || !editId) return;

    const loadBillData = async () => {
      try {
        const res = await invoiceRepository.getInvoice(parseInt(editId));
        if (!res?.success || !res?.data) return;

        const bill = res.data;

        // Pre-fill amount
        if (bill.amount !== undefined) {
          setAmount(String(bill.amount));
        }
        // Pre-fill note
        if (bill.note) setNote(bill.note);

        // Pre-fill wallet
        if (bill.wallet_id) setSourceWalletId(bill.wallet_id);

        // Pre-fill due date
        if (bill.due_at_utc) {
          const d = new Date(bill.due_at_utc);
          if (!isNaN(d.getTime())) setSelectedDate(d);
        }

        // Pre-fill recurring
        if (bill.recurring) {
          const typeRaw: string = bill.recurring.type ?? "Monthly";
          const typeKey = typeRaw.toLowerCase() as RecurringType;
          setRecurringType(typeKey);
          setIsForever(bill.recurring.is_forever ?? false);
          setRecurringCount(bill.recurring.count ?? 12);

          const labelMap: Record<string, string> = {
            daily: "Hàng ngày",
            weekly: "Hàng tuần",
            monthly: "Hàng tháng",
            yearly: "Hàng năm",
          };
          let label = labelMap[typeKey] ?? "Hàng tháng";
          if (bill.recurring.is_forever) {
            label += " - Mãi mãi";
          } else if (bill.recurring.count) {
            label += ` - ${bill.recurring.count} lần`;
          }
          setRecurringLabel(label);
        }
      } catch (err) {
        console.error("[CreateInvoiceScreen] loadBillData error:", err);
      }
    };

    loadBillData();
  }, [isEditMode, editId]);


  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletId === sourceWalletId),
    [wallets, sourceWalletId],
  );

  const walletCurrency = useMemo<SelectedCurrency>(() => {
    if (!selectedWallet) {
      return {
        currencyId: "VND",
        symbol: "đ",
        name: "Việt Nam Đồng",
      };
    }

    const currency = currencies.find(
      (c) => c.currency_id === selectedWallet.currency,
    );

    if (currency) {
      return {
        currencyId: currency.currency_id,
        symbol: currency.symbol,
        name: parseCurrencyName(currency),
      };
    }

    return {
      currencyId: selectedWallet.currency || "VND",
      symbol: selectedWallet.currency === "USD" ? "$" : "đ",
      name: selectedWallet.currency || "Việt Nam Đồng",
    };
  }, [selectedWallet, currencies, parseCurrencyName]);

  const needsConversion = useMemo(
    () => inputCurrency.currencyId !== walletCurrency.currencyId,
    [inputCurrency.currencyId, walletCurrency.currencyId],
  );

  const exchangeRate = useMemo(() => {
    if (!needsConversion) return null;

    const rate = convert(
      1,
      inputCurrency.currencyId,
      walletCurrency.currencyId,
    );
    if (rate === null) return null;

    if (
      walletCurrency.currencyId === "VND" ||
      walletCurrency.currencyId === "VNĐ"
    ) {
      return Math.round(rate);
    } else {
      return Math.round(rate * 10000) / 10000;
    }
  }, [
    needsConversion,
    inputCurrency.currencyId,
    walletCurrency.currencyId,
    convert,
  ]);

  const convertedAmount = useMemo(() => {
    if (!needsConversion || !amount || amount === "0") return null;

    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(numAmount)) return null;

    const result = convert(
      numAmount,
      inputCurrency.currencyId,
      walletCurrency.currencyId,
    );

    if (result === null) return null;

    if (
      walletCurrency.currencyId === "VND" ||
      walletCurrency.currencyId === "VNĐ"
    ) {
      return Math.round(result);
    } else {
      return Math.round(result * 100) / 100;
    }
  }, [
    amount,
    needsConversion,
    inputCurrency.currencyId,
    walletCurrency.currencyId,
    convert,
  ]);

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

  useEffect(() => {
    if (selectedWallet && currencies.length > 0) {
      if (!hasManuallySelectedCurrencyRef.current) {
        setInputCurrency(walletCurrency);
      }
    }
  }, [selectedWallet?.walletId, walletCurrency.currencyId, currencies.length]);

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
              categoryData.category_group === "EXPENSE" ||
              categoryData.category_type === "EXPENSE" ||
              categoryData.category_group === "INCOME" ||
              categoryData.category_type === "INCOME"
            ) {
              setSelectedCategoryData(categoryData);
            }

            await StorageService.removeAsyncItem(
              STORAGE_KEY.TEMP_CATEGORY_STORAGE,
            );
          }

          const storedCurrency = await StorageService.getItem(
            STORAGE_KEY.TEMP_CURRENCY_STORAGE,
          );
          if (storedCurrency) {
            const currency: SelectedCurrency = JSON.parse(storedCurrency);
            setInputCurrency(currency);
            hasManuallySelectedCurrencyRef.current = true;
            await StorageService.removeItem(STORAGE_KEY.TEMP_CURRENCY_STORAGE);
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

  const handleCreate = useCallback(async () => {
    if (!isValid || !selectedWallet || !selectedCategoryData || !appInfo) return;

    const primaryAccount = selectedWallet.accounts?.find(acc => acc.isPrimary) || selectedWallet.accounts?.[0];
    const accountNumber = primaryAccount?.accountNumber || "";

    const finalAmount = needsConversion
      ? convertedAmount
      : parseFloat(amount.replace(/,/g, ""));

    const payload = {
      wallet_id: selectedWallet.walletId,
      account_number: accountNumber,
      category_id: selectedCategoryData.id,
      payment_transaction_type: selectedCategoryData.category_type === "INCOME" ? "01" : "02",
      bill_name: parseCategoryName(selectedCategoryData.category_name),
      business_type: null,
      recurring: {
        type: (recurringType.charAt(0).toUpperCase() + recurringType.slice(1)) as any,
        count: isForever ? null : recurringCount,
        is_forever: isForever,
        selected_days: recurringType === "weekly" ? selectedDays : null,
      },
      amount: finalAmount || 0,
      currency_code: walletCurrency.currencyId,
      due_at_utc: selectedDate.toISOString(),
      note,
      contract_number: appInfo.contract_number || "",
    };

    if (isEditMode) {
      const payload = {
        id: parseInt(editId || "0"),
        wallet_id: selectedWallet?.walletId ?? null,
        account_number: accountNumber,
        category_id: selectedCategoryData.id,
        payment_transaction_type: selectedCategoryData.category_type === "INCOME" ? "01" : "02",
        bill_name: parseCategoryName(selectedCategoryData.category_name),
        business_type: null,
        recurring: {
          type: (recurringType.charAt(0).toUpperCase() + recurringType.slice(1)) as any,
          count: isForever ? null : recurringCount,
          is_forever: isForever,
          selected_days: recurringType === "weekly" ? selectedDays : null,
        },
        amount: finalAmount || 0,
        currency_code: walletCurrency.currencyId,
        due_at_utc: selectedDate.toISOString(),
        note,
        contract_number: appInfo.contract_number || "",
      };
      const success = await updateInvoice(payload);
      if (success) {
        showNotification("Đã cập nhật hóa đơn định kỳ thành công", "success");
        router.back();
      } else {
        showNotification("Không thể cập nhật hóa đơn. Vui lòng thử lại.", "error");
      }
    } else {
      console.log("Create recurring invoice", payload);
      const success = await createInvoice(payload);
      if (success) {
        showNotification("Đã tạo hóa đơn định kỳ thành công", "success");
        router.back();
      } else {
        showNotification("Không thể tạo hóa đơn định kỳ. Vui lòng thử lại.", "error");
      }
    }
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
    appInfo,
    createInvoice,
    parseCategoryName,
    needsConversion,
    convertedAmount,
    walletCurrency.currencyId,
  ]);

  // Delete handler (only in edit mode)
  const handleDelete = useCallback(() => {
    showNotification(
      "Bạn có chắc muốn xóa giao dịch định kỳ này không?",
      "warning",
      undefined,
      undefined,
      async () => {
        const success = await deleteInvoice(parseInt(editId || "0"));
        if (success) {
          router.back();
        } else {
          showNotification("Không thể xóa hóa đơn. Vui lòng thử lại.", "error");
        }
      }
    );
  }, [editId, deleteInvoice, showNotification]);

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
              {t("transaction.source_wallet")} <CustomText style={{ color: "red" }}>*</CustomText>
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
                  {selectedWallet?.name || t("transaction.select_wallet")}
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
              {t("transaction.category")} <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={styles.field}
              onPress={() =>
                router.push({
                  pathname: "/(protected)/select-category",
                  params: { selectedType: selectedType, isInvoice: "true" },
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
                      {t("transaction.select_category")}
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
          <TransactionAmountInput
            amount={amount}
            onAmountChange={setAmount}
            inputCurrency={inputCurrency}
            walletCurrency={walletCurrency}
            onCurrencyPress={() => {
              hasManuallySelectedCurrencyRef.current = true;
              router.push("/(protected)/select-currency");
            }}
            needsConversion={needsConversion}
            convertedAmount={convertedAmount}
            exchangeRate={exchangeRate}
            selectedType={selectedType}
            label={t("transaction.amount")}
          />

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
              { backgroundColor: (isValid && !creating) ? colors.tint : colors.border },
            ]}
            onPress={handleCreate}
            disabled={!isValid || creating}
          >
            <CustomText style={styles.createText}>
              {creating ? "Đang xử lý..." : (isEditMode ? "Lưu" : "Tạo")}
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
