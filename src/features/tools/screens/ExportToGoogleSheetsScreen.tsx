import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Tokens } from "@/core/theme/theme";
import { UploadProgress, useGoogleDriveExport } from "@/features/tools/hooks/useGoogleDriveExport";
import { normalize } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../styles/ExportToGoogleSheetsScreen.styles";

// Mock to create a fake file for testing upload (replace with your actual file export mechanism)
async function getMockFiles() {
  const pdfUri = FileSystem.Paths.document.uri + "mock_report.pdf";
  const xlsxUri = FileSystem.Paths.document.uri + "mock_report.xlsx";

  new FileSystem.File(pdfUri).write("Mock PDF content for testing");
  new FileSystem.File(xlsxUri).write("Mock Excel content for testing");

  return [
    {
      uri: pdfUri,
      fileName: "Báo cáo tháng 8.pdf",
      mimeType: "application/pdf" as const,
    },
    {
      uri: xlsxUri,
      fileName: "Báo cáo tháng 8.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" as const,
    },
  ];
}

const ExportToGoogleSheetsScreen = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [startDate, setStartDate] = useState("08/01/2026");
  const [endDate, setEndDate] = useState("08/31/2026");
  const [includeNonReport, setIncludeNonReport] = useState(true);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  const {
    googleEmail,
    isLinking,
    isUploading,
    error,
    linkGoogleAccount,
    unlinkGoogleAccount,
    uploadToDrive,
  } = useGoogleDriveExport();

  const handleBack = () => {
    if (router.canGoBack()) router.back();
  };

  const handleAccountPress = () => {
    if (googleEmail) {
      Alert.alert(
        "Tài khoản Google",
        `Đang liên kết: ${googleEmail}\n\nBạn có muốn huỷ liên kết không?`,
        [
          { text: "Giữ lại", style: "cancel" },
          { text: "Huỷ liên kết", style: "destructive", onPress: unlinkGoogleAccount },
        ]
      );
    } else {
      linkGoogleAccount();
    }
  };

  const handleExport = async () => {
    if (!googleEmail) {
      Alert.alert("Chưa liên kết", "Vui lòng liên kết tài khoản Google trước.");
      return;
    }

    try {
      const files = await getMockFiles();

      setProgressMap({});

      const onProgress = (p: UploadProgress) => {
        setProgressMap((prev) => ({ ...prev, [p.fileName]: p.percent }));
      };

      const results = await uploadToDrive(files, onProgress);

      Alert.alert(
        "Upload thành công! 🎉",
        `${results.length} file đã lên Google Drive của bạn.`,
        [
          { text: "Đóng", style: "cancel" },
          {
            text: "Mở Drive",
            onPress: () => Linking.openURL(results[0].webViewLink),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Thất bại", err?.message ?? "Vui lòng thử lại.");
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title={t("export_gsheets.title")} onBack={handleBack} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { paddingBottom: normalize(20) + insets.bottom }]}>

          {!!error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.card, borderColor: "#FF4444" }]}>
              <Ionicons name="warning-outline" size={normalize(16)} color="#FF4444" />
              <CustomText style={[styles.errorText, { color: "#FF4444" }]}>{error}</CustomText>
            </View>
          )}

          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Loại file sẽ upload
            </CustomText>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: "#FFF5F5", borderColor: "#FF4444" }]}>
                <Ionicons name="document-text-outline" size={normalize(14)} color="#FF4444" />
                <CustomText style={[styles.badgeText, { color: "#FF4444" }]}>PDF</CustomText>
              </View>
              <View style={[styles.badge, { backgroundColor: "#F1FBF6", borderColor: "#1D9E75" }]}>
                <Ionicons name="grid-outline" size={normalize(14)} color="#1D9E75" />
                <CustomText style={[styles.badgeText, { color: "#1D9E75" }]}>Excel (.xlsx)</CustomText>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_data.start_date")}
            </CustomText>
            <TouchableOpacity
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="calendar-outline" size={normalize(20)} color={colors.tint} />
              <CustomText style={[styles.rowText, { color: colors.text }]}>{startDate}</CustomText>
              <Ionicons name="chevron-down" size={normalize(18)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_data.end_date")}
            </CustomText>
            <TouchableOpacity
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="calendar-outline" size={normalize(20)} color={colors.tint} />
              <CustomText style={[styles.rowText, { color: colors.text }]}>{endDate}</CustomText>
              <Ionicons name="chevron-down" size={normalize(18)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              {t("export_gsheets.google_account")}
            </CustomText>
            <TouchableOpacity
              style={[
                styles.row,
                {
                  backgroundColor: googleEmail ? "#F1FBF6" : colors.card,
                  borderColor: googleEmail ? "#1D9E75" : colors.border,
                },
              ]}
              onPress={handleAccountPress}
              disabled={isLinking || isUploading}
            >
              <View style={[styles.accountIcon, { backgroundColor: googleEmail ? "#1D9E7522" : colors.background }]}>
                <Ionicons
                  name={googleEmail ? "checkmark-circle" : "logo-google"}
                  size={normalize(20)}
                  color={googleEmail ? "#1D9E75" : colors.border}
                />
              </View>
              <CustomText
                style={[styles.rowText, { color: googleEmail ? "#085041" : colors.border, flex: 1 }]}
                numberOfLines={1}
              >
                {googleEmail ?? t("export_gsheets.link_account")}
              </CustomText>
              {isLinking ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <Ionicons
                  name={googleEmail ? "chevron-down" : "link-outline"}
                  size={normalize(18)}
                  color={googleEmail ? "#085041" : colors.text}
                />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.toggleContainer}>
            <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
              {t("export_gsheets.include_non_report")}
            </CustomText>
            <Switch
              value={includeNonReport}
              onValueChange={setIncludeNonReport}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>

          {isUploading && Object.keys(progressMap).length > 0 && (
            <View style={[styles.progressContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {Object.entries(progressMap).map(([fileName, percent]) => (
                <View key={fileName} style={styles.progressItem}>
                  <View style={styles.progressLabelRow}>
                    <Ionicons
                      name={fileName.endsWith(".pdf") ? "document-text-outline" : "grid-outline"}
                      size={normalize(14)}
                      color={fileName.endsWith(".pdf") ? "#FF4444" : "#1D9E75"}
                    />
                    <CustomText style={[styles.progressFileName, { color: colors.text }]} numberOfLines={1}>
                      {fileName}
                    </CustomText>
                    <CustomText style={[styles.progressPct, { color: colors.text }]}>
                      {Math.round(percent)}%
                    </CustomText>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: fileName.endsWith(".pdf") ? "#FF4444" : "#1D9E75",
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.exportButton,
              { backgroundColor: "transparent", overflow: "hidden" },
              (!googleEmail || isLinking || isUploading) && styles.exportButtonDisabled,
            ]}
            onPress={handleExport}
            disabled={!googleEmail || isLinking || isUploading}
          >
            <LinearGradient
              colors={(!googleEmail || isLinking || isUploading) ? [colors.border, colors.border] : Tokens.gradients.base}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <CustomText style={styles.exportButtonText}>
                {t("export_data.export_button")}
              </CustomText>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExportToGoogleSheetsScreen;