import AppHeader from "@/components/base/AppHeader";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Tokens } from "@/core/theme/theme";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../styles/TipCalculatorScreen.styles";

const TipCalculatorScreen = () => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [billAmount, setBillAmount] = useState("0");
  const [tipPercent, setTipPercent] = useState(10);
  const [tipPercentInput, setTipPercentInput] = useState("10");
  const [isManualInput, setIsManualInput] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [tipAmount, setTipAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [perPerson, setPerPerson] = useState(0);

  useEffect(() => {
    calculateTip();
  }, [billAmount, tipPercent, numberOfPeople]);

  const calculateTip = () => {
    const bill = parseFloat(billAmount.replace(/[^\d]/g, ""));

    if (!isNaN(bill) && bill > 0) {
      const tip = bill * (tipPercent / 100);
      const total = bill + tip;
      const perPersonAmount = total / numberOfPeople;

      setTipAmount(tip);
      setTotalAmount(total);
      setPerPerson(perPersonAmount);
    } else {
      setTipAmount(0);
      setTotalAmount(0);
      setPerPerson(0);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(Math.round(value));
  };

  const handleBillAmountChange = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, "");
    setBillAmount(cleaned);
  };

  const handleTipPercentInputChange = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, "");
    setTipPercentInput(cleaned);
    setIsManualInput(true);

    const value = parseInt(cleaned || "0");
    setTipPercent(value);
  };

  const handleSliderChange = (value: number) => {
    setIsManualInput(false);
    setTipPercent(value);
    setTipPercentInput(value.toString());
  };

  const handleDecreasePeople = () => {
    if (numberOfPeople > 1) {
      setNumberOfPeople(numberOfPeople - 1);
    }
  };

  const handleIncreasePeople = () => {
    setNumberOfPeople(numberOfPeople + 1);
  };

  const tipPresets = [0, 5, 10, 15, 20];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title={t("tip_calculator.title")} showBackButton />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: hp(2) + insets.bottom }]}
      >
        <ThemedText style={[styles.subtitle, { color: colors.text }]}>
          {t("tip_calculator.subtitle")}
        </ThemedText>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              {t("tip_calculator.bill_amount")}
            </ThemedText>
            <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formatCurrency(parseFloat(billAmount || "0"))}
                onChangeText={handleBillAmountChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.icon}
              />
              <ThemedText style={[styles.currency, { color: colors.icon }]}>
                {t("tip_calculator.currency_symbol")}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                {t("tip_calculator.tip_percent")}
              </ThemedText>
              <View style={[styles.percentInputWrapper, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.percentInput, { color: colors.text }]}
                  value={tipPercentInput}
                  onChangeText={handleTipPercentInputChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                />
                <ThemedText style={[styles.percentSymbol, { color: colors.icon }]}>
                  %
                </ThemedText>
              </View>
            </View>

            <Slider
              style={[styles.slider, isManualInput && { opacity: 0.3 }]}
              minimumValue={0}
              maximumValue={30}
              step={1}
              value={tipPercent}
              onValueChange={handleSliderChange}
              minimumTrackTintColor={colors.tint}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.tint}
            />

            <View style={styles.presetsContainer}>
              {tipPresets.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetButton,
                    {
                      backgroundColor: tipPercent === preset && !isManualInput ? "transparent" : colors.background,
                      borderColor: colors.border,
                      overflow: "hidden",
                    }
                  ]}
                  onPress={() => {
                    setIsManualInput(false);
                    setTipPercent(preset);
                    setTipPercentInput(preset.toString());
                  }}
                  activeOpacity={0.7}
                >
                  {tipPercent === preset && !isManualInput && (
                    <LinearGradient
                      colors={Tokens.gradients.base}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <ThemedText
                    style={[
                      styles.presetText,
                      { color: tipPercent === preset && !isManualInput ? "#fff" : colors.text }
                    ]}
                  >
                    {preset}%
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              {t("tip_calculator.split_number")}
            </ThemedText>

            <View style={styles.peopleContainer}>
              <TouchableOpacity
                style={[
                  styles.peopleButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={handleDecreasePeople}
                activeOpacity={0.7}
                disabled={numberOfPeople <= 1}
              >
                <Ionicons
                  name="remove"
                  size={normalize(24)}
                  color={numberOfPeople <= 1 ? colors.icon : colors.text}
                />
              </TouchableOpacity>

              <View style={styles.peopleCountWrapper}>
                <ThemedText style={[styles.peopleCount, { color: colors.text }]}>
                  {numberOfPeople}
                </ThemedText>
                <ThemedText style={[styles.peopleLabel, { color: colors.icon }]}>
                  {t("tip_calculator.person_unit", { count: numberOfPeople })}
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[
                  styles.peopleButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={handleIncreasePeople}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={normalize(24)} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.resultCard, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.resultTitle, { color: colors.text }]}>
            {t("tip_calculator.results")}
          </ThemedText>

          <View style={styles.resultItem}>
            <ThemedText style={[styles.resultLabel, { color: colors.icon }]} numberOfLines={1}>
              {t("tip_calculator.tip_amount")}
            </ThemedText>
            <ThemedText
              style={[styles.resultValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatCurrency(tipAmount)} {t("tip_calculator.currency_symbol")}
            </ThemedText>
          </View>

          <View style={styles.resultItem}>
            <ThemedText style={[styles.resultLabel, { color: colors.icon }]} numberOfLines={1}>
              {t("tip_calculator.total_bill")}
            </ThemedText>
            <ThemedText
              style={[styles.resultValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatCurrency(totalAmount)} {t("tip_calculator.currency_symbol")}
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={[styles.resultItem, styles.highlightResult]}>
            <ThemedText style={[styles.resultLabel, { color: colors.text }]} numberOfLines={1}>
              {t("tip_calculator.per_person")}
            </ThemedText>
            <ThemedText
              style={[styles.highlightValue, { color: colors.tint }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatCurrency(perPerson)} {t("tip_calculator.currency_symbol")}
            </ThemedText>
          </View>

          <ThemedText style={[styles.disclaimer, { color: colors.icon }]}>
            {t("tip_calculator.disclaimer")}
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TipCalculatorScreen;