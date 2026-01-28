import StorageKey from '@/constants/StorageKey';
import StorageService from '@/services/StorageService';
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
      await new Promise(resolve => setTimeout(resolve, 500));

      const seenIntro = await StorageService.getAsyncItem(StorageKey.hasSeenIntro);
      const hasSeenIntro = seenIntro == 'true';

      const isVerifyFirstLogin = await StorageService.getAsyncItem(StorageKey.isVerifyFirstLogin);
      const isLogged = isVerifyFirstLogin == 'true';

      if (!hasSeenIntro) {
        router.replace("/(auth)/start");
      } else {
        if (!isLogged) {
          router.replace("/(auth)/login");
        } else {
          router.replace("/(auth)/quick-login");
        }
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