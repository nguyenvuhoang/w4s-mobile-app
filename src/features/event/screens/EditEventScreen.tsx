/**
 * EditEventScreen
 * Screen for editing existing event (also used as detail view)
 */

import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import StorageKey from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Event } from "@/features/event/types/Event";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import StorageService from "@/services/StorageService";
import { WalletSummary } from "@/types/wallet";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useEvent } from "../hooks/useEvent";

const EditEventScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { showNotification } = useNotification();
  const params = useLocalSearchParams();
  const eventId = params.id ? parseInt(params.id as string) : null;
  const insets = useSafeAreaInsets();

  const { wallets } = useWallet();
  const {
    allEvents,
    loading: eventsLoading,
    updateEvent,
    refetch,
  } = useEvent({ autoFetch: true });

  // Form state
  const [event, setEvent] = useState<Event | null>(null);
  const [icon, setIcon] = useState("calendar");
  const [color, setColor] = useState("#FF9800");
  const [eventName, setEventName] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(
    null
  );
  const [endDate, setEndDate] = useState(new Date());
  const [currency, setCurrency] = useState("VND");
  const [currencySymbol, setCurrencySymbol] = useState("đ");
  const [currencyName, setCurrencyName] = useState("Vietnamese Dong");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load event data
  useEffect(() => {
    // ✅ Đợi events load xong mới tìm
    if (!eventId || eventsLoading || allEvents.length === 0) {
      return;
    }

    const foundEvent = allEvents.find((e) => e.id === eventId);
    console.log("[EditEvent] Looking for event:", eventId);
    console.log("[EditEvent] Found:", foundEvent ? "Yes" : "No");

    if (foundEvent) {
      setEvent(foundEvent);
      setIcon(foundEvent.icon);
      setColor(foundEvent.color);
      setEventName(foundEvent.title);
      setEndDate(new Date(foundEvent.end_on_utc));
      setCurrency(foundEvent.currency_code || "VND");

      // Find wallet
      const wallet = wallets.find(
        (w) => String(w.walletId) === String(foundEvent.wallet_id)
      );
      if (wallet) {
        setSelectedWallet(wallet);
      }
      setLoading(false);
    } else if (!eventsLoading) {
      setLoading(false);
      showNotification("Không tìm thấy sự kiện", "error");
      router.back();
    }
  }, [eventId, allEvents, wallets, eventsLoading]);

  // Load selected data from storage
  useFocusEffect(
    useCallback(() => {
      const loadSelectedData = async () => {
        try {
          // Load selected icon
          const selectedIcon = await StorageService.getItem(
            StorageKey.TEMP_ICON_STORAGE
          );
          if (selectedIcon) {
            setIcon(selectedIcon);
            await StorageService.removeItem(StorageKey.TEMP_ICON_STORAGE);
          }

          // Load selected color
          const selectedColor = await StorageService.getItem(
            StorageKey.TEMP_COLOR_STORAGE
          );
          if (selectedColor) {
            setColor(selectedColor);
            await StorageService.removeItem(StorageKey.TEMP_COLOR_STORAGE);
          }

          // Load selected wallet
          const walletData = await StorageService.getAsyncItem(
            StorageKey.TEMP_WALLET_STORAGE
          );
          if (walletData) {
            const { walletId } = JSON.parse(walletData);
            const wallet = wallets.find((w) => w.walletId === walletId);
            if (wallet) {
              setSelectedWallet(wallet);
            }
            await StorageService.removeAsyncItem(
              StorageKey.TEMP_WALLET_STORAGE
            );
          }

          // Load selected currency
          const selectedCurrencyStr = await StorageService.getItem(
            StorageKey.TEMP_CURRENCY_STORAGE
          );
          if (selectedCurrencyStr) {
            try {
              const selectedCurrency = JSON.parse(selectedCurrencyStr);
              setCurrency(selectedCurrency.currencyId || "VND");
              setCurrencySymbol(selectedCurrency.symbol || "đ");
              setCurrencyName(selectedCurrency.name || "Vietnamese Dong");
              await StorageService.removeItem(
                StorageKey.TEMP_CURRENCY_STORAGE
              );
            } catch (parseError) {
              console.error("[EditEvent] Failed to parse currency:", parseError);
            }
          }
        } catch (error) {
          console.error("[EditEvent] Failed to load selected data:", error);
        }
      };

      loadSelectedData();
    }, [wallets])
  );

  const handleSave = async () => {
    if (!eventName.trim()) {
      showNotification("Vui lòng nhập tên sự kiện", "error");
      return;
    }

    if (!selectedWallet) {
      showNotification("Vui lòng chọn nguồn tiền", "error");
      return;
    }

    setSaving(true);

    try {
      if (!event) return;

      const eventData = {
        id: event.id,
        wallet_id: selectedWallet.walletId,
        title: eventName.trim(),
        description: event.description,
        color: color,
        icon: icon,
        end_on_utc: endDate,
        status: event.status,
      };

      console.log("[EditEvent] Updating event:", eventData);

      // ✅ Call hook
      const success = await updateEvent(eventData);

      if (success) {
        router.back();
        showNotification("Đã cập nhật sự kiện", "success");
      }
    } catch (error) {
      console.error("[EditEvent] Update failed:", error);
      showNotification("Không thể cập nhật sự kiện. Vui lòng thử lại.", "error");
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "bottom"]}
      >
        <AppHeader title="Sửa sự kiện" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText
            style={{ marginTop: normalize(12), color: colors.text }}
            type="regular"
          >
            Đang tải...
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <AppHeader title="Sửa sự kiện" showBackButton />

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
              paddingBottom: insets.bottom > 0 ? insets.bottom + hp(1) : hp(2),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={saving}
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
                  saving || !eventName.trim() || !selectedWallet ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={saving || !eventName.trim() || !selectedWallet}
          >
            <CustomText style={styles.createButtonText} type="bold">
              {saving ? "Đang lưu..." : "Lưu"}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  walletSelectorDisabled: {
    opacity: 0.6,
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
  currencySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: normalize(5),
    borderRadius: normalize(12),
    borderWidth: 1,
    opacity: 0.5,
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
});

export default EditEventScreen;
