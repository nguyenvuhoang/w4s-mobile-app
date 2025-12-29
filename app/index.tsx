import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

  useEffect(() => {
    checkIntroStatus();
  }, []);

  const checkIntroStatus = async () => {
    try {
      // const value = await AsyncStorage.getItem('hasSeenIntro2');
      // setHasSeenIntro(value === 'true');
      setHasSeenIntro(false);
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