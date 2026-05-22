import StorageKey from "@/constants/StorageKey";
import { useOTA } from "@/hooks/useOTA";
import { logError, logMessage } from "@/services/LoggerService";
import { walletRepository } from "@/services/repositories/wallet.repository"; // 🔹 ADD
import StorageService from "@/services/StorageService";
import { AppInfo } from "@/types/UserCommand";
import { WalletSummary } from "@/types/wallet"; // 🔹 ADD
import { t } from "i18next";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import LoadingIndicator from "../components/loading/LoadingIndicator";
import ProgressLoadingIndicator from "../components/loading/ProgressLoadingIndicator";

interface LoadingConfig {
  visible: boolean;
  overlay?: boolean;
  text?: string;
  progress?: number;
  mode?: "default" | "progress";
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
  showGlobalLoading: (
    config?: Partial<Omit<LoadingConfig, "visible">>,
  ) => Promise<void> | void;
  hideGlobalLoading: () => void;
  setLoadingProgress: (progress: number) => Promise<void> | void;

  // 🔹 ADD — Wallet snapshot
  wallets: WalletSummary[];
  walletsUpdatedAt: number | null;
  walletLoading: boolean;
  walletError: string | null;
  fetchWallets: (force?: boolean) => Promise<void>;
  updateWalletBalance: (walletId: number, diff: number) => void;

  // 🔹 ADD — Default wallet
  defaultWalletId: number | null;
  setDefaultWalletId: (walletId: number | null) => void;
  setPrimaryWallet: (walletId: number) => Promise<void>;
  getPrimaryWallet: () => Promise<WalletSummary>;
  defaultWallet?: WalletSummary;
}

const GlobalContext = createContext<GlobalContextType>({
  appInfo: null,
  setAppInfo: () => { },
  isReady: false,
  isLogoutConfirmedRef: { current: false },
  isIdleLogoutRef: { current: false },

  isOtaUpdateAvailable: false,
  isOtaDownloading: false,
  isOtaUpdateReady: false,
  startOtaUpdate: async () => { },
  reloadOtaApp: async () => { },
  otaError: null,

  unreadTotalCount: 0,
  setUnreadTotalCount: () => { },
  globalPhone: null,
  setGlobalPhone: () => { },
  balance: "********",
  setBalance: () => { },
  walletBalance: "********",
  setWalletBalance: () => { },

  globalLoading: {
    visible: false,
    overlay: true,
    text: undefined,
    progress: 0,
    mode: "default",
  },
  showGlobalLoading: () => { },
  hideGlobalLoading: () => { },
  setLoadingProgress: () => { },

  // 🔹 ADD — Wallet defaults
  wallets: [],
  walletsUpdatedAt: null,
  walletLoading: false,
  walletError: null,
  fetchWallets: async () => { },
  updateWalletBalance: () => { },

  // 🔹 ADD — Default wallet defaults
  defaultWalletId: null,
  setDefaultWalletId: () => { },
  setPrimaryWallet: async () => { },
  getPrimaryWallet: async () => { throw new Error("getPrimaryWallet not implemented"); },
  defaultWallet: undefined,
});

