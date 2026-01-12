import AppHeader from "@/components/base/AppHeader";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TipCalculatorScreen = () => {
  const { colors } = useAppTheme();
  const [billAmount, setBillAmount] = useState("450000");
  const [tipPercent, setTipPercent] = useState(10);
  const [numberOfPeople, setNumberOfPeople] = useState(2);
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
    return new Intl.NumberFormat("vi-VN").format(Math.round(value));
  };

  const handleBillAmountChange = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, "");
    setBillAmount(cleaned);
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
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Tính tiền típ" showBackButton />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Subtitle */}
        <ThemedText style={[styles.subtitle, { color: colors.text }]}>
          Hỗ trợ chia tiền hóa đơn khi đi ăn, đi chơi
        </ThemedText>

        {/* Input Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Bill Amount */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              Số tiền hóa đơn
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
                đ
              </ThemedText>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Tip Percentage */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Phần trăm típ
              </ThemedText>
              <View style={[styles.percentBadge, { backgroundColor: colors.tint }]}>
                <ThemedText style={styles.percentBadgeText}>
                  {tipPercent}%
                </ThemedText>
              </View>
            </View>

            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={30}
              step={1}
              value={tipPercent}
              onValueChange={setTipPercent}
              minimumTrackTintColor={colors.tint}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.tint}
            />

            {/* Tip Presets */}
            <View style={styles.presetsContainer}>
              {tipPresets.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetButton,
                    { 
                      backgroundColor: tipPercent === preset ? colors.tint : colors.background,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setTipPercent(preset)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.presetText,
                      { color: tipPercent === preset ? "#fff" : colors.text }
                    ]}
                  >
                    {preset}%
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Number of People */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.text }]}>
              Số người chia
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
                  người
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

        {/* Result Card */}
        <View style={[styles.card, styles.resultCard, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.resultTitle, { color: colors.text }]}>
            Kết quả tính toán
          </ThemedText>

          <View style={styles.resultItem}>
            <ThemedText style={[styles.resultLabel, { color: colors.icon }]} numberOfLines={1}>
              Tiền típ
            </ThemedText>
            <ThemedText 
              style={[styles.resultValue, { color: colors.text }]} 
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatCurrency(tipAmount)} đ
            </ThemedText>
          </View>

          <View style={styles.resultItem}>
            <ThemedText style={[styles.resultLabel, { color: colors.icon }]} numberOfLines={1}>
              Tổng hóa đơn
            </ThemedText>
            <ThemedText 
              style={[styles.resultValue, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatCurrency(totalAmount)} đ
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={[styles.resultItem, styles.highlightResult]}>
            <ThemedText style={[styles.resultLabel, { color: colors.text }]} numberOfLines={1}>
              Mỗi người trả
            </ThemedText>
            <ThemedText 
              style={[styles.highlightValue, { color: colors.tint }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatCurrency(perPerson)} đ
            </ThemedText>
          </View>

          <ThemedText style={[styles.disclaimer, { color: colors.icon }]}>
            * Số tiền đã được làm tròn
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(16),
  },
  
  // Subtitle
  subtitle: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    opacity: 0.7,
    lineHeight: normalize(20),
  },

  // Card
  card: {
    borderRadius: normalize(16),
    padding: normalize(20),
    gap: normalize(20),
  },

  // Section
  section: {
    gap: normalize(12),
  },
  label: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    lineHeight: normalize(20),
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Divider
  divider: {
    height: 1,
    opacity: 0.1,
  },

  // Input
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    paddingBottom: normalize(12),
  },
  input: {
    flex: 1,
    fontSize: normalize(28),
    fontFamily: Fonts.bold,
    padding: 0,
  },
  currency: {
    fontSize: normalize(20),
    fontFamily: Fonts.medium,
    marginLeft: normalize(8),
  },

  // Slider
  slider: {
    width: "100%",
    height: normalize(40),
  },
  percentBadge: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(100),
  },
  percentBadgeText: {
    fontSize: normalize(14),
    fontFamily: Fonts.bold,
    color: "#fff",
  },

  // Presets
  presetsContainer: {
    flexDirection: "row",
    gap: normalize(8),
  },
  presetButton: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(12),
    alignItems: "center",
    borderWidth: 1,
  },
  presetText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
  },

  // People Counter
  peopleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: normalize(32),
  },
  peopleButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  peopleCountWrapper: {
    alignItems: "center",
    gap: normalize(4),
  },
  peopleCount: {
    fontSize: normalize(32),
    fontFamily: Fonts.bold,
    lineHeight: normalize(40),
  },
  peopleLabel: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
  },

  // Result
  resultCard: {
    gap: normalize(16),
  },
  resultTitle: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    lineHeight: normalize(22),
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: normalize(12),
  },
  resultLabel: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    flexShrink: 0,
  },
  resultValue: {
    fontSize: normalize(16),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  highlightResult: {
    paddingTop: normalize(8),
  },
  highlightValue: {
    fontSize: normalize(24),
    fontFamily: Fonts.bold,
    textAlign: "right",
    flex: 1,
  },
  disclaimer: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: normalize(8),
    opacity: 0.6,
  },
});

export default TipCalculatorScreen;