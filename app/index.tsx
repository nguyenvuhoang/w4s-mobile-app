import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

  useEffect(() => {
    checkIntroStatus();
  }, []);

  const checkIntroStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('hasSeenIntro');
      setHasSeenIntro(value === 'true');
    } catch (error) {
      console.error('Error checking intro status:', error);
      setHasSeenIntro(false);
    }
  };

  if (hasSeenIntro === null) {
    return null;
  }

  return <Redirect href={hasSeenIntro ? "/(auth)/login" : "/(auth)/start"} />;
}