import { Stack } from 'expo-router';
import React from 'react';

import NotificationScreen from '@/features/notification/screens/NotificationScreen';

export default function NotificationPage() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <NotificationScreen />
    </>
  );
}