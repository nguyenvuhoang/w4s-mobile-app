// src/components/base/AppHeader.tsx
import AppIcon from "@/components/base/AppIcon";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HeaderVariant = "default" | "gradient";

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

  /** 'default' = header thường | 'gradient' = nền màu tint có hoạt tiết tròn */
  variant?: HeaderVariant;
  /** Chỉ dùng khi variant='gradient': tiêu đề phụ hiển thị bên dưới title */
  subtitle?: string;
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
  variant = "default",
  subtitle,
}) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  // ─── Tint + Pattern variant ──────────────────────────────────────────────
  if (variant === "gradient") {
    return (
      <View
        style={[
          styles.gradientContainer,
          {
            backgroundColor: colors.tint,
            paddingTop: insets.top + hp(2),
            borderBottomLeftRadius: normalize(24),
            borderBottomRightRadius: normalize(24),
            overflow: "hidden",
          },
          containerStyle,
        ]}
      >
        <View style={styles.ringOuter} />
        <View style={styles.ringInner} />

        {/* Left */}
        <View style={styles.gradientSide}>
          {showBackButton && (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.gradientBack}
              activeOpacity={0.7}
            >
              <AppIcon
                name={backIconName}
                size={backIconSize || normalize(20)}
                color={backIconColor || "#fff"}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Center */}
        <View style={styles.gradientCenter}>
          {centerComponent ? (
            centerComponent
          ) : (
            <>
              <CustomText style={[styles.gradientTitle, titleStyle as any]}>
                {title}
              </CustomText>
              {subtitle ? (
                <CustomText style={styles.gradientSubtitle}>
                  {subtitle}
                </CustomText>
              ) : null}
            </>
          )}
        </View>

        {/* Right */}
        <View style={styles.gradientSide}>
          {rightComponent || <View style={styles.placeholder} />}
        </View>
      </View>
    );
  }

  // ─── Default variant ─────────────────────────────────────────────────────
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
            <AppIcon
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
  // ── Default ──────────────────────────────────────────────────────────────
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
    minWidth: normalize(40),
    alignItems: "flex-end",
  },
  placeholder: {
    width: normalize(40),
  },

  // ── Tint + Pattern ───────────────────────────────────────────────────────
  gradientContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingBottom: hp(1.5),
  },
  gradientSide: {
    width: normalize(40),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  gradientBack: {
    width: normalize(40),
    height: normalize(40),
    alignItems: "center",
    justifyContent: "center",
  },
  gradientCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: normalize(8),
    zIndex: 1,
  },
  gradientTitle: {
    fontSize: normalize(20),
    fontFamily: Fonts.bold,
    color: "#fff",
    textAlign: "center",
  },
  gradientSubtitle: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 2,
  },

  ringOuter: {
    position: "absolute",
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(80),
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    right: -normalize(20),
    top: normalize(40),
  },
  ringInner: {
    position: "absolute",
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(40),
    backgroundColor: "rgba(255,255,255,0.12)",
    right: -normalize(10),
    top: normalize(50),
  },
});

export default AppHeader;
