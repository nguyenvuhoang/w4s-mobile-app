import StorageKey from "@/constants/StorageKey";
import { useOTA } from "@/hooks/useOTA";
import { logError, logMessage } from "@/services/LoggerService";
import StorageService from "@/services/StorageService";
import { AppInfo } from "@/types/UserCommand";
import { t } from "i18next";
import React, { createContext, useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import LoadingIndicator from "../components/loading/LoadingIndicator";
import ProgressLoadingIndicator from "../components/loading/ProgressLoadingIndicator";

interface LoadingConfig {
  visible: boolean;
  overlay?: boolean;
  text?: string;
  progress?: number;        
  mode?: 'default' | 'progress';
}

interface GlobalContextType {
  appInfo: AppInfo | null;
  setAppInfo: (appInfo: AppInfo | null) => void;
  isReady: boolean;
  isLogoutConfirmedRef: React.MutableRefObject<boolean>;
  isIdleLogoutRef: React.MutableRefObject<boolean>;
  
  isOtaUpdateAvailable: boolean;
  isOtaDownloading: boolean;
  isOtaUpdateReady: boolean;
  startOtaUpdate: () => Promise<void>;
  reloadOtaApp: () => Promise<void>; 
  otaError: Error | null;

  unreadTotalCount: number;
  setUnreadTotalCount: (count: number) => void;
  globalPhone: string | null;
  setGlobalPhone: (phone: string | null) => void;
  balance: string;
  setBalance: (balance: string) => void;
  walletBalance: string;
  setWalletBalance: (walletBalance: string) => void;

  globalLoading: LoadingConfig;
  showGlobalLoading: (config?: Partial<Omit<LoadingConfig, 'visible'>>) => Promise<void> | void;
  hideGlobalLoading: () => void;
  setLoadingProgress: (progress: number) => Promise<void> | void; 
}

const GlobalContext = createContext<GlobalContextType>({
  appInfo: null,
  setAppInfo: () => {},
  isReady: false,
  isLogoutConfirmedRef: { current: false },
  isIdleLogoutRef: { current: false },
  isOtaUpdateAvailable: false,
  isOtaDownloading: false,
  isOtaUpdateReady: false,
  startOtaUpdate: async () => {},
  reloadOtaApp: async () => {},
  otaError: null,
  unreadTotalCount: 0,
  setUnreadTotalCount: () => {},
  globalPhone: null,
  setGlobalPhone: () => {},
  balance: "********",
  setBalance: () => {},
  walletBalance: "********",
  setWalletBalance: () => {},
  
  globalLoading: { visible: false, overlay: true, text: undefined, progress: 0, mode: 'default' },
  showGlobalLoading: () => {},
  hideGlobalLoading: () => {},
  setLoadingProgress: () => {},
});

const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isLogoutConfirmedRef = useRef(false);
  const isIdleLogoutRef = useRef(false);
  const [unreadTotalCount, setUnreadTotalCount] = useState<number>(0);
  const lastOtaCheckTimeRef = useRef<number | null>(null);

  const [globalPhone, setGlobalPhone] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("********");
  const [walletBalance, setWalletBalance] = useState<string>("********");

  const [globalLoading, setGlobalLoading] = useState<LoadingConfig>({
    visible: false,
    overlay: false,
    text: undefined,
    progress: 0,
    mode: 'default',
  });

  const showGlobalLoading = useCallback((config?: Partial<Omit<LoadingConfig, 'visible'>>) => {
    const newProgress = config?.progress ?? 0;

    setGlobalLoading((prev) => ({
      visible: true,
      overlay: config?.overlay ?? false, 
      text: config?.text ?? (t("common.loading") || "Loading..."),
      progress: newProgress,
      mode: config?.mode ?? 'default',
    }));

    if (newProgress === 100) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 800); 
      });
    }
  }, []);

  const hideGlobalLoading = useCallback(() => {
    setGlobalLoading({
      visible: false,
      overlay: false,
      text: undefined,
      progress: 0,
      mode: 'default',
    });
  }, []);

  const setLoadingProgress = useCallback((progress: number) => {
    setGlobalLoading((prev) => {
        if (!prev.visible) return prev;
        return { ...prev, progress, mode: 'progress' };
    });

    if (progress === 100) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 800);
      });
    }
  }, []);

  const {
    isUpdateAvailable: isOtaUpdateAvailable,
    isDownloading: isOtaDownloading,
    isUpdateReady: isOtaUpdateReady,
    startUpdate: startOtaUpdate,
    reloadApp: reloadOtaApp,
    otaError,
    checkForUpdates: checkForOtaUpdates
  } = useOTA();

  useEffect(() => {
    const loadAppInfo = async () => {
      try {
        const storedAppInfo = await StorageService.getAsyncItem(StorageKey.appInfo);
        if (storedAppInfo) {
          const parsedAppInfo: AppInfo = JSON.parse(storedAppInfo);
          setAppInfo(parsedAppInfo);
          logMessage("AppInfo loaded", "info", {
            appinfo: parsedAppInfo
          });
        }
      } catch (error) {
        logError(error, {
          action: "loadAppInfo",
          appInfo,
        });
      } finally {
        setIsReady(true);
      }
    };
    loadAppInfo();
    
    const otaCheckInterval = 5 * 60 * 1000; 
    const tryOtaUpdateCheck = () => {
      const now = Date.now();
      const lastCheck = lastOtaCheckTimeRef.current;
      if (!lastCheck || (now - lastCheck > otaCheckInterval)) {
        checkForOtaUpdates();
        lastOtaCheckTimeRef.current = now;
      }
    };

    tryOtaUpdateCheck();

    const handleAppStateChange = (nextAppState: any) => {
      if (nextAppState === 'active') {
        tryOtaUpdateCheck();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    const intervalId = setInterval(() => {
      if (AppState.currentState === 'active') {
        tryOtaUpdateCheck();
      }
    }, otaCheckInterval);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        appInfo,
        setAppInfo,
        isReady,
        isLogoutConfirmedRef,
        isIdleLogoutRef,
        unreadTotalCount,
        setUnreadTotalCount,
        isOtaUpdateAvailable,
        isOtaDownloading,
        isOtaUpdateReady,
        startOtaUpdate,
        reloadOtaApp,
        otaError,
        globalPhone,
        setGlobalPhone,
        balance,
        setBalance,
        walletBalance,
        setWalletBalance,
        globalLoading,
        showGlobalLoading,
        hideGlobalLoading,
        setLoadingProgress, 
      }}
    >
      {globalLoading.mode === 'progress' ? (
        <ProgressLoadingIndicator 
          visible={globalLoading.visible}
          overlay={globalLoading.overlay}
          text={globalLoading.text}
          progress={globalLoading.progress || 0}
        />
      ) : (
        <LoadingIndicator 
          visible={globalLoading.visible}
          overlay={globalLoading.overlay}
          text={globalLoading.text}
        />
      )}
      
      {children}
    </GlobalContext.Provider>
  );
};

export { GlobalContext, GlobalProvider };

