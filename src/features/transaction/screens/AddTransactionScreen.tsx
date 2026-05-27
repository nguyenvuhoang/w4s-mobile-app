import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import STORAGE_KEY from "@/constants/StorageKey";
import { GlobalContext } from "@/contexts/GlobalContext";
import { useNotification } from "@/contexts/NotificationContext";
import { apiService } from "@/core/api/ApiService";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { usePaybookDetail } from "@/features/paybook/hooks/usePaybook";
import type { Loan } from "@/features/paybook/types";
import TransactionAmountInput from "@/features/transaction/components/TransactionAmountInput";
import { useTransaction } from "@/features/transaction/hooks/useTransaction";
import { styles } from "@/features/transaction/style/AddTransactionScreen.Styles";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useSpendingLimit } from "@/hooks/useSpendingLimit";
import StorageService from "@/services/StorageService";
import { hp, normalize } from "@/utils/layout";

import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, {
  useCallback, useContext, useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";
import { SafeAreaView } from "react-native-safe-area-context";

interface SelectedCategoryData {
  id: number;
  category_id: string;
  category_code?: string;
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

interface Participant {
  id: string;
  name: string;
  phoneNumber?: string | null;
  avatarColor?: string;
  display_name?: string;
  phone?: string | null;
  avatar_url?: string;
  counterparty_type?: number;
  is_favorite?: boolean;
  isFromServer?: boolean;
}

interface SelectedEvent {
  eventId: number;
  eventName: string;
  icon: string;
  color: string;
}

type TransactionType = "income" | "expense" | "inout";

interface AutofillData {
  type?: TransactionType;
  walletId?: number;
  category?: {
    id: number;
    category_id: string;
    category_code?: string;
    category_name: string;
    category_type: string;
    category_group: "EXPENSE" | "INCOME" | "LOAN";
    icon: string;
    color: string;
  };
  amount?: string | number;
  date?: string | Date;
  note?: string;
  currency?: {
    currencyId: string;
    symbol: string;
    name: string;
  };
  event?: {
    eventId: number;
    eventName: string;
    icon: string;
    color: string;
  };
  location?: string;
  reminderDate?: string | Date;
  loan?: Loan;
  images?: string[];
  participants?: Participant[];
  includeInReport?: boolean;
}

const AddTransactionScreen = () => {
  const { colors, mode, isDark } = useAppTheme();
  const params = useLocalSearchParams();
  const { wallets, defaultWallet, refresh } = useWallet();
  const { currencies, parseCurrencyName } = useCurrency({ autoFetch: true });
  const { convert } = useExchangeRate();
  const { defaultCurrency } = useDefaultCurrency();
  const { createTransaction, loading: creatingTransaction } = useTransaction();
  const { showNotification } = useNotification();
  const { t, i18n } = useTranslation();
  const { appInfo } = useContext(GlobalContext);
  const { fetchAdvancedLimits, checkTransactionLimit } = useSpendingLimit();
  const { getLoans } = usePaybookDetail();

  const [selectedType, setSelectedType] = useState<TransactionType>("expense");
  const [sourceWalletId, setSourceWalletId] = useState<number | null>(null);
  const prevWalletIdRef = useRef<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [sourceEventId, setSourceEventId] = useState<number | null>(null);
  const [selectedCategoryData, setSelectedCategoryData] = useState<SelectedCategoryData | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const [includeInReport, setIncludeInReport] = useState(true);
  const [borrowToPayExpense, setBorrowToPayExpense] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [location, setLocation] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showLoanPicker, setShowLoanPicker] = useState(false);
  const [loanList, setLoanList] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [exceededLimits, setExceededLimits] = useState<any[]>([]);
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [inputCurrency, setInputCurrency] = useState<SelectedCurrency>({
    currencyId: "VND",
    symbol: "đ",
    name: "Việt Nam Đồng",
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string>(Date.now().toString());
  const hasManuallySelectedCurrencyRef = useRef(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

  const { needsConversion: walletConversionNeeded, convertedAmount: walletConvertedAmount } = useCurrencyConversion({
    amount,
    fromCurrencyId: inputCurrency.currencyId,
    toCurrencyId: walletCurrency.currencyId,
  });

  const isLoanCategory = useMemo(
    () =>
      selectedType === "inout" &&
      (selectedCategoryData?.category_type === "LOAN_COLLECT" ||
        selectedCategoryData?.category_type === "LOAN_REPAY"),
    [selectedType, selectedCategoryData],
  );

  /**
   * LOAN_COLLECT (Thu nợ) → người dùng đang thu tiền về từ khoản đã cho vay → filter loan_type = LEND
   * LOAN_REPAY  (Trả nợ) → người dùng đang trả khoản đã đi vay       → filter loan_type = BORROW
   */
  const filteredLoanList = useMemo(() => {
    if (loanList.length === 0) return loanList;
    const targetType =
      selectedCategoryData?.category_type === "LOAN_COLLECT" ? "LEND" : "BORROW";
    return loanList.filter((loan) => loan.loan_type === targetType);
  }, [loanList, selectedCategoryData?.category_type]);

  const isValid =
    selectedWallet && selectedCategoryData && amount.trim() !== "";

  // Tính inline warning label từ exceeded limits
  const exceededLabel = useMemo(() => {
    if (exceededLimits.length === 0 || selectedType !== "expense") return null;
    const periodMap: Record<string, string> = {
      Day: t("settings.daily"),
      Week: t("settings.weekly"),
      Month: t("settings.monthly"),
      Quarter: t("settings.quarterly"),
      Year: t("settings.yearly"),
    };
    const parts = exceededLimits.map(
      (l) =>
        `${periodMap[l.period] || l.period} (${l.limit_amount.toLocaleString("vi-VN")} ${l.currency_code})`
    );
    return t("transaction.limit_exceeded_warning", {
      periods: parts.join(", "),
      defaultValue: `Vượt hạn mức: ${parts.join(", ")}`,
    });
  }, [exceededLimits, t, selectedType]);

  // Process autofill data from params
  useEffect(() => {
    if (params.autofillData) {
      try {
        const autofillData: AutofillData =
          typeof params.autofillData === "string"
            ? JSON.parse(params.autofillData as string)
            : (params.autofillData as unknown as AutofillData);

        if (autofillData.type) setSelectedType(autofillData.type);
        if (autofillData.walletId !== undefined) {
          setSourceWalletId(autofillData.walletId);
        }
        if (autofillData.category) {
          const rawName = autofillData.category.category_name;
          let resolvedName = rawName;
          try {
            const parsed = JSON.parse(rawName);
            if (parsed && typeof parsed === "object") {
              resolvedName = parsed[i18n.language] || parsed.vi || parsed.en || rawName;
            }
          } catch { /* not JSON — use rawName as-is */ }
          setSelectedCategoryData({
            ...autofillData.category,
            category_name: resolvedName,
          });
        }
        if (autofillData.amount !== undefined) setAmount(String(autofillData.amount));

        if (autofillData.date) {
          const date =
            typeof autofillData.date === "string"
              ? new Date(autofillData.date)
              : autofillData.date;
          if (date instanceof Date && !isNaN(date.getTime())) {
            setSelectedDate(date);
          }
        }

        if (autofillData.note) setNote(autofillData.note);

        if (autofillData.currency) {
          setInputCurrency(autofillData.currency);
          hasManuallySelectedCurrencyRef.current = true;
        }

        if (autofillData.event) {
          setSelectedEvent(autofillData.event);
          setSourceEventId(autofillData.event.eventId);
        }

        if (autofillData.location) setLocation(autofillData.location);
        if (autofillData.loan) setSelectedLoan(autofillData.loan);

        if (autofillData.reminderDate) {
          const reminder =
            typeof autofillData.reminderDate === "string"
              ? new Date(autofillData.reminderDate)
              : autofillData.reminderDate;
          if (reminder instanceof Date && !isNaN(reminder.getTime())) {
            setReminderDate(reminder);
          }
        }

        if (autofillData.images && autofillData.images.length > 0) {
          setImageUri(autofillData.images[0]);
          setUploadedImageUrl(autofillData.images[0]);
        }

        if (autofillData.participants) {
          setParticipants(autofillData.participants);
        }

        if (autofillData.includeInReport !== undefined) {
          setIncludeInReport(autofillData.includeInReport);
        }
      } catch (error) {
        console.error("[AddTransaction] Failed to parse autofill data:", error);
      }
    }
  }, [params.autofillData]);

  const contractNumberRef = useRef(appInfo?.contract_number);
  contractNumberRef.current = appInfo?.contract_number;

  useFocusEffect(
    useCallback(() => {
      if (contractNumberRef.current) {
        fetchAdvancedLimits(contractNumberRef.current);
      }
    }, [])
  );

  const runLimitCheck = useCallback(
    (numAmount: number, currencyId: string, walletId?: number | null, categoryCode?: string | null) => {
      const exceeded = checkTransactionLimit(numAmount, currencyId, convert, walletId, categoryCode);
      setExceededLimits(exceeded);
    },
    [checkTransactionLimit, convert]
  );

  const handleAmountChange = useCallback(
    (text: string) => {
      setAmount(text);

      // Clear warning ngay khi xóa hết
      if (!text || text === "0") {
        setExceededLimits([]);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const numAmount = parseFloat(text.replace(/,/g, ""));
        if (isNaN(numAmount)) {
          setExceededLimits([]);
          return;
        }
        runLimitCheck(numAmount, inputCurrency.currencyId, sourceWalletId, selectedCategoryData?.category_code);
      }, 600);
    },
    [runLimitCheck, inputCurrency.currencyId]
  );

  // Re-check khi đổi currency
  useEffect(() => {
    if (!amount || amount === "0") return;
    const numAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(numAmount)) return;
    runLimitCheck(numAmount, inputCurrency.currencyId, sourceWalletId, selectedCategoryData?.category_code);
  }, [inputCurrency.currencyId, sourceWalletId, selectedCategoryData?.category_code]);

  useEffect(() => {
    if (prevWalletIdRef.current !== null && sourceWalletId !== prevWalletIdRef.current) {
      setSelectedCategoryData(null);
    }
    prevWalletIdRef.current = sourceWalletId;
  }, [sourceWalletId]);

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


  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const storedWallet = await StorageService.getItem(
            STORAGE_KEY.TEMP_WALLET_STORAGE,
          );
          if (storedWallet) {
            const { walletId } = JSON.parse(storedWallet);
            setSourceWalletId(walletId);
            hasManuallySelectedCurrencyRef.current = false;
            await StorageService.removeItem(STORAGE_KEY.TEMP_WALLET_STORAGE);
          }

          const storedCategory = await StorageService.getItem(
            STORAGE_KEY.TEMP_CATEGORY_STORAGE,
          );
          if (storedCategory) {
            const categoryData: SelectedCategoryData = JSON.parse(storedCategory);
            setSelectedCategoryData(categoryData);

            const typeMap = {
              INCOME: "income",
              EXPENSE: "expense",
              LOAN: "inout",
            } as const;

            const groupKey = categoryData.category_group || categoryData.category_type;
            if (groupKey && typeMap[groupKey as keyof typeof typeMap]) {
              setSelectedType(typeMap[groupKey as keyof typeof typeMap]);
            }

            await StorageService.removeItem(STORAGE_KEY.TEMP_CATEGORY_STORAGE);
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

          const storedParticipants = await StorageService.getItem(
            STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE,
          );
          if (storedParticipants) {
            const data = JSON.parse(storedParticipants);
            if (data.sessionId === sessionIdRef.current) {
              setParticipants(data.participants);
            } else {
              await StorageService.removeItem(STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE);
            }
          }

          const storedLocation = await StorageService.getItem(
            STORAGE_KEY.TEMP_LOCATION_STORAGE,
          );
          if (storedLocation) {
            const data = JSON.parse(storedLocation);
            if (data.sessionId === sessionIdRef.current) {
              setLocation(data.locationData.address || data.locationData.name || "");
            } else {
              await StorageService.removeItem(STORAGE_KEY.TEMP_LOCATION_STORAGE);
            }
          }

          const storedEvent = await StorageService.getItem(
            STORAGE_KEY.TEMP_EVENT_STORAGE,
          );
          if (storedEvent) {
            const eventData: SelectedEvent = JSON.parse(storedEvent);
            setSelectedEvent(eventData);
            setSourceEventId(eventData.eventId);
            await StorageService.removeItem(STORAGE_KEY.TEMP_EVENT_STORAGE);
          }
        } catch (error) {
          console.error("[AddTransaction] Load data failed:", error);
        }
      };
      loadData();
    }, []),
  );

  const handleTypeChange = (newType: TransactionType) => {
    setSelectedType(newType);
    setSelectedLoan(null);

    if (selectedCategoryData) {
      const typeMap = {
        income: "INCOME",
        expense: "EXPENSE",
        inout: "LOAN",
      } as const;

      const categoryGroup = selectedCategoryData.category_group || selectedCategoryData.category_type;
      if (categoryGroup !== typeMap[newType]) {
        setSelectedCategoryData(null);
      }
    }
  };

  const handleOpenLoanPicker = useCallback(async () => {
    setShowLoanPicker(true);
    if (loanList.length === 0) {
      setLoadingLoans(true);
      try {
        const loans = await getLoans();
        setLoanList(loans);
      } finally {
        setLoadingLoans(false);
      }
    }
  }, [getLoans, loanList.length]);

  const handlePickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return alert(t("transaction.camera_permission_error"));

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      if (asset.width && asset.height) {
        setImageRatio(asset.width / asset.height);
      }

      // Upload ngay khi chọn xong
      setIsUploadingImage(true);
      try {
        const userCode = appInfo?.user_code || "";
        const uploadRes = await apiService.uploadImage(
          asset.uri,
          "transactions",
          userCode,
          false // Tắt loading toàn màn hình để hiện loading tại chỗ
        );

        const url = uploadRes?.file_url || uploadRes?.data?.file_url;
        if (url) {
          setUploadedImageUrl(url);
        }
      } catch (error) {
        console.error("[AddTransaction] Upload image failed:", error);
        showNotification(t("transaction.upload_error", { defaultValue: "Lỗi khi tải ảnh lên" }), "error");
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const onDateChange = (date: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const onReminderChange = (date: Date) => {
    setShowReminderPicker(false);
    if (date) {
      setReminderDate(date);
    }
  };

  const openReminderPicker = () => {
    setShowReminderPicker(true);
  };

  const clearReminder = () => {
    setReminderDate(null);
    setShowReminderPicker(false);
  };

  const handleCreate = async () => {
    if (!isValid) return;

    // Ngăn lưu nếu đang upload dở
    if (isUploadingImage) {
      showNotification(t("transaction.uploading_wait", { defaultValue: "Vui lòng đợi ảnh upload xong" }), "warning");
      return;
    }

    try {
      const finalAmount = walletConversionNeeded
        ? walletConvertedAmount
        : parseFloat(amount.replace(/,/g, ""));

      const participantsData = participants.map((p) => {
        const baseData = {
          display_name: p.name,
          phone: p.phoneNumber || "",
          avatar_url: "",
          counterparty_type: 1,
          is_favorite: false,
        };

        if (p.isFromServer && p.id) {
          return { id: parseInt(p.id), ...baseData };
        }

        return baseData;
      });

      await createTransaction({
        walletId: sourceWalletId ?? 0,
        type: selectedType,
        amount: finalAmount || 0,
        currency: walletCurrency.currencyId,
        categoryId: selectedCategoryData?.id || 0,
        categoryCode: selectedCategoryData?.category_code,
        eventId: sourceEventId,
        loanId: selectedLoan ? ((selectedLoan as any).id ?? parseInt(selectedLoan.loan_id, 10)) : null,
        description: note,
        location: location,
        recordedAt: selectedDate,
        reminderAt: reminderDate,
        isCalculateReport: includeInReport,
        images: uploadedImageUrl ? [uploadedImageUrl] : [],
        participants: participantsData,
        isLoanForFund: borrowToPayExpense,
        categoryGroup: selectedCategoryData?.category_group,
      });
      await refresh();
      await clearTempData();
      router.back();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : t("transaction.create_error"),
        "error",
      );
    }
  };

  const handleCancel = () => {
    clearTempData();
    router.back();
  };

  const clearTempData = async () => {
    try {
      await Promise.all([
        StorageService.removeItem(STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE),
        StorageService.removeItem(STORAGE_KEY.TEMP_LOCATION_STORAGE),
      ]);
    } catch (error) {
      console.error("[AddTransaction] Failed to clear temp data:", error);
    }
  };

  const parseCategoryNameJSON = (nameJson: string) => {
    try {
      const parsed = JSON.parse(nameJson);
      if (parsed && typeof parsed === "object") {
        return parsed[i18n.language] || parsed.vi || parsed.en || nameJson;
      }
      return nameJson || t("transaction.select_category");
    } catch {
      return nameJson || t("transaction.select_category");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  const getInitials = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (index: number) => {
    const avatarColors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
    ];
    return avatarColors[index % avatarColors.length];
  };

  const renderParticipants = () => {
    if (participants.length === 0) {
      return (
        <CustomText style={[styles.placeholderText, { color: colors.icon }]}>
          {t("transaction.select_participants")}
        </CustomText>
      );
    }

    const displayParticipants = participants.slice(0, 3);
    const remainingCount = participants.length - 3;

    return (
      <View style={styles.participantsContainer}>
        <View style={styles.participantAvatars}>
          {displayParticipants.map((participant, index) => (
            <View
              key={participant.id}
              style={[
                styles.participantAvatar,
                {
                  backgroundColor: participant.avatarColor || getAvatarColor(index),
                  borderColor: colors.card,
                  zIndex: displayParticipants.length - index,
                },
              ]}
            >
              <CustomText style={styles.participantInitials}>
                {getInitials(participant.name)}
              </CustomText>
            </View>
          ))}
          {remainingCount > 0 && (
            <View
              style={[
                styles.participantAvatar,
                {
                  backgroundColor: colors.border,
                  borderColor: colors.card,
                  zIndex: 0,
                },
              ]}
            >
              <CustomText style={[styles.participantInitials, { color: colors.text }]}>
                +{remainingCount}
              </CustomText>
            </View>
          )}
        </View>
        <CustomText style={[styles.participantCount, { color: colors.text }]}>
          {participants.length} {t("transaction.participants_count")}
        </CustomText>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <AppHeader title={t("transaction.add_transaction")} />

        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selector */}
          <View style={styles.section}>
            <View style={styles.typeContainer}>
              {[
                { type: "income" as const, label: t("transaction.type_income") },
                { type: "expense" as const, label: t("transaction.type_expense") },
                { type: "inout" as const, label: t("transaction.type_debt_loan") },
              ].map(({ type, label }) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: selectedType === type ? colors.tint : colors.card,
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
                        fontFamily: selectedType === type ? Fonts.semiBold : Fonts.regular,
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
              {t("transaction.source_wallet")} <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={[
                styles.field,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push("/(protected)/wallet/wallet-list?mode=select")}
            >
              <View style={styles.fieldLeft}>
                <AppIcon
                  name={(selectedWallet?.icon as any) || "wallet"}
                  size={normalize(18)}
                  color={selectedWallet?.color || colors.icon}
                />
                <CustomText style={[styles.fieldText, { color: colors.text }]}>
                  {selectedWallet?.name || t("transaction.select_wallet")}
                </CustomText>
              </View>
            </TouchableOpacity>
          </View>

          {/* Category - REQUIRED */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("transaction.category")} <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={[
                styles.field,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: sourceWalletId ? 1 : 0.6,
                },
              ]}
              onPress={() => {
                if (!sourceWalletId) {
                  showNotification(
                    t("transaction.please_select_wallet_first", {
                      defaultValue: "Vui lòng chọn ví trước khi chọn hạng mục",
                    }),
                    "warning",
                  );
                  return;
                }
                router.push({
                  pathname: "/(protected)/select-category",
                  params: { selectedType, walletId: sourceWalletId },
                });
              }}
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
                      <AppIcon
                        name={selectedCategoryData.icon as any}
                        size={normalize(18)}
                        color="#fff"
                      />
                    </View>
                    <CustomText style={[styles.fieldText, { color: colors.text }]}>
                      {parseCategoryNameJSON(selectedCategoryData.category_name)}
                    </CustomText>
                  </>
                ) : (
                  <>
                    <View style={[styles.categoryIcon, { backgroundColor: colors.border }]} />
                    <CustomText style={[styles.fieldText, { color: colors.icon }]}>
                      {t("transaction.select_category")}
                    </CustomText>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Loan Selector - chỉ hiện khi LOAN + LOAN_COLLECT/LOAN_REPAY */}
          {isLoanCategory && (
            <View style={styles.section}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                {t("transaction.select_paybook", { defaultValue: "Sổ nợ" })}
              </CustomText>
              <TouchableOpacity
                style={[
                  styles.field,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={handleOpenLoanPicker}
              >
                <View style={styles.fieldLeft}>
                  <AppIcon
                    name="book"
                    size={normalize(18)}
                    color={selectedLoan ? colors.tint : colors.icon}
                  />
                  <CustomText
                    style={[
                      styles.fieldText,
                      { color: selectedLoan ? colors.text : colors.icon },
                    ]}
                  >
                    {selectedLoan
                      ? `${selectedLoan.counterparty_name} — ${selectedLoan.remaining_amount?.toLocaleString("vi-VN")} ${selectedLoan.currency_code}`
                      : t("transaction.select_paybook_placeholder", { defaultValue: "Chọn sổ nợ" })}
                  </CustomText>
                </View>
                {selectedLoan && (
                  <TouchableOpacity
                    onPress={() => setSelectedLoan(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <AppIcon name="xmark" size={normalize(14)} color={colors.icon} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TransactionAmountInput
            amount={amount}
            onAmountChange={handleAmountChange}
            inputCurrency={inputCurrency}
            walletCurrency={{
              currencyId: defaultCurrency.currencyId,
              symbol: defaultCurrency.symbol,
            }}
            onCurrencyPress={() => {
              hasManuallySelectedCurrencyRef.current = true;
              router.push("/(protected)/select-currency");
            }}
            hasExceededLimit={exceededLimits.length > 0}
            exceededLabel={exceededLabel}
            selectedType={selectedType}
          />

          {/* Event - Optional */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("settings.event")}
            </CustomText>
            <TouchableOpacity
              style={[
                styles.field,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/(protected)/event/event-list",
                  params: { mode: "select" },
                })
              }
            >
              <View style={styles.fieldLeft}>
                {selectedEvent ? (
                  <>
                    <View
                      style={[styles.categoryIcon, { backgroundColor: selectedEvent.color }]}
                    >
                      <AppIcon
                        name={selectedEvent.icon as any}
                        size={normalize(18)}
                        color="#fff"
                      />
                    </View>
                    <CustomText style={[styles.fieldText, { color: colors.text }]}>
                      {selectedEvent.eventName}
                    </CustomText>
                  </>
                ) : (
                  <>
                    <View style={[styles.categoryIcon, { backgroundColor: colors.border }]} />
                    <CustomText style={[styles.fieldText, { color: colors.icon }]}>
                      {t("transaction.select_event_optional", { defaultValue: "Select Event (Optional)" })}
                    </CustomText>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Participants - Optional */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("transaction.participants")}
            </CustomText>
            <TouchableOpacity
              style={[
                styles.field,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/(protected)/select-participants",
                  params: { sessionId: sessionIdRef.current },
                })
              }
            >
              <View style={styles.fieldLeft}>
                <AppIcon
                  name="user-group"
                  size={normalize(18)}
                  color={participants.length > 0 ? colors.tint : colors.icon}
                />
                {renderParticipants()}
              </View>
            </TouchableOpacity>
          </View>

          {/* Location - Optional */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("transaction.location")}
            </CustomText>
            <View style={styles.locationContainer}>
              <TextInput
                style={[
                  styles.locationInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder={t("transaction.location_placeholder", { defaultValue: "Input location (Optional)" })}
                placeholderTextColor={colors.icon}
                value={location}
                onChangeText={setLocation}
              />
              <TouchableOpacity
                style={[
                  styles.mapButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/(protected)/select-location",
                    params: { sessionId: sessionIdRef.current },
                  })
                }
              >
                <AppIcon
                  name="location-dot"
                  size={normalize(20)}
                  color={location ? colors.tint : colors.icon}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Note - Optional */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("transaction.note")}
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
              placeholder={t("transaction.note_placeholder_optional", { defaultValue: "Add note (Optional)" })}
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
              {t("transaction.date")}
            </CustomText>
            <TouchableOpacity
              style={[
                styles.field,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.fieldLeft}>
                <AppIcon
                  name="calendar-days"
                  size={normalize(18)}
                  color={colors.tint}
                />
                <CustomText style={[styles.fieldText, { color: colors.text }]}>
                  {formatDate(selectedDate)}
                </CustomText>
              </View>
            </TouchableOpacity>
          </View>

          {/* Reminder */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("transaction.reminder")}
            </CustomText>
            <TouchableOpacity
              style={[
                styles.field,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={openReminderPicker}
            >
              <View style={styles.fieldLeft}>
                <AppIcon
                  name="bell"
                  size={normalize(18)}
                  color={reminderDate ? colors.tint : colors.icon}
                />
                <CustomText
                  style={[
                    styles.fieldText,
                    { color: reminderDate ? colors.text : colors.icon },
                  ]}
                >
                  {reminderDate
                    ? formatDateTime(reminderDate)
                    : t("transaction.set_reminder_optional", { defaultValue: "Set Reminder (Optional)" })}
                </CustomText>
              </View>
              {reminderDate && (
                <TouchableOpacity onPress={clearReminder}>
                  <AppIcon name="xmark" size={normalize(16)} color={colors.icon} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* Image Upload - Optional */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("transaction.image")}
            </CustomText>
            {imageUri ? (
              <View
                style={[
                  styles.imageContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={[
                    styles.image,
                    imageRatio ? { aspectRatio: imageRatio, height: undefined, maxHeight: normalize(300) } : {}
                  ]}
                  resizeMode="contain"
                />

                {isUploadingImage && (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }]}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.removeBtn, { backgroundColor: colors.background }]}
                  onPress={() => {
                    setImageUri(null);
                    setUploadedImageUrl(null);
                    setIsUploadingImage(false);
                  }}
                >
                  <AppIcon name="xmark" size={normalize(12)} color={colors.text} />
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
                <AppIcon name="image" size={normalize(32)} color={colors.icon} />
                <CustomText style={[styles.uploadText, { color: colors.icon }]}>
                  {t("transaction.upload", { defaultValue: "Upload" })}
                </CustomText>
              </TouchableOpacity>
            )}
          </View>

          {/* Borrow to Pay Toggle - Temporarily Hidden */}
          {/* <View style={[styles.toggle, { backgroundColor: colors.card }]}>
            <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
              {t("transaction.borrow_to_pay")}
            </CustomText>
            <Switch
              value={borrowToPayExpense}
              onValueChange={setBorrowToPayExpense}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#fff"
            />
          </View> */}

          {/* Include in Report Toggle */}
          <View style={[styles.toggle, { backgroundColor: colors.card }]}>
            <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
              {t("transaction.include_in_report", { defaultValue: "Include in report" })}
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

        {/* Date Picker Modal */}
        <DatePicker
          modal
          open={showDatePicker}
          date={selectedDate}
          mode="date"
          theme={isDark ? "dark" : "light"}
          buttonColor={colors.tint}
          dividerColor={colors.tint}
          confirmText={t("common.confirm")}
          cancelText={t("common.cancel")}
          title={t("transaction.date")}
          onConfirm={onDateChange}
          onCancel={() => setShowDatePicker(false)}
          maximumDate={new Date(2100, 11, 31)}
          minimumDate={new Date(2000, 0, 1)}
        />

        {/* Reminder Picker Modal */}
        <DatePicker
          modal
          open={showReminderPicker}
          date={reminderDate || new Date()}
          mode="datetime"
          theme={isDark ? "dark" : "light"}
          buttonColor={colors.tint}
          dividerColor={colors.tint}
          confirmText={t("common.confirm")}
          cancelText={t("common.cancel")}
          title={t("transaction.reminder")}
          onConfirm={onReminderChange}
          onCancel={() => setShowReminderPicker(false)}
          minimumDate={new Date()}
        />

        {/* Loan Picker Modal */}
        <Modal
          visible={showLoanPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLoanPicker(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.45)",
              justifyContent: "flex-end",
            }}
            activeOpacity={1}
            onPress={() => setShowLoanPicker(false)}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: normalize(20),
                borderTopRightRadius: normalize(20),
                paddingTop: normalize(12),
                maxHeight: "65%",
              }}
            >
              {/* Handle */}
              <View
                style={{
                  width: normalize(40),
                  height: normalize(4),
                  borderRadius: normalize(2),
                  backgroundColor: colors.border,
                  alignSelf: "center",
                  marginBottom: normalize(12),
                }}
              />

              <CustomText
                style={{
                  fontSize: normalize(16),
                  fontFamily: Fonts.semiBold,
                  color: colors.text,
                  paddingHorizontal: normalize(20),
                  marginBottom: normalize(12),
                }}
              >
                {t("transaction.select_paybook", { defaultValue: "Chọn sổ nợ" })}
              </CustomText>

              {loadingLoans ? (
                <View style={{ padding: normalize(32), alignItems: "center" }}>
                  <ActivityIndicator size="large" color={colors.tint} />
                </View>
              ) : filteredLoanList.length === 0 ? (
                <View style={{ padding: normalize(32), alignItems: "center" }}>
                  <CustomText style={{ color: colors.icon, textAlign: "center" }}>
                    {loanList.length === 0
                      ? t("transaction.no_paybook", { defaultValue: "Không có sổ nợ nào" })
                      : selectedCategoryData?.category_type === "LOAN_COLLECT"
                        ? "Không có khoản cho vay nào phù hợp"
                        : "Không có khoản vay nào phù hợp"}
                  </CustomText>
                </View>
              ) : (
                <FlatList
                  data={filteredLoanList}
                  keyExtractor={(item) => item.loan_id}
                  contentContainerStyle={{ paddingHorizontal: normalize(16), paddingBottom: normalize(32) }}
                  ItemSeparatorComponent={() => (
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                  )}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: normalize(14),
                        gap: normalize(12),
                      }}
                      onPress={() => {
                        setSelectedLoan(item);
                        setShowLoanPicker(false);
                      }}
                    >
                      <View
                        style={{
                          width: normalize(44),
                          height: normalize(44),
                          borderRadius: normalize(12),
                          backgroundColor:
                            item.loan_type === "LEND" ? "#4CAF5022" : "#F4433622",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AppIcon
                          name={item.loan_type === "LEND" ? "hand-holding-dollar" : "money-bill-wave"}
                          size={normalize(18)}
                          color={item.loan_type === "LEND" ? "#4CAF50" : "#F44336"}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <CustomText
                          style={{
                            fontSize: normalize(15),
                            fontFamily: Fonts.semiBold,
                            color: colors.text,
                          }}
                        >
                          {item.counterparty_name}
                        </CustomText>
                        <CustomText
                          style={{ fontSize: normalize(13), color: colors.icon, marginTop: normalize(2) }}
                        >
                          {item.loan_type === "LEND"
                            ? t("transaction.loan_type_lend", { defaultValue: "Cho vay" })
                            : t("transaction.loan_type_borrow", { defaultValue: "Vay" })}
                          {" • "}
                          {item.remaining_amount?.toLocaleString("vi-VN")} {item.currency_code}
                        </CustomText>
                      </View>
                      {selectedLoan?.loan_id === item.loan_id && (
                        <AppIcon name="check" size={normalize(16)} color={colors.tint} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Bottom Buttons */}
        <View
          style={[
            styles.bottomBar,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.tint }]}
            onPress={handleCancel}
            disabled={creatingTransaction}
          >
            <CustomText style={[styles.cancelText, { color: colors.tint }]}>
              {t("common.cancel")}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.createBtn,
              {
                backgroundColor:
                  isValid && !creatingTransaction ? colors.tint : colors.border,
              },
            ]}
            onPress={handleCreate}
            disabled={!isValid || creatingTransaction}
          >
            {creatingTransaction ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <CustomText style={styles.createText}>{t("transaction.save")}</CustomText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddTransactionScreen;
