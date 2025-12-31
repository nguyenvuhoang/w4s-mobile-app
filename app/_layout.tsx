import { AppProviders } from '@/core/providers/AppProviders';
import {
  Quicksand_400Regular,
  Quicksand_700Bold,
  useFonts,
} from '@expo-google-fonts/quicksand';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Quicksand-Regular': Quicksand_400Regular,
    'Quicksand-Bold': Quicksand_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AppProviders>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right', 
          animationDuration: 300,
        }}
      >
        <Stack.Screen 
          name="(auth)" 
          options={{
            animation: 'fade',
            animationDuration: 200,
          }}
        />
        
        <Stack.Screen 
          name="(protected)" 
        />
        
        <Stack.Screen 
          name="index" 
          options={{
            animation: 'fade',
          }}
        />
      </Stack>
    </AppProviders>
  );
}