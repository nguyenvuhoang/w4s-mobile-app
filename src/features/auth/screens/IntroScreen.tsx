import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import StorageKey from '@/constants/StorageKey';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import StorageService from '@/services/StorageService';
import { Images } from '@/utils/images';
import { hasNotch, normalize } from '@/utils/layout';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Slide>);
const AnimatedView = Animated.createAnimatedComponent(View);

interface Slide {
  id: number;
  title: string;
  description: string;
  image?: any;
}

const TOTAL_SLIDES = 3;
const BG_WIDTH = SCREEN_WIDTH * TOTAL_SLIDES;
const LIGHT_AREA_HEIGHT = SCREEN_HEIGHT * 0.62;

// background wave
const SharedWaveBackground = () => {
  const { colors } = useAppTheme();
  const w = BG_WIDTH;
  const h = LIGHT_AREA_HEIGHT;

  // Path tạo 1 dải cong lớn chạy xuyên suốt 3 màn hình.
  const d = `
    M 0 40
    C ${w * 0.12} 0, ${w * 0.22} 0, ${w * 0.36} 70
    C ${w * 0.52} 150, ${w * 0.66} 170, ${w * 0.82} 120
    C ${w * 0.92} 90, ${w * 0.97} 70, ${w} 55
    L ${w} ${h}
    C ${w * 0.88} ${h - 10}, ${w * 0.74} ${h - 30}, ${w * 0.58} ${h - 90}
    C ${w * 0.43} ${h - 150}, ${w * 0.25} ${h - 125}, ${w * 0.08} ${h - 55}
    C ${w * 0.03} ${h - 35}, ${w * 0.01} ${h - 25}, 0 ${h - 18}
    Z
  `;

  return (
    <Svg width={w} height={h} style={styles.sharedBgSvg}>
      <Path d={d} fill={colors.brandBg} />
    </Svg>
  );
};

const IntroScreen = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const flatListRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const slides: Slide[] = [
    {
      id: 1,
      title: t('intro.slide1_title'),
      description: t('intro.slide1_desc'),
      image: Images.onboarding1,
    },
    {
      id: 2,
      title: t('intro.slide2_title'),
      description: t('intro.slide2_desc'),
      image: Images.onboarding2,
    },
    {
      id: 3,
      title: t('intro.slide3_title'),
      description: t('intro.slide3_desc'),
      image: Images.onboarding3,
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      goToLogin();
    }
  };

  const goToLogin = async () => {
    try {
      await StorageService.setAsyncItem(StorageKey.hasSeenIntro, 'true');
    } catch (error) {
      console.error('Error saving intro status:', error);
    }
    router.replace('/(auth)/login');
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const dynamicTranslateY = scrollX.interpolate({
    inputRange: [0, SCREEN_WIDTH, SCREEN_WIDTH * 2],
    outputRange: [normalize(40), normalize(160), normalize(140)],
    extrapolate: 'clamp',
  });

  const renderSlide = ({ item }: { item: Slide }) => {
    return (
      <View style={styles.slideContainer}>
        <View style={styles.imageWrap} pointerEvents="none">
          <AnimatedView style={{ transform: [{ translateY: dynamicTranslateY }] }}>
            {item.image ? (
              <Image source={item.image} style={styles.image} resizeMode="contain" />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}
          </AnimatedView>
        </View>

        <View style={styles.contentWrap}>
          <ThemedText style={styles.title}>{item.title}</ThemedText>
          <ThemedText style={styles.description}>{item.description}</ThemedText>
        </View>
      </View>
    );
  };

  const renderPaginationDots = () =>
    slides.map((_, index) => {
      const inputRange = [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ];

      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.4, 1, 0.4],
        extrapolate: 'clamp',
      });

      return <Animated.View key={index} style={[styles.dot, { opacity }]} />;
    });

  return (
    <View style={[styles.container, { backgroundColor: colors.brandBlue }]}>
      <StatusBar style="light" />
      {/* background lớn chạy xuyên 3 slide */}
      <AnimatedView
        pointerEvents="none"
        style={[
          styles.sharedBackgroundContainer,
          {
            transform: [
              {
                translateX: Animated.multiply(scrollX, -1),
              },
            ],
          },
        ]}
      >
        <SharedWaveBackground />
      </AnimatedView>

      <AnimatedFlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.list}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.pagination}>{renderPaginationDots()}</View>

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={goToLogin} style={styles.skipBtn} activeOpacity={0.7}>
            <ThemedText style={styles.skipText}>{t('common.skip')}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.8}>
            <ThemedText style={[styles.nextText, { color: colors.brandBlue }]}>
              {currentIndex === slides.length - 1
                ? t('common.start')
                : t('common.continue')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  list: {
    flex: 1,
    zIndex: 2,
  },

  sharedBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BG_WIDTH,
    height: LIGHT_AREA_HEIGHT,
    zIndex: 0,
  },

  sharedBgSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    backgroundColor: 'transparent',
  },

  imageWrap: {
    height: LIGHT_AREA_HEIGHT,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  image: {
    width: SCREEN_WIDTH,
    // height: SCREEN_HEIGHT * 0.40,
  },

  imagePlaceholder: {
    width: SCREEN_WIDTH * 0.72,
    height: SCREEN_WIDTH * 0.72,
    borderRadius: normalize(24),
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  contentWrap: {
    marginTop: normalize(8),
    paddingHorizontal: normalize(28),
    alignItems: 'center',
  },

  title: {
    fontSize: normalize(22),
    lineHeight: normalize(30),
    fontFamily: Fonts.bold,
    color: Tokens.colors.main.white,
    textAlign: 'center',
    marginBottom: normalize(10),
  },

  description: {
    fontSize: normalize(15),
    lineHeight: normalize(24),
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
  },

  footer: {
    paddingHorizontal: normalize(30),
    paddingTop: normalize(12),
    paddingBottom: hasNotch() ? normalize(8) : normalize(20),
    backgroundColor: 'transparent',
    gap: normalize(24),
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: normalize(10),
  },

  dot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
    borderWidth: 1,
    borderColor: Tokens.colors.main.white,
    backgroundColor: Tokens.colors.main.white,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  skipBtn: {
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(4),
  },

  skipText: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
    color: Tokens.colors.main.white,
  },

  nextBtn: {
    minWidth: normalize(104),
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(14),
    borderRadius: normalize(999),
    backgroundColor: Tokens.colors.main.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextText: {
    fontSize: normalize(16),
    lineHeight: normalize(22),
    fontFamily: Fonts.bold,
  },
});

export default IntroScreen;