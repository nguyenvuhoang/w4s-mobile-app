import StorageKey from "@/constants/StorageKey";
import { LoadingConfig, useLoadingActions } from "@/contexts/LoadingContext";
import { OTAPriority } from "@/hooks/useOTA";
import { useImageService } from "@/services/ImageService";
import { logError, logMessage } from "@/services/LoggerService";
import { walletRepository } from "@/services/repositories/wallet.repository";
import StorageService from "@/services/StorageService";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { AppInfo } from "@/types/UserCommand";
import { WalletSummary } from "@/types/wallet";
import { t } from "i18next";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  otaPriority: OTAPriority;

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

const DEFAULT_LOADING: LoadingConfig = {
  visible: false,
  overlay: true,
  text: undefined,
  progress: 0,
  mode: "default",
};

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
  otaPriority: "normal",

  unreadTotalCount: 0,
  setUnreadTotalCount: () => {},
  globalPhone: null,
  setGlobalPhone: () => {},
  balance: "********",
  setBalance: () => {},
  walletBalance: "********",
  setWalletBalance: () => {},

  globalLoading: DEFAULT_LOADING,
  showGlobalLoading: () => {},
  hideGlobalLoading: () => {},
  setLoadingProgress: () => {},

  // 🔹 ADD — Wallet defaults
  wallets: [],
  walletsUpdatedAt: null,
  walletLoading: false,
  walletError: null,
  fetchWallets: async () => {},
  updateWalletBalance: () => {},

  // 🔹 ADD — Default wallet defaults
  defaultWalletId: null,
  setDefaultWalletId: () => {},
  setPrimaryWallet: async () => {},
  getPrimaryWallet: async () => {
    throw new Error("getPrimaryWallet not implemented");
  },
  defaultWallet: undefined,
});

const BANNER_CACHE_TTL_MS = 5 * 60 * 1000;
const WALLET_TTL_MS = 30_000;

