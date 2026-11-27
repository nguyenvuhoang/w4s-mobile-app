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
      const [seenIntro, isVerifyFirstLogin] = await Promise.all([
        StorageService.getAsyncItem(StorageKey.hasSeenIntro),
        StorageService.getAsyncItem(StorageKey.isVerifyFirstLogin),
      ]);
      const hasSeenIntro = seenIntro == 'true';
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