const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
    mode: "default",
  });

  // 🔹 ADD — Wallet snapshot states
  const WALLET_TTL = 30_000;
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [walletsUpdatedAt, setWalletsUpdatedAt] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // 🔹 ADD — Default wallet state
  const [defaultWalletId, setDefaultWalletId] = useState<number | null>(null);

  const isWalletExpired = () => {
    if (!walletsUpdatedAt) return true;
    return Date.now() - walletsUpdatedAt > WALLET_TTL;
  };

  // 🔹 ADD — Fetch wallet overview
  const fetchWallets = async (force = false) => {
    if (!force && !isWalletExpired()) return;

    try {
      setWalletLoading(true);
      setWalletError(null);

      const userCode = appInfo?.user_code;
      if (!userCode) throw new Error("Missing user_code");

      const data = await walletRepository.getWalletOverview(userCode);
      setWallets(data);
      setWalletsUpdatedAt(Date.now());
      if (data.length === 1) {
        setDefaultWalletId(data[0].walletId);
      }
    } catch (err) {
      console.error("[GlobalContext][Wallet] fetch error", err);
      setWalletError(
        err instanceof Error ? err.message : "Fetch wallet failed",
      );
    } finally {
      setWalletLoading(false);
    }
  };

  // 🔹 ADD — Optimistic update
  const updateWalletBalance = (walletId: number, diff: number) => {
    setWallets((prev) =>
      prev.map((w) =>
        w.walletId === walletId
          ? { ...w, balance: w.balance + diff }
          : w,
      ),
    );
  };

  // 🔹 ADD — Set primary wallet (API + local sync)
  const setPrimaryWallet = async (walletId: number) => {
    try {
      showGlobalLoading({ text: t("wallet.setting_primary_wallet") || "Setting primary wallet..." });
      await walletRepository.setPrimaryWallet(walletId);
      setDefaultWalletId(walletId);
      // Optional: force refresh wallets to see if primary status flag changed on server
      await fetchWallets(true);
    } catch (err) {
      console.error("[GlobalContext] setPrimaryWallet error", err);
      throw err;
    } finally {
      hideGlobalLoading();
    }
  };

  // 🔹 ADD — Get primary wallet
  const getPrimaryWallet = async (): Promise<WalletSummary> => {
    try {
      const primaryWallet = await walletRepository.getPrimaryWallet();
      if (primaryWallet) {
        setDefaultWalletId(primaryWallet.walletId);
      }
      return primaryWallet;
    } catch (err) {
      console.error("[GlobalContext] getPrimaryWallet error", err);
      throw err;
    }
  };

  // 🔹 ADD — Derived default wallet
  const defaultWallet = useMemo(() => {
    if (!defaultWalletId) return undefined;
    return wallets.find((w) => w.walletId === defaultWalletId);
  }, [defaultWalletId, wallets]);

  // 🔹 ADD — Load default wallet from storage
  useEffect(() => {
    const loadDefaultWallet = async () => {
      try {
        const stored = await StorageService.getItem(
          StorageKey.defaultWalletId,
        );
        if (stored) {
          setDefaultWalletId(Number(stored));
        }
      } catch (err) {
        console.error("[GlobalContext] load default wallet failed", err);
      }
    };
    loadDefaultWallet();
  }, []);

  // 🔹 ADD — Persist default wallet
  useEffect(() => {
    if (!defaultWalletId) return;
    StorageService.setItem(
      StorageKey.defaultWalletId,
      String(defaultWalletId),
    );
  }, [defaultWalletId]);

  // 🔹 ADD — Fallback default wallet
  useEffect(() => {
    if (defaultWallet) return;
    const firstActive = wallets.find((w) => w.status === "ACTIVE");
    if (firstActive) {
      setDefaultWalletId(firstActive.walletId);
    }
  }, [wallets, defaultWallet]);

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
    [],
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
      prev.visible ? { ...prev, progress, mode: "progress" } : prev,
    );

    if (progress === 100) {
      return new Promise<void>((resolve) => setTimeout(resolve, 800));
    }
  }, []);

  const {
    isUpdateAvailable: isOtaUpdateAvailable,
    isDownloading: isOtaDownloading,
    isUpdateReady: isOtaUpdateReady,
    startUpdate: startOtaUpdate,
    reloadApp: reloadOtaApp,
    otaError,
    checkForUpdates: checkForOtaUpdates,
  } = useOTA();

  useEffect(() => {
    const loadAppInfo = async () => {
      try {
        const storedAppInfo = await StorageService.getItem(
          StorageKey.appInfo,
        );
        if (storedAppInfo) {
          const parsedAppInfo: AppInfo = JSON.parse(storedAppInfo);
          setAppInfo(parsedAppInfo);
          logMessage("AppInfo loaded", "info", { appinfo: parsedAppInfo });
        }
      } catch (error) {
        logError(error, { action: "loadAppInfo", appInfo });
      } finally {
        setIsReady(true);
      }
    };
    loadAppInfo();
  }, []);

  // 🔹 TRIGGER OTA CHECK
  useEffect(() => {
    if (isReady && !__DEV__) {
      const timer = setTimeout(() => {
        checkForOtaUpdates();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  // 🔹 ADD — Fetch wallet when login / app start
  useEffect(() => {
    if (!appInfo?.user_code) return;
    fetchWallets(true);
    getPrimaryWallet().catch((err) => {
      console.warn("[GlobalContext] auto getPrimaryWallet on login/start failed", err);
    });
  }, [appInfo?.user_code]);

  // 🔹 ADD — Listen for transaction changes to refresh wallets
  useEffect(() => {
    const handleTransactionChanged = () => {
      if (appInfo?.user_code) {
        fetchWallets(true);
      }
    };

    TransactionEventEmitter.onTransactionChanged(handleTransactionChanged);
    return () => {
      TransactionEventEmitter.offTransactionChanged(handleTransactionChanged);
    };
  }, [appInfo?.user_code]);

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

        // 🔹 ADD — Wallet
        wallets,
        walletsUpdatedAt,
        walletLoading,
        walletError,
        fetchWallets,
        updateWalletBalance,

        // 🔹 ADD — Default wallet
        defaultWalletId,
        setDefaultWalletId,
        setPrimaryWallet,
        getPrimaryWallet,
        defaultWallet,
      }}
    >
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
    </GlobalContext.Provider>
  );
};

export { GlobalContext, GlobalProvider };

