import BottomActionModal, { ActionItem } from '@/components/modals/BottomActionModal';
import { ThemedText } from '@/components/themed-text';
import StorageKey from '@/constants/StorageKey';
import { changeLanguage } from '@/core/i18n/i18n';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import StorageService from '@/services/StorageService';
import { Images } from '@/utils/images';
import { hasNotch, hp, normalize } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const logoImg = Images.appLogoLight;

const StartScreen = () => {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t, i18n } = useTranslation();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const backgroundColor = isDark ? colors.background : colors.brandBlue;
  const onBackgroundColor = Tokens.colors.main.white;
  const buttonTextColor = backgroundColor;

  const handleApplyLanguage = async (lang: string) => {
    await changeLanguage(lang);
    setShowLanguageModal(false);
  };

  const languageActions: ActionItem[] = [
    {
      id: 'vi',
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      label: 'Tiếng Việt',
      onPress: () => handleApplyLanguage('vi'),
      color: i18n.language === 'vi' ? colors.tint : colors.text,
    },
    {
      id: 'en',
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      label: 'English',
      onPress: () => handleApplyLanguage('en'),
      color: i18n.language === 'en' ? colors.tint : colors.text,
    },
  ];

  const handleStart = () => {
    router.push('/(auth)/intro');
  };

  const handleLogin = async () => {
    await StorageService.setAsyncItem(StorageKey.hasSeenIntro, 'true');
    router.push('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Language Switcher */}
        <View style={styles.topContainer}>
          <TouchableOpacity
            onPress={() => setShowLanguageModal(true)}
            style={styles.langBtn}
          >
            <Ionicons name="globe-outline" size={normalize(20)} color={onBackgroundColor} />
            <ThemedText style={[styles.langText, { color: onBackgroundColor }]}>
              {i18n.language === 'vi' ? 'Tiếng Việt' : 'English'}
            </ThemedText>
          </TouchableOpacity>
        </View>

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
            <ThemedText style={[styles.slogan, { color: onBackgroundColor }]}>
              {t('common.welcomeTo')}
            </ThemedText>
            <ThemedText style={[styles.appName, { color: onBackgroundColor }]}>
              W4S BUDGET WALLET
            </ThemedText>
            {/* <ThemedText style={[styles.slogan, { color: onBackgroundColor }]}>
              {t('common.slogan')}
            </ThemedText> */}
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
              {t('common.start')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            style={styles.loginOutlineBtn}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.loginOutlineText, { color: onBackgroundColor }]}>
              {t('auth.login')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <BottomActionModal
          visible={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
          title={t('common.select_language')}
          subtitle={t('settings.language_subtitle') || 'Chọn ngôn ngữ hiển thị'}
          actions={languageActions}
          colors={colors}
          cancelText={t('common.cancel')}
          hasBottomNav={false}
        />
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

  topContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: normalize(24),
    paddingTop: normalize(10),
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(12),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: normalize(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  langText: {
    fontSize: normalize(14),
    fontFamily: Fonts.medium,
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
    fontSize: normalize(24),
    fontFamily: Fonts.bold,
    letterSpacing: normalize(1),
    lineHeight: normalize(42),
    paddingVertical: normalize(4),
  },
  slogan: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
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
    fontFamily: Fonts.medium,
    lineHeight: normalize(24),
  },

  loginOutlineBtn: {
    paddingVertical: normalize(16),
    borderRadius: normalize(100),
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Tokens.colors.main.white,
    backgroundColor: 'transparent',
  },
  loginOutlineText: {
    fontSize: normalize(18),
    fontFamily: Fonts.medium,
    lineHeight: normalize(24),
  },
});

export default StartScreen;
