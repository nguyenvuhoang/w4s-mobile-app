import * as Updates from 'expo-updates';
import { useCallback, useState } from 'react';

export const useOTA = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [otaError, setOtaError] = useState<Error | null>(null);

  const clearOtaError = () => {
    setOtaError(null);
  };

  const checkForUpdates = useCallback(async () => {
    console.log('[OTA] Checking for updates...');
    // setIsUpdateAvailable(true); 
    try {
      const update = await Updates.checkForUpdateAsync();
      console.log('[OTA] Check complete, result:', update);
      if (update.isAvailable) {
        console.log('[OTA] Update is available!');
        setIsUpdateAvailable(true);
      } else {
        console.log('[OTA] No update available.');
      }
    } catch (error: any) {
      console.log('Error checking for OTA update:', error);
      setOtaError(error);
    }
  }, []);

  const startUpdate = useCallback(async () => {
    if (!isUpdateAvailable || isDownloading) return;
    setIsDownloading(true);
    try {
      await Updates.fetchUpdateAsync();
      setIsDownloading(false);
      setIsUpdateReady(true); 
    } catch (error: any) {
      console.log("Error fetching update:", error);
      setOtaError(error);
      setIsDownloading(false);
    }
  }, [isUpdateAvailable, isDownloading]);

  const reloadApp = useCallback(async () => {
    setTimeout(() => {
      Updates.reloadAsync();
    }, 500);
  }, []);

  return { 
    isUpdateAvailable, 
    isDownloading, 
    isUpdateReady, 
    startUpdate, 
    reloadApp, 
    otaError, 
    clearOtaError, 
    checkForUpdates 
  };
};