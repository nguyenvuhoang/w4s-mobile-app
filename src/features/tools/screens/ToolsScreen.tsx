import AppHeader from "@/components/base/AppHeader";
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { normalize } from "@/utils/layout";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../styles/ToolsScreen.styles";

const ToolsScreen = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + normalize(20) }}>
        <AppHeader title={t("tools.title")} onBack={handleBack} />

        <View style={[styles.toolsList, { backgroundColor: colors.card }]}>
          <ToolItem
            icon="tool_screen_export_local"
            title={t("tools.export_internal")}
            onPress={() => router.push("/(protected)/tools/export-data")}
            colors={colors}
          />

          <ToolItem
            icon="tool_screen_atm_bank"
            title={t("tools.atm_finder")}
            onPress={() => router.push("/(protected)/tools/atm-finder")}
            colors={colors}
          />

          <ToolItem
            icon="tool_screen_tax_caculate"
            title={t("tools.personal_income_tax")}
            onPress={() => router.push("/(protected)/tools/personal-income-tax")}
            colors={colors}
          />

          <ToolItem
            icon="tool_screen_interes_caculate"
            title={t("tools.interest_calculator")}
            onPress={() => router.push("/(protected)/tools/interest-calculator")}
            colors={colors}
          />

          <ToolItem
            icon="tool_screen_tip_caculate"
            title={t("tools.tip_calculator")}
            onPress={() => router.push("/(protected)/tools/tip-calculator")}
            colors={colors}
          />

          <ToolItem
            icon="tool_screen_currency_change"
            title={t("tools.currency_converter")}
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
      <View style={styles.iconBox}>
        <AppIcon
          name={icon}
          size={normalize(26)}
          color={colors.tint}
          type="Ionicons"
        />
      </View>
      <CustomText style={[styles.title, { color: colors.text }]}>
        {title}
      </CustomText>
    </View>

    <AppIcon
      name="chevron-forward"
      size={normalize(20)}
      color={colors.border}
      type="Ionicons"
    />
  </TouchableOpacity>
);

export default ToolsScreen;