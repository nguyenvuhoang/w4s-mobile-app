import { initializeTranslations } from "@/core/i18n/i18n";
import { AppProviders } from "@/core/providers/AppProviders";
import { useAppTheme } from "@/core/theme/ThemeContext";
import {
  Quicksand_300Light,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
  useFonts,
} from "@expo-google-fonts/quicksand";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);
  const [fontsLoaded] = useFonts({
    "Quicksand-Light": Quicksand_300Light,
    "Quicksand-Regular": Quicksand_400Regular,
    "Quicksand-Medium": Quicksand_500Medium,
    "Quicksand-SemiBold": Quicksand_600SemiBold,
    "Quicksand-Bold": Quicksand_700Bold,
  });

  useEffect(() => {
    const init = async () => {
      await initializeTranslations();
      setIsI18nInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (fontsLoaded && isI18nInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isI18nInitialized]);

  if (!fontsLoaded || !isI18nInitialized) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <RootStack />
      </AppProviders>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { colors, isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 300,

          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
      <Stack.Screen
        name="index"
        options={{
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="(auth)"
        options={{
          animation: "fade",
          animationDuration: 200,
        }}
      />
      <Stack.Screen name="(protected)" />
    </Stack>
    </>
  );
}
