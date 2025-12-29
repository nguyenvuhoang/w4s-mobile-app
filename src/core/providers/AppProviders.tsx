import * as Sentry from '@sentry/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import các Provider 
import AppErrorBoundary from '@/components/AppErrorBoundary';
import { AppConfig } from '@/constants/AppConfig';
import { AdvertisementProvider } from '@/contexts/AdvertisementContext';
import { CallbackProvider } from '@/contexts/CallbackRegistryContext';
import { GlobalProvider } from '@/contexts/GlobalContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { PushNotificationProvider } from '@/contexts/PushNotificationContext';
import { SignalRProvider } from '@/contexts/SignalRContext';
import { ThemeProvider } from '@/core/theme/ThemeContext';

// Import các Wrapper logic
// import AppUpdateWrapper from '@/components/AppUpdateWrapper';
import AppContentWrapper from '@/components/base/AppContentWrapper';

Sentry.init({
  dsn: AppConfig.SENTRY.DSN,
  environment: AppConfig.SENTRY.ENVIRONMENT,
});

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
         <ThemeProvider>
         <GlobalProvider>
            <SignalRProvider> 
               <NotificationProvider>
                  <PushNotificationProvider>
                     <AdvertisementProvider>
                        <CallbackProvider>
                              
                              {/* --- CÁC LOGIC CHẠY NGẦM --- */}
                              {/* <AppUpdateWrapper> */}
                                 <AppContentWrapper>
                                    {children}
                                 </AppContentWrapper>
                              {/* </AppUpdateWrapper> */}

                        </CallbackProvider>
                     </AdvertisementProvider>
                  </PushNotificationProvider>
               </NotificationProvider>
            </SignalRProvider>
         </GlobalProvider>
         </ThemeProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
};
