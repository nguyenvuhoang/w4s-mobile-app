import signalRService from "@/services/SignalRService";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus, InteractionManager } from "react-native";
import DeviceInfo from "react-native-device-info";
import StorageKey from "../constants/StorageKey";
import StorageService from "../services/StorageService";

interface SignalRContextType {
  isConnected: boolean;
}

const SignalRContext = createContext<SignalRContextType | null>(null);

export const useSignalR = () => {
  const ctx = useContext(SignalRContext);
  if (!ctx) throw new Error("useSignalR must be used within SignalRProvider");
  return ctx;
};

const getSignalRDelay = async (): Promise<number> => {
  try {
    const totalMemory = await DeviceInfo.getTotalMemory();
    const totalMemoryGB = totalMemory / (1024 * 1024 * 1024);

    if (totalMemoryGB < 2) {
      return 3000;
    }

    if (totalMemoryGB < 4) {
      return 2000;
    }

    return 1000;
  } catch {
    return 2000;
  }
};

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const { getItem, setItem } = StorageService;
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const handleUpdateThemeBanners = async (data: any) => {
    try {
      const raw = await getItem(StorageKey.ThemeBanners);
      const list = raw ? JSON.parse(raw) : [];

      const newBanner = {
        id: data.id,
        imgid: data.imgId,
        imgsource: data.imgSource,
        type: data.type,
        typeusing: data.typeUsing,
        position: data.position,
        order: data.order,
      };

      const existingIndex = list.findIndex(
        (b: { imgid: any }) => b.imgid === newBanner.imgid
      );

      if (existingIndex >= 0) {
        list[existingIndex] = newBanner;
      } else {
        list.push(newBanner);
      }
      await setItem(StorageKey.ThemeBanners, JSON.stringify(list));
      if (__DEV__) console.log("✅ ThemeBanners updated in storage");
    } catch (err) {
      if (__DEV__) console.warn("Failed to update ThemeBanners in storage:", err);
    }
  };

  const handleUpdatePopupBanners = async (data: any) => {
    try {
      const raw = await getItem(StorageKey.PopupBanners);
      const list = raw ? JSON.parse(raw) : [];

      const newBanner = {
        id: data.id,
        title: data.title,
        imgid: data.imgId,
        imgsource: data.imgSource,
        level: data.level,
        status: data.status,
        dateCreated: data.dateCreated,
        userCreated: data.userCreated,
        dateApproved: data.dateApproved,
        userApproved: data.userApproved,
        dateModified: data.dateModified,
        userModified: data.userModified,
        service: data.service,
        type: data.type,
        channel: data.channel,
        position: data.position,
        typeusing: data.typeUsing,
        order: data.order,
        creationDate: data.creationDate,
      };

      const existingIndex = list.findIndex(
        (b: { imgid: any }) => b.imgid === newBanner.imgid
      );

      if (existingIndex >= 0) {
        list[existingIndex] = newBanner;
      } else {
        list.push(newBanner);
      }

      await setItem(StorageKey.PopupBanners, JSON.stringify(list));
      if (__DEV__) console.log("✅ PopupBanners updated in storage");
    } catch (err) {
      if (__DEV__) console.warn("Failed to update PopupBanners in storage:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initTimer: ReturnType<typeof setTimeout> | null = null;
    let interactionPromise: { cancel: () => void } | null = null;

    const handleBannerUpdated = async (data: any) => {
      if (!data) return;
      switch (data.typeUsing) {
        case "Theme":
          await handleUpdateThemeBanners(data);
          break;
        case "Popup":
          await handleUpdatePopupBanners(data);
          break;
      }
    };

    const initSignalR = async () => {
      const delay = await getSignalRDelay();

      interactionPromise = InteractionManager.runAfterInteractions(() => {
        initTimer = setTimeout(async () => {
          if (!isMounted) return;
          try {
            await signalRService.initConnection(true);
            if (isMounted) {
              setIsConnected(signalRService.isConnected());
              signalRService.on("BannerUpdated", handleBannerUpdated);
            }
          } catch (error) {
            if (__DEV__) console.error("❌ SignalR: Failed to initialize", error);
          }
        }, delay);
      });
    };

    initSignalR();

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (__DEV__) console.log("📱 App foregrounded: reconnecting SignalR...");
        await signalRService.initConnection(true);
        if (isMounted) {
          setIsConnected(signalRService.isConnected());
        }
      } else if (
        appStateRef.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        if (__DEV__) console.log("📱 App backgrounded: stopping SignalR connection...");
        await signalRService.stop();
        if (isMounted) {
          setIsConnected(false);
        }
      }
      appStateRef.current = nextAppState;
    };

    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      isMounted = false;
      appStateSub.remove();
      if (initTimer) clearTimeout(initTimer);
      if (interactionPromise) interactionPromise.cancel();
      signalRService.off("BannerUpdated", handleBannerUpdated);
      signalRService.stop();
    };
  }, []);

  const contextValue = useMemo<SignalRContextType>(
    () => ({ isConnected }),
    [isConnected]
  );

  return (
    <SignalRContext.Provider value={contextValue}>
      {children}
    </SignalRContext.Provider>
  );
};
