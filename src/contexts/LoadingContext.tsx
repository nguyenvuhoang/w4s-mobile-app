import LoadingIndicator from "@/components/loading/LoadingIndicator";
import ProgressLoadingIndicator from "@/components/loading/ProgressLoadingIndicator";
import { t } from "i18next";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface LoadingConfig {
  visible: boolean;
  overlay?: boolean;
  text?: string;
  progress?: number;
  mode?: "default" | "progress";
}

export interface LoadingActionsContextType {
  showGlobalLoading: (
    config?: Partial<Omit<LoadingConfig, "visible">>
  ) => Promise<void> | void;
  hideGlobalLoading: () => void;
  setLoadingProgress: (progress: number) => Promise<void> | void;
}

export interface LoadingContextType extends LoadingActionsContextType {
  globalLoading: LoadingConfig;
}

const defaultActions: LoadingActionsContextType = {
  showGlobalLoading: () => {},
  hideGlobalLoading: () => {},
  setLoadingProgress: () => {},
};

export const LoadingActionsContext = createContext<LoadingActionsContextType>(defaultActions);

export const LoadingContext = createContext<LoadingContextType>({
  globalLoading: {
    visible: false,
    overlay: true,
    text: undefined,
    progress: 0,
    mode: "default",
  },
  ...defaultActions,
});

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [globalLoading, setGlobalLoading] = useState<LoadingConfig>({
    visible: false,
    overlay: false,
    text: undefined,
    progress: 0,
    mode: "default",
  });

  const showGlobalLoading = useCallback(
    (config?: Partial<Omit<LoadingConfig, "visible">>) => {
      const newProgress = config?.progress ?? 0;
      setGlobalLoading({
        visible: true,
        overlay: config?.overlay ?? false,
        text: config?.text ?? (t("common.loading") || "Loading..."),
        progress: newProgress,
        mode: config?.mode ?? "default",
      });

      if (newProgress === 100) {
        return new Promise<void>((resolve) => setTimeout(resolve, 800));
      }
    },
    []
  );

  const hideGlobalLoading = useCallback(() => {
    setGlobalLoading({
      visible: false,
      overlay: false,
      text: undefined,
      progress: 0,
      mode: "default",
    });
  }, []);

  const setLoadingProgress = useCallback((progress: number) => {
    setGlobalLoading((prev) =>
      prev.visible ? { ...prev, progress, mode: "progress" } : prev
    );

    if (progress === 100) {
      return new Promise<void>((resolve) => setTimeout(resolve, 800));
    }
  }, []);

  const actionsValue = useMemo<LoadingActionsContextType>(
    () => ({
      showGlobalLoading,
      hideGlobalLoading,
      setLoadingProgress,
    }),
    [showGlobalLoading, hideGlobalLoading, setLoadingProgress]
  );

  const value = useMemo<LoadingContextType>(
    () => ({
      globalLoading,
      ...actionsValue,
    }),
    [globalLoading, actionsValue]
  );

  return (
    <LoadingActionsContext.Provider value={actionsValue}>
      <LoadingContext.Provider value={value}>
        {globalLoading.mode === "progress" ? (
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
      </LoadingContext.Provider>
    </LoadingActionsContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
export const useLoadingActions = () => useContext(LoadingActionsContext);
