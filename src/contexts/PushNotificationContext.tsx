import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

import { logError, logMessage } from '@/services/LoggerService';
import StorageService from '@/services/StorageService';
import { NotificationTypeMessageReceived } from '@/types/NotificationType';

// --- PHẦN 1: CẤU HÌNH KÊNH THÔNG BÁO ANDROID ---
export const NOTIFICATION_CHANNEL_ID = 'emi_default_channel';

async function setupAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;
  try {
    // Xóa kênh cũ nếu cần
    const oldChannels = ['default', 'O24NCH', 'emi_channel'];
    for (const channelId of oldChannels) {
      try {
        await Notifications.deleteNotificationChannelAsync(channelId);
      } catch (e) {}
    }

    // Tạo kênh mới
    const channel = await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'W4S Notifications',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'emi.wav', 
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      enableLights: true,
      lightColor: '#FF0000',
      showBadge: true,
    });
    
    logMessage('[PN] Android channel created', 'info', { channelId: channel?.id });
  } catch (error) {
    logError('[PN] Android channel creation failed', { error });
  }
}

// --- PHẦN 2: XỬ LÝ HIỂN THỊ LOCAL NOTIFICATION ---
function isValidFCMMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): boolean {
  return !!(remoteMessage.messageId && remoteMessage.sentTime && remoteMessage.sentTime > 0);
}

export async function showLocalNotification(
  remoteMessage?: FirebaseMessagingTypes.RemoteMessage
) {
  const source = remoteMessage ? 'Remote FCM' : 'Local Button';
  try {
    const content: Notifications.NotificationContentInput = {
      title: remoteMessage?.notification?.title || 
             (typeof remoteMessage?.data?.title === 'string' ? remoteMessage.data.title : 'Notification'),
      body: remoteMessage?.notification?.body || 
            (typeof remoteMessage?.data?.body === 'string' ? remoteMessage.data.body : ''),
      data: remoteMessage?.data || {},
      sound: 'emi.wav',
    };

    const trigger = null; // null nghĩa là hiện ngay lập tức

    await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });
  } catch (error) {
    logError('[PN] Show local notification failed', { error, source });
  }
}

// Handler cho Background Message
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  if (!isValidFCMMessage(remoteMessage)) return Promise.resolve();
  await showLocalNotification(remoteMessage);
  return Promise.resolve();
});

// Cấu hình hành vi khi nhận thông báo lúc app đang mở 
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type PushNotificationContextType = {
  fcmToken?: string;
  notification?: FirebaseMessagingTypes.RemoteMessage | null;
};

const PushNotificationContext = createContext<PushNotificationContextType>({
  fcmToken: undefined,
  notification: null,
});

export const usePushNotification = () => useContext(PushNotificationContext);

async function requestUserPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return status === PermissionsAndroid.RESULTS.GRANTED;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureIosApnsRegistration() {
  if (Platform.OS !== 'ios') return;
  try {
    const isRegistered = messaging().isDeviceRegisteredForRemoteMessages;
    if (!isRegistered) {
      await messaging().registerDeviceForRemoteMessages();
    }
  } catch (error) {
    logError('[PN] iOS APNS registration failed', { error });
  }
}

export const PushNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fcmToken, setFcmToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<FirebaseMessagingTypes.RemoteMessage | null>(null);

  const handleNotificationNavigation = (data: NotificationTypeMessageReceived) => {
    if (!data) return;
    try {
        logMessage('[PN] Navigating to Notification Screen', 'info', { data });
        
                router.push({
            pathname: '/notification' as any,
            params: { data: JSON.stringify(data) }
        });

    } catch (err) {
        logError('[PN] Navigate failed', { error: err });
    }
  };

  useEffect(() => {
    let unsubOnMessage: (() => void) | undefined;
    let unsubOnTokenRefresh: (() => void) | undefined;
    let notifResponseSub: Notifications.EventSubscription | undefined;

    (async () => {
      try {
        await setupAndroidNotificationChannel();
        const granted = await requestUserPermission();
        if (!granted) {
          logMessage('[PN] Permission denied', 'warning');
          return;
        }

        await ensureIosApnsRegistration();

        // Lấy FCM Token
        const token = await messaging().getToken();
        setFcmToken(token);
        await StorageService.setItem('fcmToken', token);
        logMessage('[PN] FCM token acquired', 'info', { token });

        // Lắng nghe Refresh Token
        unsubOnTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
          setFcmToken(newToken);
          await StorageService.setItem('fcmToken', newToken);
        });

        // Lắng nghe tin nhắn khi App đang mở (Foreground)
        unsubOnMessage = messaging().onMessage(async (remoteMessage) => {
          if (!isValidFCMMessage(remoteMessage)) return;
          setNotification(remoteMessage);
          await showLocalNotification(remoteMessage);
        });

        // 1. Mở từ Background
        messaging().onNotificationOpenedApp((remoteMessage) => {
          const data = remoteMessage.data as unknown as NotificationTypeMessageReceived;
          handleNotificationNavigation(data);
        });

        // 2. Mở từ trạng thái Quit (Cold Start)
        messaging()
          .getInitialNotification()
          .then((remoteMessage) => {
            if (remoteMessage) {
              const data = remoteMessage.data as unknown as NotificationTypeMessageReceived;
              // Delay nhỏ để Router mount xong
              setTimeout(() => {
                handleNotificationNavigation(data);
              }, 1500);
            }
          });

        // 3. Bấm vào thông báo Local (Expo)
        notifResponseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as unknown as NotificationTypeMessageReceived;
          handleNotificationNavigation(data);
        });

      } catch (err) {
        logError('[PN] Initialization failed', { error: err });
      }
    })();

    return () => {
      unsubOnMessage?.();
      unsubOnTokenRefresh?.();
      notifResponseSub?.remove();
    };
  }, []);

  return (
    <PushNotificationContext.Provider value={{ fcmToken, notification }}>
      {children}
    </PushNotificationContext.Provider>
  );
};
