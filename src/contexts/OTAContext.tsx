import { OTAPriority, useOTA } from "@/hooks/useOTA";
import React, { createContext, useContext, useEffect, useMemo } from "react";

export interface OTAContextType {
  isOtaUpdateAvailable: boolean;
  isOtaDownloading: boolean;
  isOtaUpdateReady: boolean;
  startOtaUpdate: () => Promise<void>;
  reloadOtaApp: () => Promise<void>;
  otaError: Error | null;
  otaPriority: OTAPriority;
  checkForOtaUpdates: () => Promise<void>;
}

export const OTAContext = createContext<OTAContextType>({
  isOtaUpdateAvailable: false,
  isOtaDownloading: false,
  isOtaUpdateReady: false,
  startOtaUpdate: async () => {},
  reloadOtaApp: async () => {},
  otaError: null,
  otaPriority: "normal",
  checkForOtaUpdates: async () => {},
});

export const OTAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isUpdateAvailable: isOtaUpdateAvailable,
    isDownloading: isOtaDownloading,
    isUpdateReady: isOtaUpdateReady,
    startUpdate: startOtaUpdate,
    reloadApp: reloadOtaApp,
    otaError,
    checkForUpdates: checkForOtaUpdates,
    priority: otaPriority,
  } = useOTA();

  useEffect(() => {
    if (!__DEV__) {
      const timer = setTimeout(() => {
        checkForOtaUpdates();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [checkForOtaUpdates]);

  const value = useMemo<OTAContextType>(
    () => ({
      isOtaUpdateAvailable,
      isOtaDownloading,
      isOtaUpdateReady,
      startOtaUpdate,
      reloadOtaApp,
      otaError,
      otaPriority,
      checkForOtaUpdates,
    }),
    [
      isOtaUpdateAvailable,
      isOtaDownloading,
      isOtaUpdateReady,
      startOtaUpdate,
      reloadOtaApp,
      otaError,
      otaPriority,
      checkForOtaUpdates,
    ]
  );

  return <OTAContext.Provider value={value}>{children}</OTAContext.Provider>;
};

export const useOTAContext = () => useContext(OTAContext);
