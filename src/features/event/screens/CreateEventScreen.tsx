import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import STORAGE_KEY from "@/constants/StorageKey";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import { useDefaultCurrency } from "@/hooks/useDefaultCurrency";
import { eventRepository } from "@/services/repositories/event.repository";
import StorageService from "@/services/StorageService";
import { WalletSummary } from "@/types/wallet";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import { useEvent } from "../hooks/useEvent";

// Interface for autofill data
interface AutofillData {
  icon?: string;
  color?: string;
  eventName?: string;
  walletId?: number;
  currency?: {
    currencyId: string;
    symbol: string;
    name: string;
  };
  endDate?: string | Date;
}

const CreateEventScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();
  const { wallets } = useWallet();
  const { refetch } = useEvent();
  const { defaultCurrency, loading: loadingDefaultCurrency } =
    useDefaultCurrency();

  // Form state
  const [icon, setIcon] = useState("calendar");
  const [color, setColor] = useState("#FF9800");
  const [eventName, setEventName] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(
    null
  );
  const [currency, setCurrency] = useState("VND");
  const [currencySymbol, setCurrencySymbol] = useState("đ");
  const [currencyName, setCurrencyName] = useState("Vietnamese Dong");
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [creating, setCreating] = useState(false);

  // Process autofill data from params
  useEffect(() => {
    if (params.autofillData) {
      try {
        const autofillData: AutofillData =
          typeof params.autofillData === "string"
            ? JSON.parse(params.autofillData as string)
            : (params.autofillData as unknown as AutofillData);

        console.log("[CreateEvent] Autofill data:", autofillData);

        // Autofill icon
        if (autofillData.icon) {
          setIcon(autofillData.icon);
        }

        // Autofill color
        if (autofillData.color) {
          setColor(autofillData.color);
        }

        // Autofill eventName
        if (autofillData.eventName) {
          setEventName(autofillData.eventName);
        }

        // Autofill wallet
        if (autofillData.walletId !== undefined) {
          const wallet = wallets.find((w) => w.walletId === autofillData.walletId);
          if (wallet) {
            setSelectedWallet(wallet);
          }
        }

        // Autofill currency
        if (autofillData.currency) {
          setCurrency(autofillData.currency.currencyId);
          setCurrencySymbol(autofillData.currency.symbol);
          setCurrencyName(autofillData.currency.name);
        }

        // Autofill endDate
        if (autofillData.endDate) {
          const date =
            typeof autofillData.endDate === "string"
              ? new Date(autofillData.endDate)
              : autofillData.endDate;
          if (date instanceof Date && !isNaN(date.getTime())) {
            setEndDate(date);
          }
        }
      } catch (error) {
        console.error("[CreateEvent] Failed to parse autofill data:", error);
      }
    }
  }, [params.autofillData, wallets]);

  // Load default currency when component mounts
  useEffect(() => {
    if (!loadingDefaultCurrency && defaultCurrency) {
      console.log("[CreateEvent] Setting default currency:", defaultCurrency);
      setCurrency(defaultCurrency.currencyId);
      setCurrencySymbol(defaultCurrency.symbol);
      setCurrencyName(defaultCurrency.name);
    }
  }, [loadingDefaultCurrency, defaultCurrency]);

  // Load selected data from storage
  useFocusEffect(
    useCallback(() => {
      const loadSelectedData = async () => {
        try {
          // Load selected icon
          const selectedIcon = await StorageService.getItem(
            STORAGE_KEY.TEMP_ICON_STORAGE
          );
          if (selectedIcon) {
            setIcon(selectedIcon);
            await StorageService.removeItem(STORAGE_KEY.TEMP_ICON_STORAGE);
          }

          // Load selected color
          const selectedColor = await StorageService.getItem(
            STORAGE_KEY.TEMP_COLOR_STORAGE
          );
          if (selectedColor) {
            setColor(selectedColor);
            await StorageService.removeItem(STORAGE_KEY.TEMP_COLOR_STORAGE);
          }

          // Load selected wallet
          const walletData = await StorageService.getAsyncItem(
            STORAGE_KEY.TEMP_WALLET_STORAGE
          );
          if (walletData) {
            const { walletId } = JSON.parse(walletData);
            const wallet = wallets.find((w) => w.walletId === walletId);
            if (wallet) {
              setSelectedWallet(wallet);
            }
            await StorageService.removeAsyncItem(
              STORAGE_KEY.TEMP_WALLET_STORAGE
            );
          }

          // Load selected currency
          const selectedCurrencyStr = await StorageService.getItem(
            STORAGE_KEY.TEMP_CURRENCY_STORAGE
          );
          console.log(
            "[CreateEvent] Raw currency from storage:",
            selectedCurrencyStr
          );

          if (selectedCurrencyStr) {
            try {
              const selectedCurrency = JSON.parse(selectedCurrencyStr);
              console.log("[CreateEvent] Parsed currency:", selectedCurrency);

              setCurrency(selectedCurrency.currencyId || "VND");
              setCurrencySymbol(selectedCurrency.symbol || "đ");
              setCurrencyName(selectedCurrency.name || "Vietnamese Dong");

              await StorageService.removeItem(
                STORAGE_KEY.TEMP_CURRENCY_STORAGE
              );
            } catch (parseError) {
              console.error(
                "[CreateEvent] Failed to parse currency:",
                parseError
              );
            }
          }
        } catch (error) {
          console.error("[CreateEvent] Failed to load selected data:", error);
        }
      };

      loadSelectedData();
    }, [wallets])
  );

  const handleCreate = async () => {
    if (!eventName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên sự kiện");
      return;
    }

    if (!selectedWallet) {
      Alert.alert("Lỗi", "Vui lòng chọn nguồn tiền");
      return;
    }

    setCreating(true);

    try {
      const eventData = {
        event_name: eventName.trim(),
        event_icon: icon,
        event_color: color,
        wallet_id: [Number(selectedWallet.walletId)],
        end_date: endDate.toISOString(),
      };

      console.log("[CreateEvent] Creating event:", eventData);

      await eventRepository.createEvent(eventData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await refetch();
      router.back();
      Alert.alert("Thành công", "Đã tạo sự kiện mới");
    } catch (error) {
      console.error("[CreateEvent] Create failed:", error);
      Alert.alert("Lỗi", "Không thể tạo sự kiện. Vui lòng thử lại.");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectIcon = () => {
    router.push({
      pathname: "/(protected)/select-icon",
      params: { color },
    });
  };

  const handleSelectColor = () => {
    router.push({
      pathname: "/(protected)/select-color",
      params: { icon },
    });
  };

  const handleSelectWallet = () => {
    router.push({
      pathname: "/(protected)/wallet/wallet-list",
      params: { mode: "select" },
    });
  };

  const handleSelectCurrency = () => {
    router.push({
      pathname: "/(protected)/select-currency",
      params: {
        selectedCurrencyId: currency,
      },
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Tạo sự kiện" showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon Preview */}
          <View style={styles.iconPreview}>
            <View style={[styles.iconCircle, { backgroundColor: color }]}>
              <FontAwesome6
                name={icon as any}
                size={normalize(40)}
                color="#fff"
              />
            </View>
          </View>

          {/* Icon & Color Selectors */}
          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={[
                styles.selectorCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleSelectIcon}
            >
              <CustomText
                style={[styles.selectorLabel, { color: colors.text }]}
              >
                Icon
              </CustomText>
              <View style={styles.selectorValue}>
                <FontAwesome6
                  name={icon as any}
                  size={normalize(20)}
                  color={colors.text}
                />
                <FontAwesome6
                  name="chevron-right"
                  size={normalize(14)}
                  color={colors.icon}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.selectorCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleSelectColor}
            >
              <CustomText
                style={[styles.selectorLabel, { color: colors.text }]}
              >
                Màu sắc
              </CustomText>
              <View style={styles.selectorValue}>
                <View style={[styles.colorDot, { backgroundColor: color }]} />
                <FontAwesome6
                  name="chevron-right"
                  size={normalize(14)}
                  color={colors.icon}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Event Name */}
          <View style={styles.section}>
            <CustomText
              style={[styles.label, { color: colors.text }]}
              type="semiBold"
            >
              Tên Sự kiện
            </CustomText>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Tổ chức tour"
                placeholderTextColor={colors.icon}
                value={eventName}
                onChangeText={setEventName}
              />
            </View>
          </View>

          {/* Wallet Selection */}
          <View style={styles.section}>
            <CustomText
              style={[styles.label, { color: colors.text }]}
              type="semiBold"
            >
              Nguồn tiền áp dụng
            </CustomText>
            <TouchableOpacity
              style={[
                styles.walletSelector,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleSelectWallet}
            >
              {selectedWallet ? (
                <View style={styles.walletLeft}>
                  <View
                    style={[
                      styles.walletIconWrapper,
                      { backgroundColor: selectedWallet.color },
                    ]}
                  >
                    <FontAwesome6
                      name={selectedWallet.icon as any}
                      size={normalize(20)}
                      color="#fff"
                    />
                  </View>
                  <CustomText
                    style={[styles.walletName, { color: colors.text }]}
                    type="semiBold"
                  >
                    {selectedWallet.name}
                  </CustomText>
                </View>
              ) : (
                <View style={styles.walletLeft}>
                  <View
                    style={[
                      styles.walletIconWrapper,
                      { backgroundColor: colors.tint },
                    ]}
                  >
                    <FontAwesome6
                      name="wallet"
                      size={normalize(20)}
                      color="#fff"
                    />
                  </View>
                  <CustomText
                    style={[styles.walletPlaceholder, { color: colors.icon }]}
                    type="regular"
                  >
                    Chọn nguồn tiền
                  </CustomText>
                </View>
              )}
              <FontAwesome6
                name="chevron-right"
                size={normalize(14)}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Currency Selection */}
          <View style={styles.section}>
            <CustomText
              style={[styles.label, { color: colors.text }]}
              type="semiBold"
            >
              Đơn vị tiền tệ
            </CustomText>
            <TouchableOpacity
              style={[
                styles.currencySelector,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleSelectCurrency}
            >
              <View style={styles.currencyLeft}>
                <View style={styles.currencyIconWrapper}>
                  <CustomText
                    style={[styles.currencySymbolText, { color: colors.tint }]}
                    type="bold"
                  >
                    {currencySymbol}
                  </CustomText>
                </View>
                <View style={styles.currencyInfo}>
                  <CustomText
                    style={[styles.currencyNameText, { color: colors.icon }]}
                    type="regular"
                    numberOfLines={1}
                  >
                    {currencyName}
                  </CustomText>
                  <CustomText
                    style={[styles.currencyCode, { color: colors.text }]}
                    type="semiBold"
                  >
                    {currency}
                  </CustomText>
                </View>
              </View>
              <FontAwesome6
                name="chevron-right"
                size={normalize(14)}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>

          {/* End Date */}
          <View style={styles.section}>
            <CustomText
              style={[styles.label, { color: colors.text }]}
              type="semiBold"
            >
              Ngày kết thúc
            </CustomText>
            <TouchableOpacity
              style={[
                styles.inputContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <CustomText
                style={[styles.input, { color: colors.text }]}
                type="regular"
              >
                {formatDate(endDate)}
              </CustomText>
              <FontAwesome6
                name="calendar"
                size={normalize(18)}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <View style={{ height: hp(2) }} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View
          style={[
            styles.bottomButtons,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={creating}
          >
            <CustomText
              style={[styles.cancelButtonText, { color: colors.text }]}
              type="semiBold"
            >
              Hủy
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: colors.tint,
                opacity:
                  creating || !eventName.trim() || !selectedWallet ? 0.5 : 1,
              },
            ]}
            onPress={handleCreate}
            disabled={creating || !eventName.trim() || !selectedWallet}
          >
            <CustomText style={styles.createButtonText} type="bold">
              {creating ? "Đang tạo..." : "Tạo"}
            </CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  iconPreview: {
    alignItems: "center",
    paddingVertical: hp(3),
  },
  iconCircle: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(24),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  selectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    gap: normalize(12),
    marginTop: hp(1),
  },
  selectorCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: normalize(16),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  selectorLabel: {
    fontSize: normalize(15),
  },
  selectorValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  colorDot: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  section: {
    paddingHorizontal: wp(5),
    marginTop: hp(2.5),
  },
  label: {
    fontSize: normalize(14),
    marginBottom: normalize(8),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
    padding: 0,
    fontFamily: "Quicksand-Regular",
  },
  walletSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: normalize(12),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  walletIconWrapper: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    justifyContent: "center",
    alignItems: "center",
    marginRight: normalize(12),
  },
  walletName: {
    fontSize: normalize(15),
  },
  walletPlaceholder: {
    fontSize: normalize(15),
  },
  currencySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: normalize(5),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  currencyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  currencyIconWrapper: {
    width: normalize(48),
    height: normalize(48),
    justifyContent: "center",
    alignItems: "center",
    marginRight: normalize(12),
  },
  currencySymbolText: {
    fontSize: normalize(24),
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: normalize(14),
    marginBottom: normalize(2),
  },
  currencyNameText: {
    fontSize: normalize(13),
  },
  bottomButtons: {
    flexDirection: "row",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(12),
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontSize: normalize(16),
  },
  createButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: normalize(16),
    color: "#fff",
  },
});

export default CreateEventScreen;
