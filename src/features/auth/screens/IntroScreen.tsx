import { Images } from '@/utils/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import { hasNotch, normalize } from '@/utils/layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const logoImg = Images.appLogoDark;

// Create AnimatedFlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Slide>);

interface Slide {
  id: number;
  title: string;
  description: string;
  image?: any;
}



const IntroScreen = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  // Use light background and dark text
  const backgroundColor = colors.background;
  const textColor = colors.text;
  const tintColor = colors.tint;

  const SLIDES: Slide[] = [
    {
      id: 1,
      title: t('intro.slide1_title'),
      description: t('intro.slide1_desc'),
    },
    {
      id: 2,
      title: t('intro.slide2_title'),
      description: t('intro.slide2_desc'),
    },
    {
      id: 3,
      title: t('intro.slide3_title'),
      description: t('intro.slide3_desc'),
    },
  ];

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      goToLogin();
    }
  };

  const handleSkip = () => {
    goToLogin();
  };

  const goToLogin = async () => {
    try {
      await AsyncStorage.setItem('hasSeenIntro', 'true');
    } catch (error) {
      console.error('Error saving intro status:', error);
    }
    router.replace('/(auth)/login');
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slideContainer, { width: SCREEN_WIDTH }]}>
        <Animated.View
          style={[
            styles.slideContent,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <ThemedText style={[styles.title, { color: textColor }]}>
              {item.title}
            </ThemedText>
            <ThemedText style={[styles.description, { color: textColor }]}>
              {item.description}
            </ThemedText>
          </View>
        </Animated.View>
      </View>
    );
  };

  // Render pagination dots separately without animation on width
  const renderPaginationDots = () => {
    return SLIDES.map((_, index) => {
      const inputRange = [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ];

      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.3, 1, 0.3],
        extrapolate: 'clamp',
      });

      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [1, 1.5, 1],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              opacity,
              transform: [{ scale }],
              backgroundColor: tintColor,
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Slides */}
        <View style={styles.slidesContainer}>
          <AnimatedFlatList
            ref={flatListRef}
            data={SLIDES}
            renderItem={renderSlide}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            keyExtractor={(item) => item.id.toString()}
            bounces={false}
            scrollEventThrottle={16}
          />
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          {/* Pagination Dots */}
          <View style={styles.pagination}>{renderPaginationDots()}</View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextBtn, { backgroundColor: tintColor }]}
              activeOpacity={0.9}
            >
              <ThemedText style={styles.nextText}>
                {currentIndex === SLIDES.length - 1 ? t('common.start') : t('common.continue')}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <ThemedText style={[styles.skipText, { color: textColor }]}>
                {t('common.skip')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  slidesContainer: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(32),
  },

  // Logo
  logoWrapper: {
    marginBottom: normalize(60),
  },
  logo: {
    width: normalize(120),
    height: normalize(120),
  },

  // Text
  textContainer: {
    alignItems: 'center',
    gap: normalize(16),
  },
  title: {
    fontSize: normalize(28),
    fontFamily: Fonts.bold,
    textAlign: 'center',
    lineHeight: normalize(36),
  },
  description: {
    fontSize: normalize(16),
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: normalize(24),
    opacity: 0.8,
    paddingHorizontal: normalize(16),
  },

  // Footer
  footerContainer: {
    paddingHorizontal: normalize(24),
    paddingBottom: hasNotch() ? normalize(10) : normalize(30),
    gap: normalize(24),
  },

  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: normalize(8),
    height: normalize(12),
  },
  dot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
  },

  // Buttons
  buttonContainer: {
    gap: normalize(16),
  },
  nextBtn: {
    paddingVertical: normalize(16),
    borderRadius: normalize(100),
    alignItems: 'center',
    width: '100%',
    shadowColor: Tokens.colors.main.black,
    shadowOffset: { width: 0, height: normalize(4) },
    shadowOpacity: 0.15,
    shadowRadius: normalize(8),
    elevation: 4,
  },
  nextText: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    lineHeight: normalize(24),
    color: Tokens.colors.main.white,
  },
  skipBtn: {
    paddingVertical: normalize(12),
    alignItems: 'center',
  },
  skipText: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
    opacity: 0.7,
  },
});

export default IntroScreen;