const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const imageService = useImageService();
  const imageServiceRef = useRef(imageService);
  imageServiceRef.current = imageService;
  const { showGlobalLoading, hideGlobalLoading, setLoadingProgress } =
    useLoadingActions();

  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isReady, setIsReady] = useState(false);

  const isLogoutConfirmedRef = useRef(false);
  const isIdleLogoutRef = useRef(false);
  const [unreadTotalCount, setUnreadTotalCount] = useState<number>(0);

  const [globalPhone, setGlobalPhone] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("********");
  const [walletBalance, setWalletBalance] = useState<string>("********");

  // 🔹 ADD — Wallet snapshot states
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [walletsUpdatedAt, setWalletsUpdatedAt] = useState<number | null>(null);
  const walletsUpdatedAtRef = useRef<number | null>(null);
  const fetchWalletsInFlightRef = useRef<Promise<void> | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // 🔹 ADD — Default wallet state
  const [defaultWalletId, setDefaultWalletId] = useState<number | null>(null);

  const lastBannerLoadRef = useRef<number>(0);
  const lastInitializedUserCodeRef = useRef<string | null>(null);

  const loadImages = useCallback(async (force = false) => {
    if (!force && Date.now() - lastBannerLoadRef.current < BANNER_CACHE_TTL_MS) {
      return true;
    }

    try {
      type BannerImage = { typeusing: string; [key: string]: any };
      const res = (await imageServiceRef.current.searchBannerImage(
        "Popup,Home,Statistic,Report",
        "",
        0,
        99999
      )) as BannerImage[];

      const popupBanners = res.filter((item) => item.typeusing === "Popup");
      const homeBanners = res.filter(
        (item) => item.typeusing === "Home" || item.typeusing === "Home Screen"
      );
      const statisticBanners = res.filter((item) => item.typeusing === "Statistic");
      const reportBanners = res.filter((item) => item.typeusing === "Report");

      await Promise.all([
        StorageService.setItem(StorageKey.PopupBanners, JSON.stringify(popupBanners)),
        StorageService.setItem(StorageKey.HomeBanners, JSON.stringify(homeBanners)),
        StorageService.setItem(StorageKey.StatisticBanners, JSON.stringify(statisticBanners)),
        StorageService.setItem(StorageKey.ReportBanners, JSON.stringify(reportBanners)),
      ]);

      lastBannerLoadRef.current = Date.now();
      if (__DEV__) {
        console.log("Banners loaded and cached successfully.");
      }
      return true;
    } catch (error) {
      console.warn("Banner image loading failed:", error);
      return false;
    }
  }, []);

  // 🔹 ADD — Fetch wallet overview (với in-flight deduplication)
  const fetchWallets = useCallback(async (force = false) => {
    const lastUpdated = walletsUpdatedAtRef.current;
    if (!force && lastUpdated && Date.now() - lastUpdated <= WALLET_TTL_MS) {
      return;
    }

    if (!force && fetchWalletsInFlightRef.current) {
      return fetchWalletsInFlightRef.current;
    }

    const run = (async () => {
      try {
        setWalletLoading(true);
        setWalletError(null);

        const userCode = appInfo?.user_code;
        if (!userCode) return;

        const data = await walletRepository.getWalletOverview(userCode);
        const now = Date.now();
        walletsUpdatedAtRef.current = now;
        setWallets(data);
        setWalletsUpdatedAt(now);
        if (data.length === 1) {
          setDefaultWalletId(data[0].walletId);
        }
      } catch (err) {
        console.error("[GlobalContext][Wallet] fetch error", err);
        setWalletError(
          err instanceof Error ? err.message : "Fetch wallet failed"
        );
      } finally {
        setWalletLoading(false);
        fetchWalletsInFlightRef.current = null;
      }
    })();

    fetchWalletsInFlightRef.current = run;
    return run;
  }, [appInfo?.user_code]);

  // 🔹 ADD — Optimistic update
  const updateWalletBalance = useCallback((walletId: number, diff: number) => {
    setWallets((prev) =>
      prev.map((w) =>
        w.walletId === walletId
          ? { ...w, balance: w.balance + diff }
          : w
      )
    );
  }, []);

  // 🔹 ADD — Set primary wallet (API + local sync)
  const setPrimaryWallet = useCallback(async (walletId: number) => {
    try {
      showGlobalLoading({
        text: t("wallet.setting_primary_wallet") || "Setting primary wallet...",
      });
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
  }, [fetchWallets, showGlobalLoading, hideGlobalLoading]);

  // 🔹 ADD — Get primary wallet
  const getPrimaryWallet = useCallback(async (): Promise<WalletSummary> => {
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
  }, []);

  // 🔹 ADD — Derived default wallet
  const defaultWallet = useMemo(() => {
    if (!defaultWalletId) return undefined;
    return wallets.find((w) => w.walletId === defaultWalletId);
  }, [defaultWalletId, wallets]);

  // 🔹 ADD — Load default wallet from storage
  useEffect(() => {
    const loadDefaultWallet = async () => {
      try {
        const stored = await StorageService.getItem(StorageKey.defaultWalletId);
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
    StorageService.setItem(StorageKey.defaultWalletId, String(defaultWalletId));
  }, [defaultWalletId]);

  // 🔹 ADD — Fallback default wallet
  useEffect(() => {
    if (defaultWallet) return;
    const firstActive = wallets.find((w) => w.status === "ACTIVE");
    if (firstActive) {
      setDefaultWalletId(firstActive.walletId);
    }
  }, [wallets, defaultWallet]);

  useEffect(() => {
    const loadAppInfo = async () => {
      try {
        const storedAppInfo = await StorageService.getItem(StorageKey.appInfo);
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

  // 🔹 ADD — Fetch wallet when login / app start (run once per user_code)
  useEffect(() => {
    const userCode = appInfo?.user_code;
    if (!userCode) {
      lastInitializedUserCodeRef.current = null;
      return;
    }
    if (lastInitializedUserCodeRef.current === userCode) {
      return;
    }
    lastInitializedUserCodeRef.current = userCode;

    fetchWallets(true);
    getPrimaryWallet().catch((err) => {
      console.warn("[GlobalContext] auto getPrimaryWallet on login/start failed", err);
    });
    loadImages();
  }, [appInfo?.user_code, fetchWallets, getPrimaryWallet, loadImages]);

  // 🔹 Mark wallets dirty on transaction changes; lazy refetch happens on screen focus via useWallet
  useEffect(() => {
    const handleTransactionChanged = () => {
      walletsUpdatedAtRef.current = null;
    };

    TransactionEventEmitter.onTransactionChanged(handleTransactionChanged);
    return () => {
      TransactionEventEmitter.offTransactionChanged(handleTransactionChanged);
    };
  }, []);

  const contextValue = useMemo<GlobalContextType>(
    () => ({
      appInfo,
      setAppInfo,
      isReady,
      isLogoutConfirmedRef,
      isIdleLogoutRef,
      unreadTotalCount,
      setUnreadTotalCount,

      // Backward compatibility defaults (actual OTA state lives in OTAContext)
      isOtaUpdateAvailable: false,
      isOtaDownloading: false,
      isOtaUpdateReady: false,
      startOtaUpdate: async () => {},
      reloadOtaApp: async () => {},
      otaError: null,
      otaPriority: "normal",

      globalPhone,
      setGlobalPhone,
      balance,
      setBalance,
      walletBalance,
      setWalletBalance,

      // Forward loading actions without subscribing GlobalProvider to loading state changes
      globalLoading: DEFAULT_LOADING,
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
    }),
    [
      appInfo,
      isReady,
      unreadTotalCount,
      globalPhone,
      balance,
      walletBalance,
      showGlobalLoading,
      hideGlobalLoading,
      setLoadingProgress,
      wallets,
      walletsUpdatedAt,
      walletLoading,
      walletError,
      fetchWallets,
      updateWalletBalance,
      defaultWalletId,
      setPrimaryWallet,
      getPrimaryWallet,
      defaultWallet,
    ]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export { GlobalContext, GlobalProvider };
