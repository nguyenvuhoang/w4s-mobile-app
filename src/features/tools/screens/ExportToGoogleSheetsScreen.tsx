import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { normalize } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ExportToGoogleSheetsScreen = () => {
  const { colors } = useAppTheme();
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
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <AppHeader title="Xuất dữ liệu tới Google trang tính" onBack={handleBack} />

        <View style={styles.content}>
          {/* Source Filter */}
          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Nguồn tiền
            </CustomText>
            <TouchableOpacity
              style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="globe-outline" size={normalize(20)} color={colors.tint} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={sourceFilter}
                onChangeText={setSourceFilter}
                placeholder="Tất cả các ví"
                placeholderTextColor={colors.border}
              />
            </TouchableOpacity>
          </View>

          {/* Group Filter */}
          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Nhóm
            </CustomText>
            <TouchableOpacity
              style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="globe-outline" size={normalize(20)} color={colors.tint} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={groupFilter}
                onChangeText={setGroupFilter}
                placeholder="Tất cả các nhóm"
                placeholderTextColor={colors.border}
              />
            </TouchableOpacity>
          </View>

          {/* Start Date */}
          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Ngày bắt đầu
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
              Ngày kết thúc
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
              Tài khoản Google
            </CustomText>
            <TouchableOpacity
              style={[styles.accountContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleLinkAccount}
            >
              <CustomText style={[styles.accountText, { color: colors.border }]}>
                {googleAccount || "Kiến kết"}
              </CustomText>
              <Ionicons name="link-outline" size={normalize(20)} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Skip Transactions Toggle */}
          <View style={styles.toggleContainer}>
            <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
              Xuất giao dịch không bao cáo
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
            style={[styles.exportButton, { backgroundColor: colors.tint }]}
            onPress={handleExport}
          >
            <CustomText style={styles.exportButtonText}>
              Xuất File
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