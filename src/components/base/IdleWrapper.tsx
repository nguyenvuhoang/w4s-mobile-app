import { AppConfig } from '@/config/AppConfig';
import { GlobalContext } from '@/contexts/GlobalContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useSettingService } from '@/features/settings/hooks/useSettingService';
import React, { useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, PanResponder, StyleSheet, View } from 'react-native';

const IdleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appState = useRef(AppState.currentState);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionTime = useRef<number>(Date.now());
  const isLoggingOut = useRef(false);
  const currentLoginName = useRef<string | null>(null);
  const { handleLogout } = useSettingService();
  const { showNotification } = useNotification();
  const { appInfo, isIdleLogoutRef } = useContext(GlobalContext);
  const { t } = useTranslation();

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const startIdleTimer = () => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      performLogout();
    }, AppConfig.SESSION.IDLE_TIMEOUT);
  };

  const performLogout = () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    try {
      const rawMessage = t('common.usesessionexpired');
      const message =
        typeof rawMessage === 'string'
          ? rawMessage
          : 'Session expired due to inactivity';

      showNotification(
        message,
        'warning',
        '',
        undefined,
        undefined,
        () => {
          isIdleLogoutRef.current = true;
          if (appInfo?.login_name) {
            handleLogout(appInfo.login_name);
          } else {
            console.warn('[IdleWrapper] Missing login_name, cannot logout');
          }
          isLoggingOut.current = false;
        }
      );
    } catch (err) {
      isLoggingOut.current = false;
      const fallbackMessage =
        'Unexpected error while logging out: ' +
        (err instanceof Error ? err.message : JSON.stringify(err));
      showNotification(fallbackMessage, 'error', '9999');
      console.warn('Logout error:', fallbackMessage);
    }
  };

  const handleUserInteraction = () => {
    lastInteractionTime.current = Date.now();
    clearIdleTimer();
    startIdleTimer();
  };

  const checkIdleTime = () => {
    const now = Date.now();
    const timeSinceLastInteraction = now - lastInteractionTime.current;
    


    if (timeSinceLastInteraction >= AppConfig.SESSION.IDLE_TIMEOUT) {
      // console.log('[IdleWrapper] Idle timeout exceeded, performing logout');
      performLogout();
    } else {
      const remainingTime = AppConfig.SESSION.IDLE_TIMEOUT - timeSinceLastInteraction;
      clearIdleTimer();
      idleTimerRef.current = setTimeout(() => {
        performLogout();
      }, remainingTime);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        handleUserInteraction();
        return false;
      },
      onMoveShouldSetPanResponderCapture: () => {
        handleUserInteraction();
        return false;
      },
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // console.log('[IdleWrapper] App returned to foreground, checking idle time');
        checkIdleTime();
      } else if (nextAppState.match(/inactive|background/)) {
        // console.log('[IdleWrapper] App moved to background');
        clearIdleTimer(); 
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const newLoginName = appInfo?.login_name || null;
    const isNewSession = newLoginName !== currentLoginName.current;

    if (appInfo?.is_login && newLoginName) {
      if (isNewSession) {
        // console.log('[IdleWrapper] New login session detected, resetting timer');
        isLoggingOut.current = false;
        currentLoginName.current = newLoginName;
      }
      
      // console.log('[IdleWrapper] Logged in, starting idle timer');
      lastInteractionTime.current = Date.now();
      startIdleTimer();
    } else {
      currentLoginName.current = null;
      clearIdleTimer();
    }

    return () => clearIdleTimer();
  }, [appInfo?.login_name]);

  if (!appInfo?.is_login || !appInfo?.login_name) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default IdleWrapper;