import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { normalize } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";

export type PeriodType = "WEEK" | "MONTH" | "QUARTER" | "YEAR" | "CUSTOM";

export interface DateRangeResult {
  startDate: Date;
  endDate: Date;
  periodType: PeriodType;
  label: string;
}

interface BottomDateRangeModalProps {
  visible: boolean;
  title: string;
  initialStartDate?: Date;
  initialEndDate?: Date;
  initialPeriodType?: PeriodType;
  onSelect: (result: DateRangeResult) => void;
  onClose: () => void;
}

const BottomDateRangeModal: React.FC<BottomDateRangeModalProps> = ({
  visible,
  title,
  initialStartDate,
  initialEndDate,
  initialPeriodType,
  onSelect,
  onClose,
}) => {
  const { colors, mode } = useAppTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Calculate date ranges
  const getDateRanges = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const day = now.getDay();

    // This week (Monday to Sunday)
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const thisWeekStart = new Date(year, month, date + mondayOffset);
    const thisWeekEnd = new Date(year, month, date + mondayOffset + 6);

    // This month
    const thisMonthStart = new Date(year, month, 1);
    const thisMonthEnd = new Date(year, month + 1, 0);

    // This quarter
    const quarterStartMonth = Math.floor(month / 3) * 3;
    const thisQuarterStart = new Date(year, quarterStartMonth, 1);
    const thisQuarterEnd = new Date(year, quarterStartMonth + 3, 0);

    // This year
    const thisYearStart = new Date(year, 0, 1);
    const thisYearEnd = new Date(year, 11, 31);

    return {
      this_week: { startDate: thisWeekStart, endDate: thisWeekEnd },
      this_month: { startDate: thisMonthStart, endDate: thisMonthEnd },
      this_quarter: { startDate: thisQuarterStart, endDate: thisQuarterEnd },
      this_year: { startDate: thisYearStart, endDate: thisYearEnd },
    };
  };

  const dateRanges = getDateRanges();

  interface PredefinedOption {
    label: string;
    periodType: PeriodType;
    startDate?: Date;
    endDate?: Date;
  }

  const predefinedOptions: PredefinedOption[] = [
    {
      label: "Tuần này",
      periodType: "WEEK" as PeriodType,
      ...dateRanges.this_week,
    },
    {
      label: "Tháng này",
      periodType: "MONTH" as PeriodType,
      ...dateRanges.this_month,
    },
    {
      label: "Quý này",
      periodType: "QUARTER" as PeriodType,
      ...dateRanges.this_quarter,
    },
    {
      label: "Năm này",
      periodType: "YEAR" as PeriodType,
      ...dateRanges.this_year,
    },
    {
      label: "Tùy chỉnh",
      periodType: "CUSTOM" as PeriodType,
    },
  ];

  const [showCustom, setShowCustom] = useState(false);
  const [selectedPeriodType, setSelectedPeriodType] = useState<PeriodType | null>(null);
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // Ref for scroll view to control scrolling
  const scrollViewRef = useRef<any>(null);

  // Dynamic snap points based on content
  const snapPoints = useMemo(() => {
    if (showCustom) {
      return ["85%"]; // Increased from 75% to 85% to show all buttons
    }
    return ["50%"]; // Collapsed for just options
  }, [showCustom]);

  // Initialize state when modal opens
  useEffect(() => {
    if (visible) {
      if (initialPeriodType === "CUSTOM" && initialStartDate && initialEndDate) {
        setShowCustom(true);
        setSelectedPeriodType("CUSTOM");
        setCustomStartDate(initialStartDate);
        setCustomEndDate(initialEndDate);
      } else if (initialPeriodType) {
        setShowCustom(false);
        setSelectedPeriodType(initialPeriodType);
      } else {
        setShowCustom(false);
        setSelectedPeriodType(null);
        setCustomStartDate(new Date());
        setCustomEndDate(new Date());
      }
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  // Handle sheet changes
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDateError = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (customEndDate < customStartDate) {
      return "Ngày kết thúc phải sau ngày bắt đầu";
    }

    if (customEndDate < today) {
      return "Ngày kết thúc không được là quá khứ";
    }

    return null;
  };

  const isDateValid = () => {
    return getDateError() === null;
  };

  const handleOptionPress = (option: PredefinedOption) => {
    if (option.periodType === "CUSTOM") {
      const wasHidden = !showCustom;
      setShowCustom(!showCustom);
      setSelectedPeriodType("CUSTOM");
      
      // Auto scroll to bottom after custom section opens
      if (wasHidden) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300); // Wait for snap point animation to complete
      }
    } else {
      setSelectedPeriodType(option.periodType);
      if (option.startDate && option.endDate) {
        onSelect({
          startDate: option.startDate,
          endDate: option.endDate,
          periodType: option.periodType,
          label: option.label,
        });
        onClose();
      }
    }
  };

  const handleSaveCustom = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (customEndDate < customStartDate) {
      console.warn("End date must be after start date");
      return;
    }

    if (customEndDate < today) {
      console.warn("End date cannot be in the past");
      return;
    }

    onSelect({
      startDate: customStartDate,
      endDate: customEndDate,
      periodType: "CUSTOM",
      label: `Tùy chỉnh (${formatDate(customStartDate)} - ${formatDate(customEndDate)})`,
    });
    onClose();
  };

  const isSelected = (option: PredefinedOption) => {
    return selectedPeriodType === option.periodType;
  };

  // Don't render when not visible
  if (!visible) return null;

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onChange={handleSheetChange}
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        {/* Title */}
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            {title}
          </ThemedText>
        </View>

        {/* Scrollable Content */}
        <BottomSheetScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {predefinedOptions.map((item, index) => {
            const selected = isSelected(item);

            return (
              <View key={index}>
                <TouchableWithoutFeedback
                  onPress={() => handleOptionPress(item)}
                >
                  <View
                    style={[
                      styles.option,
                      {
                        borderBottomWidth: 0.5,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: selected ? colors.tint : colors.border,
                        },
                      ]}
                    >
                      {selected && (
                        <View
                          style={[
                            styles.radioDot,
                            { backgroundColor: colors.tint },
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.optionContent}>
                      <ThemedText
                        style={[
                          styles.optionText,
                          {
                            color: selected ? colors.tint : colors.text,
                          },
                        ]}
                      >
                        {item.label}
                      </ThemedText>
                      {item.periodType !== "CUSTOM" &&
                        item.startDate &&
                        item.endDate && (
                          <ThemedText
                            style={[
                              styles.dateSubtext,
                              { color: colors.text, opacity: 0.6 },
                            ]}
                          >
                            ({formatDate(item.startDate)} -{" "}
                            {formatDate(item.endDate)})
                          </ThemedText>
                        )}
                    </View>
                  </View>
                </TouchableWithoutFeedback>

                {/* Custom Date Picker Section */}
                {item.periodType === "CUSTOM" && showCustom && (
                  <View
                    style={[
                      styles.customSection,
                      {
                        backgroundColor: colors.card,
                        borderBottomWidth: 0.5,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    {/* Info text */}
                    <ThemedText
                      style={[
                        styles.customInfoText,
                        { color: colors.text, opacity: 0.7 },
                      ]}
                    >
                      Chọn khoảng thời gian tùy chỉnh
                    </ThemedText>

                    {/* From Date */}
                    <View style={styles.dateRow}>
                      <ThemedText
                        style={[styles.dateLabel, { color: colors.text }]}
                      >
                        Từ ngày
                      </ThemedText>
                      <TouchableOpacity
                        style={[
                          styles.dateButton,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.tint,
                            borderWidth: 1.5,
                          },
                        ]}
                        onPress={() => setShowStartPicker(true)}
                      >
                        <FontAwesome6
                          name="calendar"
                          size={normalize(14)}
                          color={colors.tint}
                          style={{ marginRight: normalize(8) }}
                        />
                        <ThemedText
                          style={[
                            styles.dateButtonText,
                            {
                              color: colors.text,
                              fontFamily: Fonts.semiBold,
                            },
                          ]}
                        >
                          {formatDate(customStartDate)}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>

                    {/* To Date */}
                    <View style={styles.dateRow}>
                      <ThemedText
                        style={[styles.dateLabel, { color: colors.text }]}
                      >
                        Đến ngày
                      </ThemedText>
                      <TouchableOpacity
                        style={[
                          styles.dateButton,
                          {
                            backgroundColor: colors.card,
                            borderColor: !isDateValid()
                              ? "#FF3B30"
                              : colors.tint,
                            borderWidth: 1.5,
                          },
                        ]}
                        onPress={() => setShowEndPicker(true)}
                      >
                        <FontAwesome6
                          name="calendar"
                          size={normalize(14)}
                          color={!isDateValid() ? "#FF3B30" : colors.tint}
                          style={{ marginRight: normalize(8) }}
                        />
                        <ThemedText
                          style={[
                            styles.dateButtonText,
                            {
                              color: !isDateValid() ? "#FF3B30" : colors.text,
                              fontFamily: Fonts.semiBold,
                            },
                          ]}
                        >
                          {formatDate(customEndDate)}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>

                    {/* Error message */}
                    {getDateError() && (
                      <View style={styles.errorContainer}>
                        <FontAwesome6
                          name="circle-exclamation"
                          size={normalize(14)}
                          color="#FF3B30"
                          solid
                        />
                        <ThemedText
                          style={[styles.errorText, { color: "#FF3B30" }]}
                        >
                          {getDateError()}
                        </ThemedText>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          styles.cancelButton,
                          { borderColor: colors.border },
                        ]}
                        onPress={() => {
                          setShowCustom(false);
                          setSelectedPeriodType(initialPeriodType || null);
                          // Scroll back to top when closing custom section
                          setTimeout(() => {
                            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                          }, 300);
                        }}
                      >
                        <ThemedText
                          style={[styles.buttonText, { color: colors.text }]}
                        >
                          Hủy
                        </ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.button,
                          styles.saveButton,
                          {
                            backgroundColor: isDateValid()
                              ? colors.tint
                              : colors.border,
                            opacity: isDateValid() ? 1 : 0.5,
                          },
                        ]}
                        onPress={handleSaveCustom}
                        disabled={!isDateValid()}
                      >
                        <ThemedText
                          style={[styles.buttonText, { color: "#FFFFFF" }]}
                        >
                          Áp dụng
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Date Pickers */}
      <DatePicker
        modal
        open={showStartPicker}
        date={customStartDate}
        mode="date"
        theme={mode === "dark" ? "dark" : "light"}
        onConfirm={(date) => {
          setShowStartPicker(false);
          setCustomStartDate(date);
        }}
        onCancel={() => setShowStartPicker(false)}
        title="Chọn ngày bắt đầu"
        confirmText="Xác nhận"
        cancelText="Hủy"
      />

      <DatePicker
        modal
        open={showEndPicker}
        date={customEndDate}
        mode="date"
        minimumDate={new Date()}
        theme={mode === "dark" ? "dark" : "light"}
        onConfirm={(date) => {
          setShowEndPicker(false);
          setCustomEndDate(date);
        }}
        onCancel={() => setShowEndPicker(false)}
        title="Chọn ngày kết thúc"
        confirmText="Xác nhận"
        cancelText="Hủy"
      />
    </>
  );
};

export default BottomDateRangeModal;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(16),
  },

  title: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
  },

  scrollContent: {
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(20),
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: normalize(16),
  },

  radio: {
    width: normalize(22),
    height: normalize(22),
    borderRadius: normalize(11),
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(14),
  },

  radioDot: {
    width: normalize(12),
    height: normalize(12),
    borderRadius: normalize(6),
  },

  optionContent: {
    flex: 1,
  },

  optionText: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
  },

  dateSubtext: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
    marginTop: normalize(2),
  },

  customSection: {
    paddingVertical: normalize(20),
    paddingHorizontal: normalize(16),
    gap: normalize(16),
  },

  customInfoText: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    marginBottom: normalize(4),
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: normalize(12),
  },

  dateLabel: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    minWidth: normalize(80),
  },

  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(10),
  },

  dateButtonText: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(8),
    marginTop: normalize(-4),
  },

  errorText: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    flex: 1,
  },

  buttonRow: {
    flexDirection: "row",
    gap: normalize(12),
    marginTop: normalize(12),
  },

  button: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButton: {
    borderWidth: 1.5,
  },

  saveButton: {},

  buttonText: {
    fontSize: normalize(15),
    fontFamily: Fonts.semiBold,
  },
});