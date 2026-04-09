// src/components/base/AppHeader.tsx
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";

interface AppHeaderProps {
  title: string;

  onBack?: () => void;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  centerComponent?: React.ReactNode;
  containerStyle?: ViewStyle;
  titleStyle?: ViewStyle;
  backgroundColor?: string;
  showBorder?: boolean;
  backIconName?: string;
  backIconSize?: number;
  backIconColor?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBack,
  showBackButton = true,
  rightComponent,
  centerComponent,
  containerStyle,
  titleStyle,
  backgroundColor,
  showBorder = true,
  backIconName = "arrow-left",
  backIconSize,
  backIconColor,
}) => {
  const { colors } = useAppTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor || colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: showBorder ? 1 : 0,
        },
        containerStyle,
      ]}
    >
      {/* Left - Back Button */}
      <View style={[styles.leftContainer, { backgroundColor: colors.card }]}>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <FontAwesome6
              name={backIconName}
              size={backIconSize || normalize(20)}
              color={backIconColor || colors.text}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerContainer}>
        {centerComponent ? (
          centerComponent
        ) : (
          <CustomText
            style={[styles.title, { color: colors.text }, titleStyle]}
            numberOfLines={1}
          >
            {title}
          </CustomText>
        )}
      </View>
      <View style={styles.rightContainer}>
        {rightComponent || <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
  },
  leftContainer: {
    width: normalize(40),
    alignItems: "flex-start",
    borderRadius: normalize(20),
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: normalize(8),
  },
  title: {
    fontSize: normalize(18),
    fontFamily: Fonts.semiBold,
  },
  rightContainer: {
    width: normalize(40),
    alignItems: "flex-end",
  },
  placeholder: {
    width: normalize(40),
  },
});

export default AppHeader;
