import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/core/theme/theme';

const StartScreen = () => {
  const router = useRouter();

  const handleStart = () => {
    router.push('/(auth)/intro');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
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

      {/* Bottom Buttons */}
      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleStart} style={styles.startBtn}>
          <ThemedText style={styles.startText}>Bắt đầu</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogin} style={styles.loginBtn}>
          <ThemedText style={styles.loginText}>Đăng nhập</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066FF',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#FFFFFF',
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
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
    gap: 15,
  },
  startBtn: {
    backgroundColor: '#FFFFFF',
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
  startText: {
    color: '#0066FF',
    fontSize: Fonts.size.lg,
    fontFamily: Fonts.family.semiBold,
  },
  loginBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: Fonts.size.base,
    fontFamily: Fonts.family.medium,
  },
});

export default StartScreen;