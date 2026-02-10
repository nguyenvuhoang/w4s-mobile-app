import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Tokens } from "@/core/theme/theme";
import { normalize } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ToolsScreen = () => {
  const { colors } = useAppTheme();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <AppHeader title="Công cụ" onBack={handleBack} />

        {/* Tools List */}
        <View style={[styles.toolsList, { backgroundColor: colors.card }]}>
          <ToolItem
            icon="download-outline"
            title="Xuất dữ liệu nội bộ"
            onPress={() => router.push("/(protected)/tools/export-data")}
            colors={colors}
          />

          <ToolItem
            icon="logo-google"
            title="Xuất dữ liệu Google Trang Tính"
            onPress={() => router.push("/(protected)/tools/export-google-sheets")}
            colors={colors}
          />

          <ToolItem
            icon="location-outline"
            title="Tìm vị trí ATM/Ngân hàng"
            onPress={() => router.push("/(protected)/tools/atm-finder")}
            colors={colors}
          />

          <ToolItem
            icon="calculator-outline"
            title="Tính thuế thu nhập cá nhân"
            onPress={() => router.push("/(protected)/tools/personal-income-tax")}
            colors={colors}
          />

          <ToolItem
            icon="trending-up-outline"
            title="Tính lãi suất"
            onPress={() => router.push("/(protected)/tools/interest-calculator")}
            colors={colors}
          />

          <ToolItem
            icon="restaurant-outline"
            title="Tính tiền tip"
            onPress={() => router.push("/(protected)/tools/tip-calculator")}
            colors={colors}
          />

          <ToolItem
            icon="swap-horizontal-outline"
            title="Quy đổi tiền tệ"
            onPress={() => router.push("/(protected)/tools/currency-converter")}
            colors={colors}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ToolItem = ({ icon, title, onPress, colors }: any) => (
  <TouchableOpacity
    style={[styles.toolItem, { borderBottomColor: colors.border }]}
    onPress={onPress}
  >
    <View style={styles.left}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: Tokens.colors.foundation.primary["primary-1"] },
        ]}
      >
        <Ionicons name={icon} size={normalize(22)} color={colors.tint} />
      </View>
      <CustomText style={[styles.title, { color: colors.text }]}>
        {title}
      </CustomText>
    </View>

    <Ionicons
      name="chevron-forward"
      size={normalize(20)}
      color={colors.border}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(16),
  },
  headerTitle: {
    fontSize: normalize(24),
    fontWeight: "bold",
  },
  toolsList: {
    borderRadius: normalize(16),
    marginHorizontal: normalize(20),
    overflow: "hidden",
  },
  toolItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: normalize(16),
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  iconBox: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: normalize(16),
  },
});

export default ToolsScreen;