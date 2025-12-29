import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts, Tokens } from '@/core/theme/theme';
import { hasNotch, hp, normalize } from '@/utils/layout';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const logoImg = require('@assets/images/emiwhite.png');

const StartScreen = () => {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const backgroundColor = isDark ? colors.background : colors.tint;
  const onBackgroundColor = Tokens.colors.main.white; 
  const buttonTextColor = backgroundColor;

  const handleStart = () => {
    router.push('/(auth)/intro');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* === HEADER === */}
        <View style={styles.headerContainer}>
          <View style={styles.logoWrapper}>
            <Image 
              source={logoImg} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </View>
          
          <View style={styles.textContainer}>
            <ThemedText style={[styles.appName, { color: onBackgroundColor }]}>
              W4S Mobile
            </ThemedText>
            <ThemedText style={[styles.slogan, { color: onBackgroundColor }]}>
              Đồng hành cùng tài chính của bạn
            </ThemedText>
          </View>
        </View>

        {/* === FOOTER === */}
        <View style={styles.footerContainer}>
          <TouchableOpacity 
            onPress={handleStart} 
            style={styles.startBtn} 
            activeOpacity={0.9}
          >
            <ThemedText style={[styles.startText, { color: buttonTextColor }]}>
              Bắt đầu
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <ThemedText style={[styles.haveAccountText, { color: onBackgroundColor }]}>
              Đã có tài khoản?
            </ThemedText>
            <TouchableOpacity onPress={handleLogin} style={styles.loginBtn}>
              <ThemedText style={[styles.loginText, { color: onBackgroundColor }]}>
                Đăng nhập
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
    justifyContent: 'space-between',
  },
  
  headerContainer: {
    height: hp(60), 
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: normalize(24),
  },
  logo: {
    width: normalize(140),
    height: normalize(140),
  },
  textContainer: {
    alignItems: 'center',
    gap: normalize(8),
  },
  appName: {
    fontSize: normalize(32),
    fontFamily: Fonts.family.bold,
    letterSpacing: normalize(1),
    lineHeight: normalize(42), 
    paddingVertical: normalize(4),
  },
  slogan: {
    fontSize: normalize(16),
    fontFamily: Fonts.family.medium,
    opacity: 0.9,
    lineHeight: normalize(24),
  },

  // --- Footer Styles ---
  footerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: normalize(24),
    paddingBottom: hasNotch() ? normalize(10) : normalize(30),
    gap: normalize(20),
  },
  startBtn: {
    backgroundColor: Tokens.colors.main.white,
    paddingVertical: normalize(16),
    borderRadius: normalize(100), 
    alignItems: 'center',
    width: '100%',
    shadowColor: Tokens.colors.main.black,
    shadowOffset: { width: 0, height: normalize(4) },
    shadowOpacity: 0.25,
    shadowRadius: normalize(8),
    elevation: 6,
  },
  startText: {
    fontSize: normalize(18),
    fontFamily: Fonts.family.bold,
    lineHeight: normalize(24),
  },
  
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: normalize(6),
    paddingVertical: normalize(10),
  },
  haveAccountText: {
    fontSize: normalize(15),
    fontFamily: Fonts.family.regular,
    opacity: 0.85,
  },
  loginBtn: {
    padding: normalize(4),
  },
  loginText: {
    fontSize: normalize(16),
    fontFamily: Fonts.family.bold,
    lineHeight: normalize(22),
  },
});

export default StartScreen;
