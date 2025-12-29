import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/theme';
import { normalize, wp } from "@/utils/layout";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ProgressLoadingIndicatorProps = {
  text?: string;
  visible?: boolean;
  overlay?: boolean;
  progress: number;
  duration?: number;
};

// Component con hiển thị %
const AnimatedPercentage = ({
  progressAnim,
  color,
  fontStyle,
}: {
  progressAnim: Animated.Value;
  color: string;
  fontStyle: any;
}) => {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const listener = progressAnim.addListener(({ value }) => {
      if (inputRef.current) {
        const percent = Math.round(value);
        inputRef.current.setNativeProps({
          text: `${percent}%`,
        });
      }
    });
    return () => {
      progressAnim.removeListener(listener);
    };
  }, [progressAnim]);

  return (
    <TextInput
      ref={inputRef}
      underlineColorAndroid="transparent"
      editable={false}
      defaultValue="0%"
      style={[
        fontStyle,
        { color: color, padding: 0, margin: 0 },
      ]}
    />
  );
};

const ProgressLoadingIndicator: React.FC<ProgressLoadingIndicatorProps> = ({
  text,
  visible = true,
  overlay = false,
  progress = 0,
  duration,
}) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const clipHeight = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const { colors } = useAppTheme();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.timing(clipHeight, {
          toValue: wp(20),
          duration: 800,
          useNativeDriver: false,
          easing: Easing.out(Easing.exp),
        }),
      ]).start();
    } else {
       translateY.setValue(50);
       opacity.setValue(0);
       clipHeight.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (progress < 0) {
      progressAnim.setValue(0);
      return;
    }
    const animDuration = duration ?? (progress >= 100 ? 800 : 1500);
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: animDuration,
      useNativeDriver: false,
      easing: Easing.out(Easing.exp),
    }).start();
  }, [progress, duration]);

  if (!visible) return null;

  const widthInterpolate = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[
        styles.overlay,
        overlay && styles.overlayBackground,
      ]}
      pointerEvents={overlay ? "auto" : "none"}
    >
      <Animated.View style={[styles.logoMask, { height: clipHeight }]}>
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ translateY }], opacity },
          ]}
        >
          <Image
            source={require("@assets/images/emilogo.gif")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>

      <View style={styles.progressContainer}>
        {/* Thanh Track (Nền) */}
        <View
          style={[
            styles.track,
            { backgroundColor: colors.border },
          ]}
        >
          {/* Thanh Bar (Chạy) */}
          <Animated.View
            style={[
              styles.bar,
              {
                backgroundColor: colors.tint, 
                width: widthInterpolate,
              },
            ]}
          />
        </View>

        <Animated.View style={[styles.textRow, { opacity }]}>
          {text && (
            <Text
              style={[
                styles.logoText,
                { color: colors.tint, marginRight: 5 },
              ]}
            >
              {text}
            </Text>
          )}
          <AnimatedPercentage
            progressAnim={progressAnim}
            color={colors.tint}
            fontStyle={styles.logoText}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  overlayBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  logoMask: {
    width: wp(20),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: wp(20),
    height: wp(20),
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  progressContainer: {
    width: wp(65),
    marginTop: normalize(15),
    alignItems: "center",
  },
  track: {
    width: "100%",
    height: normalize(6),
    borderRadius: normalize(3),
    overflow: "hidden",
    marginBottom: normalize(10),
  },
  bar: {
    height: "100%",
    borderRadius: normalize(3),
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    textAlign: "center",
    fontSize: normalize(14),
    fontFamily: Fonts.family.bold,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});

export default ProgressLoadingIndicator;
