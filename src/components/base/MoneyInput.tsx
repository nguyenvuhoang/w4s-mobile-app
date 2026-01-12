import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { normalize } from "@/utils/layout";
import React, { useMemo } from "react";
import { StyleSheet, TextInput, TextStyle, View, ViewStyle } from "react-native";

interface MoneyInputProps {
  value: number;               
  onChange: (value: number) => void;
  currency?: string;             // đ, $, €, ₫...
  placeholder?: string;
  
  // Custom styles
  containerStyle?: ViewStyle;
  currencyStyle?: TextStyle;
  inputStyle?: TextStyle;
  
  // Appearance
  editable?: boolean;
  highlightMode?: boolean;       // Chế độ highlight (cho result)
}

const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  currency = "đ",
  placeholder,
  containerStyle,
  currencyStyle,
  inputStyle,
  editable = true,
  highlightMode = false,
}) => {
  const { colors } = useAppTheme();

  const displayValue = useMemo(() => {
    if (!value) return "";
    return new Intl.NumberFormat("en-US").format(value);
  }, [value]);

  const handleChange = (text: string) => {
    if (!editable) return;
    const numericValue = text.replace(/[^0-9]/g, "");
    onChange(numericValue ? Number(numericValue) : 0);
  };

  // Dynamic styles based on mode
  const containerBgColor = highlightMode 
    ? colors.tint + "10" 
    : colors.background;
  
  const borderColor = highlightMode 
    ? colors.tint 
    : "transparent";
  
  const textColor = highlightMode 
    ? colors.tint 
    : colors.text;
  
  const currencyColor = highlightMode 
    ? colors.tint 
    : colors.tint;

  return (
    <View
      style={[
        styles.container,
        { 
          backgroundColor: containerBgColor,
        },
        // Chỉ apply border khép kín nếu KHÔNG có borderBottomWidth custom
        !containerStyle?.borderBottomWidth && {
          borderColor: borderColor,
          borderWidth: highlightMode ? 2 : 0,
        },
        containerStyle,
        // Apply borderBottomColor từ containerStyle nếu có borderBottomWidth
        containerStyle?.borderBottomWidth ? {
          borderBottomColor: highlightMode ? colors.tint : colors.border,
        } : undefined,
      ]}
    >
      <ThemedText
        style={[
          styles.currency, 
          { color: currencyColor },
          currencyStyle,
        ]}
      >
        {currency}
      </ThemedText>

      <TextInput
        value={displayValue}
        onChangeText={handleChange}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.icon}
        textAlign="right"
        editable={editable}
        style={[
          styles.input, 
          { 
            color: textColor,
            fontFamily: Fonts.bold,
          },
          inputStyle,
        ]}
      />
    </View>
  );
};

export default MoneyInput;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    height: normalize(48),
    borderRadius: normalize(12),
    paddingHorizontal: normalize(12),
    flexDirection: "row",
    alignItems: "center",
  },
  currency: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    marginRight: normalize(6),
  },
  input: {
    flex: 1,
    fontSize: normalize(18),
  },
});