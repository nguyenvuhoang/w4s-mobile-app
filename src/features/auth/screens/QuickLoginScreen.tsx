import { ThemedText } from "@/components/themed-text";
import StorageKey from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { useLoginService } from "@/features/auth/hooks/useLoginService";
import StorageService from "@/services/StorageService";
import { AppInfo } from "@/types/UserCommand";
import { Images } from "@/utils/images";
import { normalize } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const logoImg = Images.appLogoLight;
const defaultAvatar = require("@assets/images/default_avatar.png");

const QuickLoginScreen = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const hasCheckedLoginStatus = useRef(false);

  const {
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoggingIn,
    isFetchingAppInfo,
    isLoading,
    isBiometricSupported,
    isAuthenticating,
    appInfo,
    setAppInfo,
    handleLogin,
    handleBiometricLogin,
    handleGetStatusLogin,
    biometricType,
  } = useLoginService();

  useEffect(() => {
    loadAppInfo();
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, [appInfo]);

  const getBiometricIconName = () => {
    if (biometricType === "facial") return "scan-outline";
    return "finger-print-outline";
  };

  const getBiometricLabel = () => {
    if (biometricType === "facial") return t("auth.face_id");
    return t("auth.fingerprint");
  };

  const loadAppInfo = async () => {
    try {
      setPassword("");

      if (appInfo) {
        setUsername(appInfo.login_name);
        return;
      }

      const storedAppInfo = await StorageService.getAsyncItem(StorageKey.appInfo);
      if (storedAppInfo) {
        const parsedAppInfo: AppInfo = JSON.parse(storedAppInfo);
        setAppInfo(parsedAppInfo);
        setUsername(parsedAppInfo.login_name);
      } else {
        await clearDataUser();
        router.replace("/(auth)/login");
      }
    } catch {
      await clearDataUser();
      router.replace("/(auth)/login");
    }
  };

  const checkLoginStatus = async () => {
    if (appInfo?.is_login && !hasCheckedLoginStatus.current) {
      hasCheckedLoginStatus.current = true;
      try {
        const islogin = await handleGetStatusLogin(appInfo.user_code);
        const appInfoData: AppInfo = {
          ...appInfo,
          is_login: islogin,
        };

        await StorageService.setAsyncItem(
          StorageKey.appInfo,
          JSON.stringify(appInfoData)
        );
        setAppInfo(appInfoData);
      } catch {
        await clearDataUser();
        router.replace("/(auth)/login");
      }
    }
  };

  const handlePasswordLogin = async () => {
    if (password.trim() === "") return;
    await handleLogin(false);
  };

  const handleBiometricPress = async () => {
    if (!isBiometricSupported) {
      showNotification(t("auth.biometric_not_supported"), "warning");
      return;
    }

    if (!appInfo?.is_biometric_supported) {
      showNotification(
        t("auth.biometric_not_enabled", { type: getBiometricLabel() }),
        "warning"
      );
      return;
    }

    if (isLoadingAny || isAuthenticating) return;
    await handleBiometricLogin();
  };

  const handleSwitchAccount = () => {
    showNotification(
      t("auth.switch_account_confirm"),
      "warning",
      undefined,
      undefined,
      async () => {
        await clearDataUser();
        router.replace("/(auth)/login");
      }
    );
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgotPassword" as any);
  };

  const handleCreateAccount = () => {
    router.push("/(auth)/register" as any);
  };

  const clearDataUser = async () => {
    await StorageService.removeAsyncItem(StorageKey.appInfo);
    await StorageService.removeAsyncItem(StorageKey.user);
    await StorageService.removeAsyncItem(StorageKey.isVerifyFirstLogin);
    await StorageService.removeAsyncItem(StorageKey.token);
    await StorageService.clearSession();
  };

  const isFormValid = password.trim() !== "";
  const isLoadingAny = isLoggingIn || isFetchingAppInfo || isLoading;

  return (
    <>
      {isLoadingAny && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <ThemedText style={styles.loadingText}>
            {isLoggingIn ? t("auth.logging_in") : t("auth.loading_info")}
          </ThemedText>
        </View>
      )}

      {isAuthenticating && <View style={styles.biometricOverlay} />}

      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <View style={styles.keyboardView}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 80}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <View style={styles.headerCircleLeft} />
                <View style={styles.headerCircleRight} />

                <View style={styles.logoWrap}>
                  <Image source={logoImg} style={styles.logo} resizeMode="contain" />
                </View>

                <ThemedText style={styles.headerTitle}>
                  {t("auth.login")}
                </ThemedText>
              </View>

              <View style={styles.body}>
                <ThemedText style={styles.description}>
                  Vui lòng đăng nhập để sử dụng ứng dụng quản lý tài chính W4S.
                </ThemedText>

                <View style={styles.userInfoRow}>
                  <Image
                    source={appInfo?.avatar ? { uri: appInfo.avatar } : defaultAvatar}
                    style={styles.avatar}
                  />
                  <ThemedText style={styles.username}>
                    Xin chào, {appInfo?.name || appInfo?.login_name || "Avatar"}
                  </ThemedText>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>
                    {t("auth.password")}
                  </ThemedText>

                  <View style={styles.passwordRow}>
                    <View style={styles.passwordInputWrap}>
                      <TextInput
                        style={styles.input}
                        placeholder={t("auth.password_placeholder")}
                        placeholderTextColor="#A8ADB7"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!isLoadingAny}
                        onSubmitEditing={handlePasswordLogin}
                      />

                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={isLoadingAny}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={normalize(20)}
                          color="#98A2B3"
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.biometricSideButton}
                      onPress={handleBiometricPress}
                      disabled={isLoadingAny}
                    >
                      {isAuthenticating ? (
                        <ActivityIndicator size="small" color="#0D63E6" />
                      ) : (
                        <Ionicons
                          name={getBiometricIconName()}
                          size={normalize(24)}
                          color={
                            !isBiometricSupported || !appInfo?.is_biometric_supported
                              ? "#9DB7E8"
                              : "#0D63E6"
                          }
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.linksRow}>
                  <TouchableOpacity onPress={handleSwitchAccount} disabled={isLoadingAny}>
                    <ThemedText style={styles.linkText}>
                      {t("auth.switch_account")}
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={isLoadingAny}
                  >
                    <ThemedText style={styles.linkText}>
                      {t("auth.forgot_password")}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handlePasswordLogin}
                  activeOpacity={0.9}
                  disabled={!isFormValid || isLoadingAny}
                  style={styles.loginButtonWrap}
                >
                  <LinearGradient
                    colors={["#1776F2", "#1EB9E7"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[
                      styles.loginButton,
                      (!isFormValid || isLoadingAny) && styles.loginButtonDisabled,
                    ]}
                  >
                    <ThemedText style={styles.loginButtonText}>
                      {t("auth.login")}
                    </ThemedText>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.registerRow}>
                  <ThemedText style={styles.registerText}>hoặc </ThemedText>
                  <TouchableOpacity
                    onPress={handleCreateAccount}
                    disabled={isLoadingAny}
                  >
                    <ThemedText style={styles.registerLink}>
                      {t("auth.create_account")}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#0D63E6",
  },

  keyboardView: {
    flex: 1,
    backgroundColor: "#E9EEF5",
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: normalize(40),
  },

  header: {
    height: normalize(255),
    backgroundColor: "#0D63E6",
    borderBottomLeftRadius: normalize(34),
    borderBottomRightRadius: normalize(34),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },

  headerCircleLeft: {
    position: "absolute",
    left: normalize(-38),
    bottom: normalize(32),
    width: normalize(135),
    height: normalize(135),
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  headerCircleRight: {
    position: "absolute",
    right: normalize(-32),
    top: normalize(18),
    width: normalize(128),
    height: normalize(128),
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  logoWrap: {
    marginBottom: normalize(16),
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: normalize(100),
    height: normalize(100),
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: normalize(26),
    fontFamily: Fonts.bold,
    lineHeight: normalize(32),
  },

  body: {
    flex: 1,
    paddingHorizontal: normalize(28),
    paddingTop: normalize(28),
    paddingBottom: normalize(24),
  },

  description: {
    textAlign: "center",
    color: "#5D6470",
    fontSize: normalize(16),
    lineHeight: normalize(25),
    fontFamily: Fonts.regular,
    marginBottom: normalize(46),
  },

  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(24),
  },

  avatar: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    marginRight: normalize(14),
  },

  username: {
    flex: 1,
    color: "#2B3040",
    fontSize: normalize(16),
    lineHeight: normalize(22),
    fontFamily: Fonts.bold,
  },

  inputGroup: {
    marginBottom: normalize(12),
  },

  label: {
    fontSize: normalize(15),
    lineHeight: normalize(22),
    color: "#303545",
    fontFamily: Fonts.medium,
    marginBottom: normalize(10),
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInputWrap: {
    flex: 1,
    position: "relative",
  },

  input: {
    height: normalize(54),
    borderRadius: normalize(14),
    backgroundColor: "#F4F4F5",
    paddingHorizontal: normalize(16),
    paddingRight: normalize(44),
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    color: "#1F2430",
    borderWidth: 1,
    borderColor: "transparent",
  },

  eyeButton: {
    position: "absolute",
    right: normalize(14),
    top: normalize(16),
  },

  biometricSideButton: {
    width: normalize(34),
    height: normalize(34),
    marginLeft: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },

  linksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize(58),
  },

  linkText: {
    color: "#0D63E6",
    fontSize: normalize(14),
    fontFamily: Fonts.semiBold,
  },

  loginButtonWrap: {
    marginBottom: normalize(18),
  },

  loginButton: {
    height: normalize(56),
    borderRadius: normalize(28),
    justifyContent: "center",
    alignItems: "center",
  },

  loginButtonDisabled: {
    opacity: 0.55,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    lineHeight: normalize(24),
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  registerText: {
    color: "#444B59",
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
  },

  registerLink: {
    color: "#0D63E6",
    fontSize: normalize(15),
    fontFamily: Fonts.semiBold,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    gap: normalize(16),
  },

  loadingText: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
    color: "#FFFFFF",
  },

  biometricOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
});

export default QuickLoginScreen;