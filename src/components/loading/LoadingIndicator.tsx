import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { normalize, wp } from "@/utils/layout";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from "react-native";

type LoadingIndicatorProps = {
  text?: string;
  visible?: boolean;
  overlay?: boolean;
};

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  text,
  visible = true,
  overlay = false,
}) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const clipHeight = useRef(new Animated.Value(0)).current;
  
  // Lấy bộ màu từ Context
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
    }
  }, [visible]);

  if (!visible) return null;

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

      {text && (
        <Animated.Text
          style={[
            styles.logoText,
            { 
                color: colors.tint, 
                opacity 
            },
          ]}
        >
          {text}
        </Animated.Text>
      )}
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
  logoText: {
    textAlign: "center",
    marginTop: normalize(5),
    fontSize: normalize(14),
    fontFamily: Fonts.bold,
  },
});

export default LoadingIndicator;
