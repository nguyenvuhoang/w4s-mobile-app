import { useAppTheme } from '@/core/theme/ThemeContext';
import { Tokens } from '@/core/theme/theme';
import { normalize } from "@/utils/layout";
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import CustomText from "./CustomText";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  isLoading?: boolean;
  showIcon?: boolean;
  iconName?: string;
  textType?: "regular" | "medium" | "bold";
  variant?: "contained" | "text" | "outline";
  buttonContainerStyle?: StyleProp<ViewStyle>;
  useGradient?: boolean;
  rootWidth?: number;
  maxWidth?: number;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  style,
  textType = "medium",
  textStyle,
  disabled = false,
  isLoading = false,
  showIcon = false,
  iconName = "ellipsis",
  variant = "contained",
  buttonContainerStyle,
  useGradient = false,
  rootWidth,
  maxWidth,
}) => {
  const { colors } = useAppTheme();

  // 1. Logic màu sắc
  const getButtonColor = () => {
    if (variant === "text") return "transparent";
    if (disabled) return colors.border;
    return colors.tint;
  };

  const getTextColor = () => {
    if (variant === "text") return colors.tint;
    return colors.onprimary;
  };

  const buttonContent = (
    <View style={styles.contentContainer}>
      {showIcon && !isLoading && (
        <FontAwesome6
          name={iconName}
          size={normalize(16)}
          color={getTextColor()}
          style={styles.icon}
        />
      )}

      <CustomText
        type={textType}
        style={[
          styles.buttonText,
          { color: getTextColor() },
          textStyle,
          isLoading && { opacity: 0 },
        ]}
      >
        {title}
      </CustomText>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator
            color={getTextColor()}
            style={{ position: "absolute", alignSelf: "center" }}
          />
        </View>
      )}
    </View>
  );

  const dynamicButtonStyle = {
    width: rootWidth,
    maxWidth: maxWidth,
    backgroundColor: useGradient ? 'transparent' : getButtonColor(),
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: colors.border
  };

  return (
    <View style={buttonContainerStyle}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
        style={[
          styles.button,
          dynamicButtonStyle,
          (disabled && useGradient) && { opacity: 0.5 },
          style,
        ]}
      >
        {useGradient && variant === 'contained' && (
          <LinearGradient
            colors={Tokens.gradients.base}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}

        {buttonContent}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: normalize(30),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    minHeight: normalize(50),
    paddingVertical: normalize(14),
  },
  buttonText: {
    fontSize: normalize(16),
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});

export default CustomButton;
