import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { normalize } from "@/utils/layout";
import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, TextInput, TextStyle, View, ViewStyle, StyleProp, TouchableOpacity, ScrollView } from "react-native";

interface FormattedMoneyInputProps {
    value: number;
    onChange: (value: number) => void;
    currency?: string;
    placeholder?: string;
    containerStyle?: StyleProp<ViewStyle>;
    currencyStyle?: TextStyle;
    inputStyle?: TextStyle;
    editable?: boolean;
    onCurrencyPress?: () => void;
    showSuggestions?: boolean;
    onFocus?: () => void;
}

const FormattedMoneyInput: React.FC<FormattedMoneyInputProps> = ({
    value,
    onChange,
    currency = "đ",
    placeholder,
    containerStyle,
    currencyStyle,
    inputStyle,
    editable = true,
    onCurrencyPress,
    showSuggestions = false,
    onFocus,
}) => {
    const { colors } = useAppTheme();

    // Initialize with formatted value
    const [inputValue, setInputValue] = useState(
        value ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 10 }).format(value) : ""
    );

    // Sync state when value prop changes externally
    useEffect(() => {
        const currentNum = parseFloat(inputValue.replace(/,/g, ''));
        if (value !== currentNum) {
            setInputValue(value ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 10 }).format(value) : "");
        }
    }, [value]);

    const handleChange = (text: string) => {
        if (!editable) return;

        // Only allow digits and one dot
        let cleaned = text.replace(/[^0-9.]/g, "");

        // Handle multiple dots: keep only the first one
        const parts = cleaned.split('.');
        if (parts.length > 2) {
            cleaned = parts[0] + '.' + parts.slice(1).join('');
        }

        // Auto-format strategy for display
        const rawParts = cleaned.split('.');
        const integerPart = rawParts[0];
        const decimalPart = rawParts.length > 1 ? '.' + rawParts[1] : '';

        // Format integer part with commas
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const newDisplayValue = formattedInteger + decimalPart;

        setInputValue(newDisplayValue);

        const numValue = parseFloat(cleaned);
        onChange(isNaN(numValue) ? 0 : numValue);
    };

    const suggestions = useMemo(() => {
        if (!showSuggestions || !value || value <= 0 || value > 99999) return [];
        const multipliers = [1000, 10000, 100000, 1000000];
        return multipliers.map(m => value * m);
    }, [value, showSuggestions]);

    const formatSuggestion = (val: number) => {
        return new Intl.NumberFormat("en-US").format(val);
    };

    return (
        <>
            <View style={[styles.container, containerStyle]}>
                <TouchableOpacity 
                    disabled={!onCurrencyPress} 
                    onPress={onCurrencyPress}
                    activeOpacity={0.7}
                >
                    <ThemedText
                        style={[
                            styles.currency,
                            { color: colors.tint },
                            currencyStyle,
                        ]}
                    >
                        {currency}
                    </ThemedText>
                </TouchableOpacity>

                <TextInput
                    value={inputValue}
                    onChangeText={handleChange}
                    keyboardType="decimal-pad"
                    placeholder={placeholder}
                    placeholderTextColor={colors.icon}
                    textAlign="right"
                    editable={editable}
                    onFocus={onFocus}
                    style={[
                        styles.input,
                        {
                            color: colors.text,
                            fontFamily: Fonts.bold,
                        },
                        inputStyle,
                    ]}
                />
            </View>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.suggestionScroll}
                    contentContainerStyle={styles.suggestionContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {suggestions.map((s, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.suggestionChip,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                            onPress={() => onChange(s)}
                        >
                            <ThemedText style={[styles.suggestionText, { color: colors.tint }]}>
                                {formatSuggestion(s)}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        height: normalize(52),
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
    suggestionScroll: {
        marginTop: normalize(8),
    },
    suggestionContent: {
        paddingHorizontal: normalize(4),
        gap: normalize(8),
    },
    suggestionChip: {
        paddingHorizontal: normalize(12),
        paddingVertical: normalize(6),
        borderRadius: normalize(16),
        borderWidth: 1,
    },
    suggestionText: {
        fontSize: normalize(12),
        fontFamily: Fonts.medium,
    },
});

export default FormattedMoneyInput;
