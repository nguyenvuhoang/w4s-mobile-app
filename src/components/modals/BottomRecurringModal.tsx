import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { normalize } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardEvent,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export type RecurringType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringResult {
  type: RecurringType;
  count: number | null;
  isForever: boolean;
  selectedDays: number[] | null;
  label: string;
}

interface BottomRecurringModalProps {
  visible: boolean;
  title?: string;
  initialRecurringType?: RecurringType;
  initialRecurringCount?: number;
  initialIsForever?: boolean;
  initialSelectedDays?: number[];
  onSelect: (result: RecurringResult) => void;
  onClose: () => void;
}

const RECURRING_TYPES = [
  { value: "none" as RecurringType, label: "Không lặp lại", defaultCount: 0 },
  { value: "daily" as RecurringType, label: "Hàng Ngày", defaultCount: 30 },
  { value: "weekly" as RecurringType, label: "Hàng Tuần", defaultCount: 12 },
  { value: "monthly" as RecurringType, label: "Hàng Tháng", defaultCount: 12 },
  { value: "yearly" as RecurringType, label: "Hàng Năm", defaultCount: 5 },
];

const WEEK_DAYS = [
  { value: 0, label: "CN" },
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
];

const BottomRecurringModal: React.FC<BottomRecurringModalProps> = ({
  visible,
  title = "Chu kỳ lặp lại",
  initialRecurringType = "monthly",
  initialRecurringCount = 1,
  initialIsForever = false,
  initialSelectedDays = [1],
  onSelect,
  onClose,
}) => {
  const { colors } = useAppTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // States
  const [recurringType, setRecurringType] =
    useState<RecurringType>(initialRecurringType);
  const [recurringCount, setRecurringCount] = useState(
    initialRecurringCount.toString(),
  );
  const [isForever, setIsForever] = useState(initialIsForever);
  const [selectedDays, setSelectedDays] =
    useState<number[]>(initialSelectedDays);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keyboard listener — đẩy modal lên khi bàn phím xuất hiện
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Initialize state when modal opens
  useEffect(() => {
    if (visible) {
      setRecurringType(initialRecurringType);
      setRecurringCount(initialRecurringCount.toString());
      setIsForever(initialIsForever);
      setSelectedDays(initialSelectedDays);
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [
    visible,
    initialRecurringType,
    initialRecurringCount,
    initialIsForever,
    initialSelectedDays,
  ]);

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
    [],
  );

  // Handle sheet changes
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  // Toggle week day selection
  const toggleWeekDay = useCallback((dayValue: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayValue)) {
        return prev.filter((d) => d !== dayValue);
      }
      return [...prev, dayValue].sort();
    });
  }, []);

  // Handle recurring type change
  const handleRecurringTypeChange = useCallback(
    (type: RecurringType) => {
      setRecurringType(type);
      const typeConfig = RECURRING_TYPES.find((t) => t.value === type);
      if (typeConfig && !isForever && type !== "none") {
        setRecurringCount(typeConfig.defaultCount.toString());
      }
    },
    [isForever],
  );

  // Get recurring label for preview
  const getRecurringLabel = useMemo(() => {
    if (recurringType === "none") {
      return "Không lặp lại";
    }

    const typeLabel =
      RECURRING_TYPES.find((t) => t.value === recurringType)?.label || "";

    if (isForever) {
      if (recurringType === "weekly" && selectedDays.length > 0) {
        const dayLabels = selectedDays
          .map((d) => WEEK_DAYS.find((day) => day.value === d)?.label)
          .filter(Boolean)
          .join(", ");
        return `${typeLabel} (${dayLabels}) - Vĩnh viễn`;
      }
      return `${typeLabel} - Vĩnh viễn`;
    }

    const count = recurringCount || "0";
    if (recurringType === "weekly" && selectedDays.length > 0) {
      const dayLabels = selectedDays
        .map((d) => WEEK_DAYS.find((day) => day.value === d)?.label)
        .filter(Boolean)
        .join(", ");
      return `${typeLabel} (${dayLabels}) - ${count} lần`;
    }

    return `${typeLabel} - ${count} lần`;
  }, [recurringType, recurringCount, selectedDays, isForever]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    onSelect({
      type: recurringType,
      count:
        recurringType === "none" || isForever ? null : parseInt(recurringCount),
      isForever: recurringType !== "none" && isForever,
      selectedDays: recurringType === "weekly" ? selectedDays : null,
      label: getRecurringLabel,
    });
    onClose();
  }, [
    recurringType,
    recurringCount,
    isForever,
    selectedDays,
    getRecurringLabel,
    onSelect,
    onClose,
  ]);

  // Don't render when not visible
  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      enableDynamicSizing
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleSheetChange}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      maxDynamicContentSize={SCREEN_HEIGHT * 0.8}
    >
      <BottomSheetView style={{ paddingBottom: keyboardHeight }}>
        {/* Modal Header */}
        <View
          style={[styles.modalHeader, { borderBottomColor: colors.border }]}
        >
          <CustomText style={[styles.modalTitle, { color: colors.text }]}>
            {title}
          </CustomText>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome6
              name="xmark"
              size={normalize(24)}
              color={colors.icon}
            />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={{ maxHeight: SCREEN_HEIGHT * 0.65 }}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled
        >
          {/* Recurring Type Selection */}
          <CustomText style={[styles.modalLabel, { color: colors.text }]}>
            Loại chu kỳ
          </CustomText>
          <View style={styles.typeContainer}>
            {RECURRING_TYPES.map((type) => {
              const isSelected = recurringType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: isSelected ? colors.tint : colors.card,
                      borderColor: isSelected ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => handleRecurringTypeChange(type.value)}
                >
                  <CustomText
                    style={[
                      styles.typeText,
                      {
                        color: isSelected ? "#fff" : colors.text,
                        fontFamily: isSelected ? Fonts.semiBold : Fonts.regular,
                      },
                    ]}
                  >
                    {type.label}
                  </CustomText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Weekly Day Selection */}
          {recurringType === "weekly" && (
            <View style={styles.weeklySection}>
              <CustomText style={[styles.modalLabel, { color: colors.text }]}>
                Chọn ngày trong tuần
              </CustomText>
              <View style={styles.weekDaysContainer}>
                {WEEK_DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day.value);
                  return (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.dayButton,
                        {
                          backgroundColor: isSelected
                            ? colors.tint
                            : colors.card,
                          borderColor: isSelected ? colors.tint : colors.border,
                        },
                      ]}
                      onPress={() => toggleWeekDay(day.value)}
                    >
                      <CustomText
                        style={[
                          styles.dayText,
                          {
                            color: isSelected ? "#fff" : colors.text,
                            fontFamily: isSelected
                              ? Fonts.semiBold
                              : Fonts.regular,
                          },
                        ]}
                      >
                        {day.label}
                      </CustomText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Recurring Count - only show if not "none" */}
          {recurringType !== "none" && (
            <>
              <CustomText style={[styles.modalLabel, { color: colors.text }]}>
                Số lần lặp
              </CustomText>

              {/* Forever Toggle */}
              <TouchableOpacity
                style={[
                  styles.foreverContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setIsForever(!isForever)}
                activeOpacity={0.7}
              >
                <View style={styles.foreverLeft}>
                  <FontAwesome6
                    name="infinity"
                    size={normalize(18)}
                    color={isForever ? colors.tint : colors.icon}
                  />
                  <CustomText
                    style={[styles.foreverText, { color: colors.text }]}
                  >
                    Lặp vĩnh viễn
                  </CustomText>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isForever ? colors.tint : colors.card,
                      borderColor: isForever ? colors.tint : colors.border,
                    },
                  ]}
                >
                  {isForever && (
                    <FontAwesome6
                      name="check"
                      size={normalize(12)}
                      color="#fff"
                    />
                  )}
                </View>
              </TouchableOpacity>

              {/* Count Input */}
              {!isForever && (
                <View
                  style={[
                    styles.countContainer,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.countInput, { color: colors.text }]}
                    placeholder="1"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                    value={recurringCount}
                    onChangeText={setRecurringCount}
                  />
                  <CustomText
                    style={[styles.countUnit, { color: colors.icon }]}
                  >
                    lần
                  </CustomText>
                </View>
              )}

              {/* Preview */}
              <View
                style={[
                  styles.previewContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.tint + "30",
                  },
                ]}
              >
                <CustomText
                  style={[styles.previewLabel, { color: colors.icon }]}
                >
                  Xem trước:
                </CustomText>
                <CustomText
                  style={[styles.previewText, { color: colors.text }]}
                >
                  {getRecurringLabel}
                </CustomText>
                {recurringType === "weekly" && selectedDays.length > 0 && (
                  <CustomText
                    style={[styles.previewDays, { color: colors.icon }]}
                  >
                    Lặp lại vào:{" "}
                    {selectedDays
                      .map(
                        (d) => WEEK_DAYS.find((day) => day.value === d)?.label,
                      )
                      .filter(Boolean)
                      .join(", ")}
                  </CustomText>
                )}
              </View>
            </>
          )}
        </ScrollView>

        {/* Modal Footer */}
        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.tint }]}
            onPress={handleConfirm}
          >
            <CustomText style={styles.confirmText}>Xác nhận</CustomText>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default BottomRecurringModal;

