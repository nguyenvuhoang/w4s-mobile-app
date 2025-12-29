import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from './theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: typeof Colors.light; 
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_THEME_KEY = 'W4S_THEME_MODE';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme(); 
  const [mode, setMode] = useState<ThemeMode>('system'); 
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_THEME_KEY);
        if (savedMode) {
            setMode(savedMode as ThemeMode);
        }
      } catch (e) {
        console.warn('Không tìm thấy Theme đã được lưu !', e);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, []);

  const changeMode = async (newMode: ThemeMode) => {
    setMode(newMode);
    await AsyncStorage.setItem(STORAGE_THEME_KEY, newMode);
  };

  const activeScheme = mode === 'system' ? (systemScheme ?? 'light') : mode;
  
  const activeColors = Colors[activeScheme];

  if (!isReady) return null; // Hoặc return <SplashScreen />

  return (
    <ThemeContext.Provider 
      value={{ 
        mode, 
        setMode: changeMode, 
        colors: activeColors,
        isDark: activeScheme === 'dark' 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
