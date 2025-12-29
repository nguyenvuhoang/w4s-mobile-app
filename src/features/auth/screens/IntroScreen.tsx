import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/core/theme/theme';

const SLIDES = [
  {
    id: 1,
    title: 'Ngân sách thông minh',
    description: 'Lập ngân sách hàng tháng, theo dõi chi tiêu và tiết kiệm hiệu quả hơn.',
  },
  {
    id: 2,
    title: 'Tối ưu hóa tài chính của bạn',
    description: 'Liên kết tài khoản ngân hàng, thẻ tín dụng và nhiều hơn nữa để theo dõi liền mạch. Nhận cập nhật theo thời gian thực và kiểm soát tài chính của bạn.',
  },
  {
    id: 3,
    title: 'Nắm quyền kiểm soát tài chính',
    description: 'Chào mừng đến với Name! Người bạn đồng hành tài chính cá nhân của bạn. Kiểm soát tiền bạc của bạn một cách dễ dàng và hơn thế.',
  }
];

const IntroScreen = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
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

  return (
    <ThemedView style={styles.container}>
      {/* Logo */}
      <ThemedView style={styles.logoContainer}>
        <ThemedView style={styles.logo}>
          <ThemedView style={[styles.circle, styles.topLeft]} />
          <ThemedView style={[styles.circle, styles.topRight]} />
          <ThemedView style={[styles.circle, styles.bottomLeft]} />
          <ThemedView style={[styles.circle, styles.bottomRight]} />
        </ThemedView>
      </ThemedView>

      {/* Content */}
      <ThemedView style={styles.contentContainer}>
        <ThemedText type="title" style={styles.title}>
          {SLIDES[currentIndex].title}
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          {SLIDES[currentIndex].description}
        </ThemedText>
      </ThemedView>

      {/* Bottom Section */}
      <ThemedView style={styles.bottomSection}>
        {/* Pagination Dots */}
        <ThemedView style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <ThemedView
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot
              ]}
            />
          ))}
        </ThemedView>

        {/* Buttons */}
        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
            <ThemedText style={styles.nextText}>
              {currentIndex === SLIDES.length - 1 ? 'Bắt đầu' : 'Tiếp tục'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <ThemedText style={styles.skipText}>Bỏ qua</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    paddingTop: 80,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  logo: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  circle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#0066FF',
    position: 'absolute',
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.family.bold,
    color: '#0066FF',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: Fonts.size.base,
    fontFamily: Fonts.family.regular,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  bottomSection: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D1D6',
  },
  activeDot: {
    backgroundColor: '#0066FF',
    width: 24,
  },
  buttonContainer: {
    gap: 15,
  },
  nextBtn: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: Fonts.size.base,
    fontFamily: Fonts.family.semiBold,
  },
  skipBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: {
    color: '#666666',
    fontSize: Fonts.size.base,
    fontFamily: Fonts.family.regular,
  },
});

export default IntroScreen;