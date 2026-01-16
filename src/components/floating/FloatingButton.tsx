import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingButtonProps {
  imageSource: any;
  size?: number;
  initialPosition?: { x: number; y: number };
  onPress?: () => void;
  snapToEdge?: boolean;
  glowColor?: string; // Màu glow (mặc định: xanh dương)
  enablePulse?: boolean; // Bật hiệu ứng nhấp nháy
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  imageSource,
  size = 50,
  initialPosition = {
    x: SCREEN_WIDTH - 80,
    y: SCREEN_HEIGHT / 2,
  },
  onPress,
  snapToEdge = true,
  glowColor = '#4A90E2',
  enablePulse = true,
}) => {
  /** ======================
   * Shared values
   ======================= */
  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const scale = useSharedValue(1);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // ✨ Glow animation
  const glowOpacity = useSharedValue(0.6);
  const glowScale = useSharedValue(1);

  /** ======================
   * Pulse effect khi mount
   ======================= */
  useEffect(() => {
    if (enablePulse) {
      // Hiệu ứng pulse nhẹ nhàng
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
          withTiming(0.4, { duration: 1500 })
        ),
        -1, // infinite
        true // reverse
      );

      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [enablePulse]);

  /** ======================
   * TAP GESTURE
   ======================= */
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onStart(() => {
      scale.value = withSpring(0.9);
    })
    .onEnd((_e, success) => {
      scale.value = withSpring(1);
      if (success && onPress) {
        glowOpacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0.6, { duration: 300 })
        );
        runOnJS(onPress)();
      }
    });

  /** ======================
   * PAN GESTURE
   ======================= */
  const panGesture = Gesture.Pan()
    .minDistance(10) // Chỉ kích hoạt khi kéo > 10px
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      scale.value = withSpring(0.9);
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);

      let finalX = translateX.value;
      let finalY = translateY.value;

      const minX = 0;
      const maxX = SCREEN_WIDTH - size;
      const minY = 0;
      const maxY = SCREEN_HEIGHT - size - 100;

      finalX = Math.max(minX, Math.min(maxX, finalX));
      finalY = Math.max(minY, Math.min(maxY, finalY));

      if (snapToEdge) {
        const isLeft = finalX < SCREEN_WIDTH / 2;
        finalX = isLeft ? 4 : SCREEN_WIDTH - size - 4;
      }

      translateX.value = withSpring(finalX, {
        damping: 15,
        stiffness: 150,
      });

      translateY.value = withSpring(finalY, {
        damping: 15,
        stiffness: 150,
      });
    });

  /** ======================
   * Gesture - Tap có ưu tiên cao hơn Pan
   ======================= */
  const composedGesture = Gesture.Race(tapGesture, panGesture);

  /** ======================
   * Animated styles
   ======================= */
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.container,
          animatedStyle,
          { width: size, height: size },
        ]}
      >
        {/*Glow layer*/}
        <Animated.View
          style={[
            styles.glowOuter,
            glowAnimatedStyle,
            {
              width: size + 5,
              height: size + 5,
              borderRadius: (size + 5) / 2,
              backgroundColor: glowColor,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.imageContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Image
            source={imageSource}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
            resizeMode="cover"
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

export default FloatingButton;

/** ======================
 * Styles
 ======================= */
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    opacity: 0.2,
  },
  glowInner: {
    position: 'absolute',
  },
  imageContainer: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});