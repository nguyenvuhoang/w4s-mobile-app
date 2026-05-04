import AppIcon from "@/components/base/AppIcon";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { getBottomSpace, hp, normalize } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Fonts } from "@/core/theme/font";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BudgetScreen from "../screens/BudgetScreen";
import HomeScreen from "../screens/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import StatisticsScreen from "../screens/StatisticsScreen";

const Tab = createBottomTabNavigator();

const EmptyScreen = () => <View style={{ flex: 1 }} />;

const RADIUS = normalize(80);

const CustomTabBarButton = ({ children }: any) => {
  const { colors } = useAppTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const expansion = useSharedValue(0);

  const toggleMenu = () => {
    const nextState = !isMenuOpen;
    setIsMenuOpen(nextState);
    expansion.value = withSpring(nextState ? 1 : 0, {
      damping: 15,
      stiffness: 500,
      mass: 0.4,
    });
  };

  const centerPlusStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${expansion.value * 45}deg` }],
  }));

  const scanStyle = useAnimatedStyle(() => {
    // Góc -135 độ (trên bên trái)
    const angle = -135 * (Math.PI / 180);
    return {
      position: "absolute",
      transform: [
        { translateX: expansion.value * RADIUS * Math.cos(angle) },
        { translateY: expansion.value * RADIUS * Math.sin(angle) },
        { scale: expansion.value },
      ],
      opacity: expansion.value,
    };
  });

  const micStyle = useAnimatedStyle(() => {
    // Góc -45 độ (trên bên phải)
    const angle = -45 * (Math.PI / 180);
    return {
      position: "absolute",
      transform: [
        { translateX: expansion.value * RADIUS * Math.cos(angle) },
        { translateY: expansion.value * RADIUS * Math.sin(angle) },
        { scale: expansion.value },
      ],
      opacity: expansion.value,
    };
  });

  return (
    <View style={styles.customButtonWrapper} pointerEvents="box-none">
      {/* Nút Scan */}
      <Animated.View style={[styles.arcOption, scanStyle]} pointerEvents={isMenuOpen ? "auto" : "none"}>
        <TouchableOpacity
          style={[styles.arcOptionInner, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            toggleMenu();
            router.push("/(protected)/invoice/scan");
          }}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="expand" size={normalize(20)} color={colors.tint} solid />
        </TouchableOpacity>
      </Animated.View>

      {/* Nút Mic */}
      <Animated.View style={[styles.arcOption, micStyle]} pointerEvents={isMenuOpen ? "auto" : "none"}>
        <TouchableOpacity
          style={[styles.arcOptionInner, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            toggleMenu();
            router.push("/(protected)/transaction/voice-transaction");
          }}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="microphone" size={normalize(20)} color={colors.tint} solid />
        </TouchableOpacity>
      </Animated.View>

      {/* Nút Chính */}
      <TouchableOpacity
        style={styles.customButton}
        activeOpacity={0.9}
        onPress={() => {
          if (isMenuOpen) toggleMenu();
          else router.push("/(protected)/transaction/add-transaction");
        }}
        onLongPress={toggleMenu}
      >
        <Animated.View
          style={[
            styles.customButtonInner,
            centerPlusStyle,
          ]}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientInner}
          >
            {children}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default function MainNavigator() {
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const renderTabIcon = (
    name: string,
    inactiveName: string,
    color: string,
    focused: boolean
  ) => (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <AppIcon
        name={focused ? name : inactiveName}
        size={normalize(26)}
        color={color}
      />
      {focused && (
        <View
          style={{
            width: normalize(18),
            height: normalize(3),
            borderRadius: normalize(2),
            backgroundColor: color,
            marginTop: normalize(4),
          }}
        />
      )}
    </View>
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        animation: "none",
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: isDark ? colors.background : '#FFFFFF',
            borderTopColor: colors.border,
            height: Platform.OS === "ios" ? hp(11) : hp(9) + insets.bottom,
            paddingBottom: Platform.OS === "ios" ? getBottomSpace() : hp(1.5) + insets.bottom,
          },
        ],
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon("essentional__ui_home_angle", "system_home", color, focused),
        }}
      />

      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon("business__statistic_pie_chart_2", "system_pie", color, focused),
        }}
      />

      <Tab.Screen
        name="AddTransactionPlaceholder"
        component={EmptyScreen}
        options={{
          tabBarLabel: "",
          tabBarIcon: () => (
            <View style={styles.addIconContainer}>
              <FontAwesome6
                name="plus"
                size={normalize(28)}
                color="#fff"
                style={styles.addIconStyle}
              />
            </View>
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
        listeners={{
          tabPress: (e) => e.preventDefault(),
        }}
      />

      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon("wallet_wallet", "system_wallet", color, focused),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(
              "settings__fine_tuning_local_settings_fine_tuning_settings",
              "system_setting",
              color,
              focused
            ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    elevation: 0,
    paddingTop: hp(1.2),
    paddingHorizontal: normalize(10),
  },
  tabBarLabel: {
    fontFamily: Fonts.medium,
    fontSize: normalize(11),
    marginTop: normalize(4),
  },
  customButtonWrapper: {
    top: normalize(-30),
    alignItems: "center",
    justifyContent: "center",
  },
  customButton: {
    alignItems: "center",
  },
  customButtonInner: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  gradientInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  arcOption: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: -1,
  },
  arcOptionInner: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
  addIconContainer: {
    width: normalize(50),
    height: normalize(50),
  },
  addIconStyle: {
    marginTop: normalize(10),
    marginLeft: normalize(14),
  },
});
