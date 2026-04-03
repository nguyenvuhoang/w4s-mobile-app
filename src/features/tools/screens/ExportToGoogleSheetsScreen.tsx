import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Tokens } from "@/core/theme/theme";
import { normalize } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const ExportToGoogleSheetsScreen = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [sourceFilter, setSourceFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [startDate, setStartDate] = useState("08/01/2026");
  const [endDate, setEndDate] = useState("08/01/2026");
  const [googleAccount, setGoogleAccount] = useState("");
  const [skipTransactions, setSkipTransactions] = useState(true);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleLinkAccount = () => {
    // Handle Google account linking
    console.log("Linking Google account...");
  };

  const handleExport = () => {
    // Handle export logic here
    console.log("Exporting to Google Sheets...");
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <AppHeader title={t("export_gsheets.title")} onBack={handleBack} />

        <View style={[styles.content, { paddingBottom: normalize(20) + insets.bottom }]}>
          {/* Source Filter */}
          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_gsheets.source_wallet")}
            </CustomText>
            <TouchableOpacity
              style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="globe-outline" size={normalize(20)} color={colors.tint} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={sourceFilter}
                onChangeText={setSourceFilter}
                placeholder={t("export_gsheets.all_wallets")}
                placeholderTextColor={colors.border}
              />
            </TouchableOpacity>
          </View>

          {/* Group Filter */}
          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_gsheets.group")}
            </CustomText>
            <TouchableOpacity
              style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="globe-outline" size={normalize(20)} color={colors.tint} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={groupFilter}
                onChangeText={setGroupFilter}
                placeholder={t("export_gsheets.all_groups")}
                placeholderTextColor={colors.border}
              />
            </TouchableOpacity>
          </View>

          {/* Start Date */}
          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_data.start_date")}
            </CustomText>
            <TouchableOpacity
              style={[styles.dateContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <CustomText style={[styles.dateText, { color: colors.text }]}>
                {startDate}
              </CustomText>
              <Ionicons name="chevron-down" size={normalize(20)} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* End Date */}
          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_data.end_date")}
            </CustomText>
            <TouchableOpacity
              style={[styles.dateContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <CustomText style={[styles.dateText, { color: colors.text }]}>
                {endDate}
              </CustomText>
              <Ionicons name="chevron-down" size={normalize(20)} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Google Account */}
          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_gsheets.google_account")}
            </CustomText>
            <TouchableOpacity
              style={[styles.accountContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleLinkAccount}
            >
              <CustomText style={[styles.accountText, { color: colors.border }]}>
                {googleAccount || t("export_gsheets.link_account")}
              </CustomText>
              <Ionicons name="link-outline" size={normalize(20)} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Skip Transactions Toggle */}
          <View style={styles.toggleContainer}>
            <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
              {t("export_gsheets.include_non_report")}
            </CustomText>
            <Switch
              value={skipTransactions}
              onValueChange={setSkipTransactions}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>

          {/* Export Button */}
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: "transparent", overflow: "hidden" }]}
            onPress={handleExport}
          >
            <LinearGradient
              colors={Tokens.gradients.base}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <CustomText style={styles.exportButtonText}>
              {t("export_data.export_button")}
            </CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: normalize(20),
  },
  inputGroup: {
    marginBottom: normalize(20),
  },
  label: {
    fontSize: normalize(14),
    marginBottom: normalize(8),
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(16),
    height: normalize(56),
    gap: normalize(12),
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(16),
    height: normalize(56),
  },
  dateText: {
    fontSize: normalize(16),
  },
  accountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: normalize(12),
    borderWidth: 1,
    paddingHorizontal: normalize(16),
    height: normalize(56),
  },
  accountText: {
    fontSize: normalize(16),
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(24),
    marginTop: normalize(8),
  },
  toggleLabel: {
    fontSize: normalize(16),
    flex: 1,
  },
  exportButton: {
    borderRadius: normalize(12),
    padding: normalize(16),
    alignItems: "center",
    marginTop: normalize(16),
  },
  exportButtonText: {
    color: "#fff",
    fontSize: normalize(16),
    fontWeight: "600",
  },
});

export default ExportToGoogleSheetsScreen;