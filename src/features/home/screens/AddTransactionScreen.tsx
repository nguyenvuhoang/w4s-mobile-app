import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import STORAGE_KEY from "@/constants/StorageKey";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { styles } from "@/features/home/styles/AddTransactionScreen.Styles";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import StorageService from "@/services/StorageService";
import { hp, normalize } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

interface Participant {
  id: string;
  name: string;
  phoneNumber?: string;
  avatarColor?: string;
}

interface SelectedEvent {
  eventId: number;
  eventName: string;
  icon: string;
  color: string;
}

type TransactionType = "income" | "expense" | "inout";

const AddTransactionScreen = () => {
  const { colors } = useAppTheme();
  const { wallets, defaultWallet } = useWallet();
  const { currencies, parseCurrencyName } = useCurrency({ autoFetch: true });
  const { convert } = useExchangeRate();

  const [selectedType, setSelectedType] = useState<TransactionType>("expense");
  const [sourceWalletId, setSourceWalletId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(
    null
  );
  const [sourceEventId, setSourceEventId] = useState<string | null>(null);
  const [selectedCategoryData, setSelectedCategoryData] =
    useState<SelectedCategoryData | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [includeInReport, setIncludeInReport] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [location, setLocation] = useState("");

  // Session ID để track transaction creation session
  const sessionIdRef = useRef<string>(Date.now().toString());

  const [inputCurrency, setInputCurrency] = useState<SelectedCurrency>({
    currencyId: "VND",
    symbol: "đ",
    name: "Việt Nam Đồng",
  });

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

    const currency = currencies.find(
      (c) => c.currency_id === selectedWallet.currency
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
    [inputCurrency.currencyId, walletCurrency.currencyId]
  );

  const exchangeRate = useMemo(() => {
    if (!needsConversion) return null;

    const rate = convert(
      1,
      inputCurrency.currencyId,
      walletCurrency.currencyId
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
      walletCurrency.currencyId
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

  const isValid =
    selectedWallet && selectedCategoryData && amount.trim() !== "";

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
          const storedWallet = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_WALLET_STORAGE
          );
          if (storedWallet) {
            const { walletId } = JSON.parse(storedWallet);
            setSourceWalletId(walletId);
            hasManuallySelectedCurrencyRef.current = false;
            await StorageService.removeAsyncItem(
              STORAGE_KEY.TEMP_WALLET_STORAGE
            );
          }

          const storedCategory = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_CATEGORY_STORAGE
          );
          if (storedCategory) {
            const categoryData: SelectedCategoryData =
              JSON.parse(storedCategory);
            setSelectedCategoryData(categoryData);

            const typeMap = {
              INCOME: "income",
              EXPENSE: "expense",
              LOAN: "inout",
            } as const;
            setSelectedType(typeMap[categoryData.category_type]);

            await StorageService.removeAsyncItem(
              STORAGE_KEY.TEMP_CATEGORY_STORAGE
            );
          }

          const storedCurrency = await StorageService.getItem(
            STORAGE_KEY.TEMP_CURRENCY_STORAGE
          );
          if (storedCurrency) {
            const currency: SelectedCurrency = JSON.parse(storedCurrency);
            setInputCurrency(currency);
            hasManuallySelectedCurrencyRef.current = true;
            await StorageService.removeItem(STORAGE_KEY.TEMP_CURRENCY_STORAGE);
          }

          // Load participants với session ID
          const storedParticipants = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE
          );
          if (storedParticipants) {
            const data = JSON.parse(storedParticipants);
            // Chỉ load nếu cùng session
            if (data.sessionId === sessionIdRef.current) {
              setParticipants(data.participants);
            } else {
              await StorageService.removeAsyncItem(
                STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE
              );
            }
          }

          // Load location với session ID
          const storedLocation = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_LOCATION_STORAGE
          );
          if (storedLocation) {
            const data = JSON.parse(storedLocation);
            // Chỉ load nếu cùng session
            if (data.sessionId === sessionIdRef.current) {
              setLocation(
                data.locationData.address || data.locationData.name || ""
              );
            } else {
              await StorageService.removeAsyncItem(
                STORAGE_KEY.TEMP_LOCATION_STORAGE
              );
            }
          }

          const storedEvent = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_EVENT_STORAGE
          );

          if (storedEvent) {
            const eventData: SelectedEvent = JSON.parse(storedEvent);

            setSelectedEvent(eventData);
            setSourceEventId(eventData.eventId.toString());

            await StorageService.removeAsyncItem(
              STORAGE_KEY.TEMP_EVENT_STORAGE
            );
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

    const finalAmount = needsConversion
      ? convertedAmount
      : parseFloat(amount.replace(/,/g, ""));

    console.log("Create transaction", {
      type: selectedType,
      sourceWalletId,
      category: selectedCategoryData,
      amount: finalAmount,
      originalAmount: parseFloat(amount.replace(/,/g, "")),
      inputCurrency: inputCurrency.currencyId,
      walletCurrency: walletCurrency.currencyId,
      eventId: sourceEventId,
      note,
      date: selectedDate,
      imageUri,
      includeInReport,
      participants,
      location,
    });

    // Xóa temp data sau khi tạo thành công
    clearTempData();
    router.back();
  };

  const handleCancel = () => {
    // Xóa temp data khi user hủy
    clearTempData();
    router.back();
  };

  const clearTempData = async () => {
    try {
      await Promise.all([
        StorageService.removeAsyncItem(STORAGE_KEY.TEMP_PARTICIPANTS_STORAGE),
        StorageService.removeAsyncItem(STORAGE_KEY.TEMP_LOCATION_STORAGE),
      ]);
    } catch (error) {
      console.error("[AddTransaction] Failed to clear temp data:", error);
    }
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
    if (
      walletCurrency.currencyId === "VND" ||
      walletCurrency.currencyId === "VNĐ"
    ) {
      return Math.round(amount).toLocaleString("vi-VN");
    }
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatExchangeRate = (rate: number) => {
    if (
      walletCurrency.currencyId === "VND" ||
      walletCurrency.currencyId === "VNĐ"
    ) {
      return Math.round(rate).toLocaleString("vi-VN");
    }
    return rate.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
    ];
    return colors[index % colors.length];
  };

  const renderParticipants = () => {
    if (participants.length === 0) {
      return (
        <CustomText style={[styles.placeholderText, { color: colors.icon }]}>
          Chọn người tham gia
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
                  backgroundColor:
                    participant.avatarColor || getAvatarColor(index),
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
              <CustomText
                style={[styles.participantInitials, { color: colors.text }]}
              >
                +{remainingCount}
              </CustomText>
            </View>
          )}
        </View>
        <CustomText style={[styles.participantCount, { color: colors.text }]}>
          {participants.length} người
        </CustomText>
      </View>
    );
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
                      {parseCategoryNameJSON(
                        selectedCategoryData.category_name
                      )}
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
            {needsConversion &&
              convertedAmount !== null &&
              exchangeRate !== null && (
                <View style={styles.conversionContainer}>
                  <FontAwesome6
                    name="arrow-right-arrow-left"
                    size={normalize(12)}
                    color={colors.icon}
                  />
                  <View style={styles.conversionTextContainer}>
                    <CustomText
                      style={[styles.conversionText, { color: colors.icon }]}
                    >
                      ≈ {walletCurrency.symbol}{" "}
                      {formatConvertedAmount(convertedAmount)}
                      <CustomText
                        style={{ fontSize: normalize(11), opacity: 0.7 }}
                      >
                        {" "}
                        ({walletCurrency.currencyId})
                      </CustomText>
                    </CustomText>
                    <CustomText
                      style={[styles.exchangeRateText, { color: colors.icon }]}
                    >
                      1 {inputCurrency.currencyId} ={" "}
                      {formatExchangeRate(exchangeRate)}{" "}
                      {walletCurrency.currencyId}
                    </CustomText>
                  </View>
                </View>
              )}
          </View>
          {/* Event - Optional */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Sự kiện
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
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: selectedEvent.color },
                      ]}
                    >
                      <FontAwesome6
                        name={selectedEvent.icon as any}
                        size={normalize(18)}
                        color="#fff"
                      />
                    </View>
                    <CustomText
                      style={[styles.fieldText, { color: colors.text }]}
                    >
                      {selectedEvent.eventName}
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
                      Chọn sự kiện (tuỳ chọn)
                    </CustomText>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Participants - Optional */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Người tham gia
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
                <FontAwesome6
                  name="user-group"
                  size={normalize(18)}
                  color={participants.length > 0 ? colors.tint : colors.icon}
                  solid
                />
                {renderParticipants()}
              </View>
            </TouchableOpacity>
          </View>

          {/* Location - Optional */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Địa điểm
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
                placeholder="Nhập địa điểm (tùy chọn)"
                placeholderTextColor={colors.icon}
                value={location}
                onChangeText={setLocation}
              />
              <TouchableOpacity
                style={[
                  styles.mapButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/(protected)/select-location",
                    params: { sessionId: sessionIdRef.current },
                  })
                }
              >
                <FontAwesome6
                  name="location-dot"
                  size={normalize(20)}
                  color={location ? colors.tint : colors.icon}
                  solid
                />
              </TouchableOpacity>
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
            onPress={handleCancel}
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

export default AddTransactionScreen;
