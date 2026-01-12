import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { normalize } from "@/utils/layout";
import React, { useEffect } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export interface BottomSelectOption<T = any> {
  label: string;
  value: T;
}

interface BottomSelectModalProps<T = any> {
  visible: boolean;
  title: string;
  options: BottomSelectOption<T>[];
  selectedValue?: T;
  onSelect: (option: BottomSelectOption<T>) => void;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.67; // 2/3 màn hình
const HEADER_HEIGHT = normalize(100); // Handle + Title + Padding
const OPTION_HEIGHT = normalize(56); // Chiều cao mỗi option

const BottomSelectModal = <T,>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: BottomSelectModalProps<T>) => {
  const { colors } = useAppTheme();

  const calculateSheetHeight = () => {
    const contentHeight = HEADER_HEIGHT + (options.length * OPTION_HEIGHT);
    return Math.min(contentHeight, MAX_SHEET_HEIGHT);
  };

  const SHEET_HEIGHT = calculateSheetHeight();

  const overlayOpacity = useSharedValue(0);
  const translateY = useSharedValue(SHEET_HEIGHT);
  const startY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(SHEET_HEIGHT, {
        duration: 200,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [visible]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newTranslateY = startY.value + event.translationY;
      if (newTranslateY >= 0) {
        translateY.value = newTranslateY;
        overlayOpacity.value = Math.max(0, 1 - newTranslateY / SHEET_HEIGHT);
      }
    })
    .onEnd((event) => {
      if (translateY.value > SHEET_HEIGHT * 0.25 || event.velocityY > 500) {
        translateY.value = withTiming(SHEET_HEIGHT, {
          duration: 200,
          easing: Easing.in(Easing.ease),
        });
        overlayOpacity.value = withTiming(0, { duration: 150 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
        overlayOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Overlay */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.overlay, overlayStyle]} />
        </TouchableWithoutFeedback>

        {/* Bottom sheet with gesture */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                height: SHEET_HEIGHT,
              },
              sheetStyle,
            ]}
          >
            <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
              {/* Handle bar */}
              <View style={styles.handleContainer}>
                <View
                  style={[styles.handle, { backgroundColor: colors.border }]}
                />
              </View>

              {/* Title */}
              <ThemedText style={[styles.title, { color: colors.text }]}>
                {title}
              </ThemedText>

              {/* Scrollable Options */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                {options.map((item, index) => {
                  const selected = item.value === selectedValue;

                  return (
                    <TouchableWithoutFeedback
                      key={index}
                      onPress={() => {
                        onSelect(item);
                        onClose();
                      }}
                    >
                      <View
                        style={[
                          styles.option,
                          index !== options.length - 1 && {
                            borderBottomWidth: 0.5,
                            borderBottomColor: colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.radio,
                            {
                              borderColor: selected
                                ? colors.tint
                                : colors.border,
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
                      </View>
                    </TouchableWithoutFeedback>
                  );
                })}
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default BottomSelectModal;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    paddingHorizontal: normalize(20),
    paddingTop: normalize(8),
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    // Elevation for Android
    elevation: 5,
  },

  safeArea: {
    flex: 1,
  },

  handleContainer: {
    alignItems: "center",
    paddingVertical: normalize(12),
  },

  handle: {
    width: normalize(40),
    height: normalize(4),
    borderRadius: normalize(2),
    opacity: 0.3,
  },

  title: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    marginBottom: normalize(16),
    marginTop: normalize(4),
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: normalize(8),
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

  optionText: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    flex: 1,
  },
});