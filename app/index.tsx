import StorageKey from '@/constants/StorageKey';
import StorageService from '@/services/StorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkStatusAndNavigate();
  }, []);

  const checkStatusAndNavigate = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const seenIntro = await AsyncStorage.getItem('hasSeenIntro');
      const hasSeenIntro = seenIntro === 'true';

      console.log('hasSeenIntro:', hasSeenIntro);

      const isVerifyFirstLogin = await StorageService.getAsyncItem(
        StorageKey.isVerifyFirstLogin
      );
      const isLogged = isVerifyFirstLogin === 'true';
      // const isLogged = true;

      console.log('isLogged:', isLogged);

      if (!hasSeenIntro) {
        console.log('Navigating to: /(auth)/start');
        router.replace('/(auth)/start');
      } else if (!isLogged) {
        console.log('Navigating to: /(auth)/login');
        router.replace('/(auth)/login');
      } else {
        console.log('Navigating to: /(auth)/quick-login');
        router.replace('/(auth)/quick-login');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      router.replace('/(auth)/start');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F7' }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return null;
}