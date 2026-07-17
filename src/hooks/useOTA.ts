import * as Updates from 'expo-updates';
import { useCallback, useState } from 'react';

export type OTAPriority = 'force' | 'normal';

const parseUpdateMessage = (message: string) => {
  return Object.fromEntries(
    message
      .split(';')
      .map(item => item.split('='))
      .filter(([k, v]) => k && v)
  );
};

export const useOTA = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [otaError, setOtaError] = useState<Error | null>(null);

  const [priority, setPriority] = useState<OTAPriority>('normal');

  const clearOtaError = () => {
    setOtaError(null);
  };

  const checkForUpdates = useCallback(async () => {
    console.log('[OTA] Checking for updates...');

    try {
      const update = await Updates.checkForUpdateAsync();

      console.log('[OTA] Check result:', update);

      if (!update.isAvailable) {
        console.log('[OTA] No update available.');
        return;
      }

      let manifest = update.manifest;
      if (typeof manifest === 'string') {
        try {
          manifest = JSON.parse(manifest);
        } catch (e) {
          console.log('[OTA] Failed to parse manifest string:', e);
        }
      }

      const manifestExtra = (manifest as any)?.extra;
      const manifestExtraPriority =
        manifestExtra?.expoClient?.extra?.otaPriority ??
        manifestExtra?.otaPriority;

      const message =
        (manifest as any)?.message ?? '';

      console.log('[OTA] Update message:', message);
      console.log('[OTA] Extra priority:', manifestExtraPriority);

      const meta = parseUpdateMessage(message);

      const otaPriority =
        manifestExtraPriority === 'force' || meta.priority === 'force'
          ? 'force'
          : 'normal';

      console.log('[OTA] Priority:', otaPriority);

      setPriority(otaPriority);

      if (otaPriority === 'force') {
        console.log('[OTA] Force update. Fetching automatically in background...');
        setIsDownloading(true);
        try {
          await Updates.fetchUpdateAsync();
          console.log('[OTA] Force update downloaded successfully. Will prompt for restart.');
          setIsUpdateReady(true);
          setIsUpdateAvailable(true);
        } catch (fetchErr: any) {
          console.log('[OTA] Force fetch error:', fetchErr);
          setOtaError(fetchErr);
        } finally {
          setIsDownloading(false);
        }
      } else {
        // Tải update im lặng trong background
        console.log('[OTA] Normal update. Fetching silently in background...');
        setIsDownloading(true);
        try {
          await Updates.fetchUpdateAsync();
          console.log('[OTA] Silent update downloaded successfully. Will apply on next launch.');
        } catch (fetchErr: any) {
          console.log('[OTA] Silent fetch error:', fetchErr);
          setOtaError(fetchErr);
        } finally {
          setIsDownloading(false);
        }
      }
    } catch (error: any) {
      console.log('[OTA] Check error:', error);
      setOtaError(error);
    }
  }, []);

  const startUpdate = useCallback(async () => {
    if (!isUpdateAvailable || isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      await Updates.fetchUpdateAsync();
      setIsDownloading(false);

      if (priority === 'force') {
        console.log('[OTA] Force update.');
        setIsUpdateReady(true);
      } else {
        console.log(
          '[OTA] Normal update. Will apply on next launch.'
        );
      }
    } catch (error: any) {
      console.log('[OTA] Fetch error:', error);

      setOtaError(error);
      setIsDownloading(false);
    }
  }, [isUpdateAvailable, isDownloading, priority]);

  const reloadApp = useCallback(async () => {
    try {
      console.log('[OTA] Reloading app...');

      await Updates.reloadAsync();
    } catch (error: any) {
      console.log('[OTA] Reload error:', error);

      setOtaError(error);
    }
  }, []);

  return {
    isUpdateAvailable,
    isDownloading,

    /**
     * Chỉ true khi OTA force đã tải xong
     * => UI cần bắt người dùng restart
     */
    isUpdateReady,

    /**
     * force | normal
     */
    priority,

    startUpdate,
    reloadApp,

    otaError,
    clearOtaError,

    checkForUpdates,
  };
};