const styles = StyleSheet.create({
  modalHeader: {
    padding: normalize(16),
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: normalize(18),
    fontFamily: Fonts.semiBold,
  },
  modalContent: {
    padding: normalize(16),
    paddingBottom: normalize(8),
  },
  modalLabel: {
    fontSize: normalize(14),
    marginBottom: normalize(12),
    fontFamily: Fonts.medium,
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(8),
    marginBottom: normalize(20),
  },
  typeButton: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(10),
    borderRadius: normalize(10),
    borderWidth: 2,
  },
  typeText: {
    fontSize: normalize(14),
  },
  weeklySection: {
    marginBottom: normalize(20),
  },
  weekDaysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  dayText: {
    fontSize: normalize(14),
  },
  countContainer: {
    borderRadius: normalize(12),
    padding: normalize(16),
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  countInput: {
    flex: 1,
    fontSize: normalize(18),
    fontFamily: Fonts.regular,
  },
  countUnit: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
  },
  foreverContainer: {
    borderRadius: normalize(12),
    padding: normalize(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    marginBottom: normalize(12),
  },
  foreverLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  foreverText: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
  },
  checkbox: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(6),
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainer: {
    borderRadius: normalize(12),
    padding: normalize(16),
    borderWidth: 1,
    marginTop: normalize(12),
  },
  previewLabel: {
    fontSize: normalize(12),
    marginBottom: normalize(4),
    fontFamily: Fonts.regular,
  },
  previewText: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
  },
  previewDays: {
    fontSize: normalize(13),
    marginTop: normalize(4),
    fontFamily: Fonts.regular,
  },
  modalFooter: {
    padding: normalize(16),
    borderTopWidth: 1,
  },
  confirmBtn: {
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: normalize(16),
    color: "#fff",
    fontFamily: Fonts.semiBold,
  },
});