import { ThemedText } from "@/components/themed-text";
import StorageKey from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { Tokens } from "@/core/theme/theme";
import { useLoginService } from "@/features/auth/hooks/useLoginService";
import StorageService from "@/services/StorageService";
import { AppInfo } from "@/types/UserCommand";
import { Images } from "@/utils/images";
import { normalize } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
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
    biometricType, // "none" | "fingerprint" | "facial"
  } = useLoginService();

  useEffect(() => {
    loadAppInfo();
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, [appInfo]);

  /* ========= BIOMETRIC HELPERS (KHÔNG ẢNH HƯỞNG UI) ========= */

  const getBiometricIconName = () => {
    if (biometricType === "facial") return "scan-outline";
    return "finger-print-outline"; // fingerprint + none
  };

  const getBiometricLabel = () => {
    if (biometricType === "facial") return "khuôn mặt";
    return "vân tay";
  };

  /* ================= LOGIC ================= */

  const loadAppInfo = async () => {
    try {
      setPassword("");

      if (appInfo) {
        setUsername(appInfo.login_name);
        return;
      }

      const storedAppInfo = await StorageService.getAsyncItem(
        StorageKey.appInfo,
      );
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
          JSON.stringify(appInfoData),
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
      showNotification("Thiết bị không hỗ trợ sinh trắc học", "warning");
      return;
    }

    if (!appInfo?.is_biometric_supported) {
      showNotification(
        `Bạn chưa kích hoạt đăng nhập bằng ${getBiometricLabel()}`,
        "warning",
      );
      return;
    }

    if (isLoadingAny || isAuthenticating) return;

    await handleBiometricLogin();
  };

  const handleSwitchAccount = () => {
    showNotification(
      "Bạn có chắc muốn đăng nhập tài khoản khác?",
      "warning",
      undefined,
      undefined,
      async () => {
        await clearDataUser();
        router.replace("/(auth)/login");
      },
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
    await StorageService.removeAsyncItem(StorageKey.userSession);
  };

  const isFormValid = password.trim() !== "";
  const isLoadingAny = isLoggingIn || isFetchingAppInfo || isLoading;

  /* ================= UI ================= */

  return (
    <>
      {isLoadingAny && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={[styles.loadingText, { color: "#fff" }]}>
            {isLoggingIn ? "Đang đăng nhập..." : "Đang tải thông tin..."}
          </ThemedText>
        </View>
      )}

      {isAuthenticating && <View style={styles.biometricOverlay} />}

      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top */}
            <View style={styles.topHalf}>
              <View style={styles.logoContainer}>
                <View
                  style={[styles.logoWrapper, { backgroundColor: colors.tint }]}
                >
                  <Image
                    source={logoImg}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <ThemedText style={[styles.title, { color: colors.text }]}>
                Đăng nhập
              </ThemedText>
            </View>

            {/* Bottom */}
            <View style={styles.bottomHalf}>
              <View style={styles.userInfoRow}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={
                      appInfo?.avatar ? { uri: appInfo.avatar } : defaultAvatar
                    }
                    style={styles.avatar}
                  />
                </View>
                <ThemedText style={[styles.username, { color: colors.text }]}>
                  Xin chào, {appInfo?.name || appInfo?.login_name || "User"}
                </ThemedText>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  Mật khẩu
                </ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor={colors.icon}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!isLoadingAny}
                    onSubmitEditing={handlePasswordLogin}
                  />

                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={normalize(22)}
                      color={colors.icon}
                    />
                  </TouchableOpacity>

                  {/* 🔐 BIOMETRIC – LUÔN HIỂN THỊ */}
                  <TouchableOpacity
                    style={styles.biometricIcon}
                    onPress={handleBiometricPress}
                    disabled={isLoadingAny}
                  >
                    {isAuthenticating ? (
                      <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                      <View
                        style={[
                          styles.biometricButton,
                          {
                            borderColor: colors.tint,
                            opacity:
                              !isBiometricSupported ||
                              !appInfo?.is_biometric_supported
                                ? 0.4
                                : 1,
                          },
                        ]}
                      >
                        <Ionicons
                          name={getBiometricIconName()}
                          size={normalize(24)}
                          color={colors.tint}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login */}
              <TouchableOpacity
                onPress={handlePasswordLogin}
                style={[
                  styles.loginButton,
                  { backgroundColor: colors.tint },
                  (!isFormValid || isLoadingAny) && styles.loginButtonDisabled,
                ]}
                disabled={!isFormValid || isLoadingAny}
              >
                <ThemedText style={styles.loginButtonText}>
                  Đăng nhập
                </ThemedText>
              </TouchableOpacity>

              <View style={styles.linksContainer}>
                <TouchableOpacity onPress={handleSwitchAccount}>
                  <ThemedText style={{ color: colors.tint }}>
                    Đổi tài khoản
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <ThemedText style={{ color: colors.tint }}>
                    Quên mật khẩu?
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity onPress={handleCreateAccount}>
                  <ThemedText style={{ color: colors.text }}>
                    Tạo tài khoản
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topHalf: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: normalize(250),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: normalize(24),
  },
  logoWrapper: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(20),
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: normalize(50),
    height: normalize(50),
  },
  title: {
    fontSize: normalize(28),
    fontFamily: Fonts.bold,
    textAlign: "center",
    lineHeight: normalize(36),
  },
  bottomHalf: {
    flex: 1,
    paddingHorizontal: normalize(24),
    paddingTop: normalize(20),
    paddingBottom: normalize(20),
    justifyContent: "flex-start",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(20),
    gap: normalize(12),
  },
  avatarContainer: {},
  avatar: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
  },
  username: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
    lineHeight: normalize(22),
    flex: 1,
  },
  inputContainer: {
    marginBottom: normalize(20),
  },
  label: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    marginBottom: normalize(8),
    lineHeight: normalize(20),
  },
  input: {
    height: normalize(52),
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    fontSize: normalize(16),
    fontFamily: Fonts.regular,
    borderWidth: 1,
    lineHeight: normalize(22),
    paddingTop: normalize(15),
    paddingBottom: normalize(15),
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: normalize(100),
  },
  eyeIcon: {
    position: "absolute",
    right: normalize(56),
    top: normalize(15),
  },
  biometricIcon: {
    position: "absolute",
    right: normalize(16),
    top: normalize(12),
  },
  biometricButton: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(8),
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButton: {
    height: normalize(52),
    borderRadius: normalize(100),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize(16),
    shadowColor: Tokens.colors.main.black,
    shadowOffset: { width: 0, height: normalize(4) },
    shadowOpacity: 0.15,
    shadowRadius: normalize(8),
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    color: Tokens.colors.main.white,
    lineHeight: normalize(24),
  },
  linksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: normalize(8),
    marginBottom: normalize(16),
  },
  linkText: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    lineHeight: normalize(20),
  },
  footer: {
    alignItems: "center",
    paddingBottom: normalize(10),
  },
  createAccountText: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
    lineHeight: normalize(22),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    gap: normalize(16),
  },
  loadingText: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
  },
  biometricOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
  },
});

export default QuickLoginScreen;
