import AppHeader from "@/components/base/AppHeader";
import CustomButton from "@/components/base/CustomButton";
import CustomText from "@/components/base/CustomText";
import STORAGE_KEY from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import i18n from "@/core/i18n/i18n";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Tokens } from "@/core/theme/theme";
import { useExportData } from "@/features/tools/hooks/useExportData";
import { useWallet } from "@/features/wallet/hooks/useWallet";
import StorageService from "@/services/StorageService";
import { normalize } from "@/utils/layout";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../styles/ExportDataScreen.styles";

interface SelectedCategoryData {
  id: number;
  category_id: string;
  category_name: string;
  category_type: string;
  category_group: "EXPENSE" | "INCOME" | "LOAN";
  icon: string;
  color: string;
}

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const ExportDataScreen = () => {
  const { colors, mode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { exportData, loading } = useExportData();
  const { showNotification } = useNotification();

  const [walletId, setWalletId] = useState<number | "ALL">("ALL");
  const { wallets } = useWallet();
  const selectedWallet = useMemo(
    () => wallets.find((w) => w.walletId === walletId),
    [wallets, walletId]
  );

  const [categoryData, setCategoryData] = useState<SelectedCategoryData | "ALL">("ALL");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [email, setEmail] = useState("");
  const [fileType, setFileType] = useState<"excel" | "pdf">("excel");
  const [dateError, setDateError] = useState<string | null>(null);

  const maxDate = new Date();
  const minStartDate = new Date();
  minStartDate.setFullYear(maxDate.getFullYear() - 2);

  useFocusEffect(
    useCallback(() => {
      const loadTempData = async () => {
        try {
          const storedWallet = await StorageService.getItem(STORAGE_KEY.TEMP_WALLET_STORAGE);
          if (storedWallet) {
            const { walletId: storedId } = JSON.parse(storedWallet);
            setWalletId(storedId);
            await StorageService.removeItem(STORAGE_KEY.TEMP_WALLET_STORAGE);
          }

          const storedCategory = await StorageService.getItem(STORAGE_KEY.TEMP_CATEGORY_STORAGE);
          if (storedCategory) {
            const categoryObj: SelectedCategoryData = JSON.parse(storedCategory);
            setCategoryData(categoryObj);
            await StorageService.removeItem(STORAGE_KEY.TEMP_CATEGORY_STORAGE);
          }
        } catch (error) {
          console.error("Load data failed:", error);
        }
      };
      loadTempData();
    }, [])
  );

  const parseCategoryNameJSON = (nameJson: string | undefined) => {
    if (!nameJson) return t("export_data.all");
    try {
      const parsed = JSON.parse(nameJson);
      return parsed[i18n.language] || parsed.vi || parsed.en || t("export_data.all");
    } catch {
      return nameJson || t("export_data.all");
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleExport = async () => {
    if (!email.trim() || !email.includes("@")) {
      showNotification(t("export_data.invalid_email_error"), "error");
      return;
    }

    const startTimestampStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}T00:00:00`;
    const endTimestampStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T23:59:59`;

    const payload = {
      wallet_id: walletId === "ALL" ? null : walletId,
      is_all_wallet: walletId === "ALL",
      category_id: categoryData === "ALL" ? 0 : categoryData.id,
      budget_id: null,
      email: email.trim(),
      from_transaction_date: startTimestampStr,
      to_transaction_date: endTimestampStr,
      file_type: fileType,
    };

    const startNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    if (endNormalized < startNormalized) {
      setDateError(t("export_data.invalid_date_range"));
      return;
    }
    setDateError(null);

    const res = await exportData(payload);
    if (res.success) {
      showNotification(t("export_data.export_success"), "success");
      router.back();
    } else {
      showNotification(t("export_data.export_failed"), "error");
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title={t("export_data.title")} onBack={handleBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: normalize(20) + insets.bottom },
          ]}
        >
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                {t("export_data.select_wallet")} <CustomText style={{ color: "red" }}>*</CustomText>
              </CustomText>
              {walletId !== "ALL" && (
                <TouchableOpacity onPress={() => setWalletId("ALL")}>
                  <CustomText style={{ color: "#FF3B30", fontSize: normalize(12), marginBottom: normalize(8) }}>{t("export_data.clear")}</CustomText>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/(protected)/wallet/wallet-list?mode=select")}
            >
              {selectedWallet ? (
                <>
                  <FontAwesome6 name={(selectedWallet.icon as any) || "wallet"} size={normalize(20)} color={selectedWallet.color || colors.icon} solid />
                  <CustomText style={[styles.input, { color: colors.text }]}>
                    {selectedWallet.name}
                  </CustomText>
                </>
              ) : (
                <>
                  <Ionicons name="wallet-outline" size={normalize(20)} color={colors.tint} />
                  <CustomText style={[styles.input, { color: colors.text }]}>
                    {t("export_data.all")}
                  </CustomText>
                </>
              )}
              <Ionicons name="chevron-down" size={normalize(20)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <CustomText style={[styles.label, { color: colors.text }]}>
                {t("export_data.select_category")} <CustomText style={{ color: "red" }}>*</CustomText>
              </CustomText>
              {categoryData !== "ALL" && (
                <TouchableOpacity onPress={() => setCategoryData("ALL")}>
                  <CustomText style={{ color: "#FF3B30", fontSize: normalize(12), marginBottom: normalize(8) }}>{t("export_data.clear")}</CustomText>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/(protected)/select-category" })}
            >
              {categoryData !== "ALL" ? (
                <>
                  <View style={{ width: normalize(24), height: normalize(24), borderRadius: normalize(12), backgroundColor: categoryData.color, alignItems: "center", justifyContent: "center" }}>
                    <FontAwesome6 name={categoryData.icon as any} size={normalize(12)} color="#fff" />
                  </View>
                  <CustomText style={[styles.input, { color: colors.text }]}>
                    {parseCategoryNameJSON(categoryData.category_name)}
                  </CustomText>
                </>
              ) : (
                <>
                  <Ionicons name="grid-outline" size={normalize(20)} color={colors.tint} />
                  <CustomText style={[styles.input, { color: colors.text }]}>
                    {t("export_data.all")}
                  </CustomText>
                </>
              )}
              <Ionicons name="chevron-down" size={normalize(20)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_data.start_date")} <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={[
                styles.dateContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: dateError ? "#FF3B30" : colors.border
                }
              ]}
              onPress={() => setShowStartPicker(true)}
            >
              <CustomText style={[styles.dateText, { color: colors.text }]}>
                {formatDate(startDate)}
              </CustomText>
              <Ionicons name="calendar-outline" size={normalize(20)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_data.end_date")} <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <TouchableOpacity
              style={[
                styles.dateContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: dateError ? "#FF3B30" : colors.border
                }
              ]}
              onPress={() => setShowEndPicker(true)}
            >
              <CustomText style={[styles.dateText, { color: colors.text }]}>
                {formatDate(endDate)}
              </CustomText>
              <Ionicons name="calendar-outline" size={normalize(20)} color={colors.text} />
            </TouchableOpacity>
            {dateError && (
              <CustomText style={styles.errorText}>
                {dateError}
              </CustomText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_data.file_format")} <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <View style={{ flexDirection: "row", gap: normalize(12) }}>
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  { flex: 1, justifyContent: "center", backgroundColor: fileType === "excel" ? "transparent" : colors.card, borderColor: fileType === "excel" ? "transparent" : colors.border, overflow: "hidden" }
                ]}
                onPress={() => setFileType("excel")}
              >
                {fileType === "excel" && (
                  <LinearGradient
                    colors={Tokens.gradients.base}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                )}
                <FontAwesome6 name="file-excel" size={normalize(20)} color={fileType === "excel" ? "#fff" : colors.text} solid />
                <CustomText style={[styles.dateText, { color: fileType === "excel" ? "#fff" : colors.text, fontWeight: "500" }]}>
                  Excel
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  { flex: 1, justifyContent: "center", backgroundColor: fileType === "pdf" ? "transparent" : colors.card, borderColor: fileType === "pdf" ? "transparent" : colors.border, overflow: "hidden" }
                ]}
                onPress={() => setFileType("pdf")}
              >
                {fileType === "pdf" && (
                  <LinearGradient
                    colors={Tokens.gradients.base}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                )}
                <FontAwesome6 name="file-pdf" size={normalize(20)} color={fileType === "pdf" ? "#fff" : colors.text} solid />
                <CustomText style={[styles.dateText, { color: fileType === "pdf" ? "#fff" : colors.text, fontWeight: "500" }]}>
                  PDF
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_data.email_label")} <CustomText style={{ color: "red" }}>*</CustomText>
            </CustomText>
            <View
              style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="mail-outline" size={normalize(20)} color={colors.tint} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholderTextColor={colors.border}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <CustomButton
            title={loading ? t("export_data.processing") : t("export_data.export_button")}
            onPress={handleExport}
            disabled={loading || !email.trim()}
            useGradient={true}
            style={{ marginTop: normalize(16), height: normalize(56), borderRadius: normalize(30) }}
            textStyle={{ fontWeight: "600", fontSize: normalize(16) }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePicker
        modal
        open={showStartPicker}
        date={startDate}
        mode="date"
        theme={mode === "dark" ? "dark" : "light"}
        buttonColor={colors.tint}
        dividerColor={colors.tint}
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        title={t("export_data.select_start_date")}
        onConfirm={(date) => {
          setShowStartPicker(false);
          setStartDate(date);
          const startNorm = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const endNorm = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          if (endNorm < startNorm) {
            setDateError(t("export_data.invalid_date_range"));
          } else {
            setDateError(null);
          }
        }}
        onCancel={() => setShowStartPicker(false)}
        maximumDate={maxDate}
        minimumDate={minStartDate}
      />

      <DatePicker
        modal
        open={showEndPicker}
        date={endDate}
        mode="date"
        theme={mode === "dark" ? "dark" : "light"}
        buttonColor={colors.tint}
        dividerColor={colors.tint}
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        title={t("export_data.select_end_date")}
        onConfirm={(date) => {
          setShowEndPicker(false);
          setEndDate(date);
          const startNorm = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const endNorm = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          if (endNorm < startNorm) {
            setDateError(t("export_data.invalid_date_range"));
          } else {
            setDateError(null);
          }
        }}
        onCancel={() => setShowEndPicker(false)}
        maximumDate={maxDate}
        minimumDate={minStartDate}
      />
    </SafeAreaView>
  );
};

export default ExportDataScreen;
