import signalRService from "@/services/SignalRService";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import DeviceInfo from "react-native-device-info";
import StorageKey from "../constants/StorageKey";
// import { useHomeService } from "../services/HomeService";
import StorageService from "../services/StorageService";
import { GlobalContext } from "./GlobalContext";

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
  } catch (error) {
    return 2000; 
  }
};

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const { getItem, setItem } = StorageService;
  const { setBalance, setWalletBalance } = useContext(GlobalContext);
  // const { getPrimaryAccount, getBalance, getPrimaryWallet } = useHomeService();
  const globalContext = useContext(GlobalContext);
  const hasInitialized = useRef(false);

  const handleUpdateThemeBanners = async (data: any) => {
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
    console.log("✅ ThemeBanners updated in storage");
  };

  const handleUpdatePopupBanners = async (data: any) => {
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
    console.log("✅ PopupBanners updated in storage");
  };

  // const handleBalanceUpdate = async (data: any) => {
  //   if (!globalContext) {
  //     return;
  //   }
  //   const primaryAccount = getPrimaryAccount();
  //   if (
  //     data.account &&
  //     primaryAccount &&
  //     data.account === primaryAccount.accountnumber
  //   ) {
  //     const balanceData = await getBalance(primaryAccount.accountnumber);
  //     const formattedBalance = Number(balanceData).toLocaleString("en-US", {
  //       minimumFractionDigits: 2,
  //       maximumFractionDigits: 2,
  //     });
  //     setBalance(formattedBalance);
  //   }
  //   const primaryWallet = getPrimaryWallet();
  //   if (
  //     data.wallet &&
  //     primaryWallet &&
  //     data.wallet === primaryWallet.walletnumber
  //   ) {
  //     const balanceData = primaryWallet?.balance || "0";
  //     const formattedBalance = Number(balanceData).toLocaleString("en-US", {
  //       minimumFractionDigits: 2,
  //       maximumFractionDigits: 2,
  //     });
  //     setWalletBalance(formattedBalance);
  //   }
  // };

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;
    let isMounted = true;

    const start = async () => {
      const delay = await getSignalRDelay();

      const task = InteractionManager.runAfterInteractions(() => {
        const timer = setTimeout(async () => {
          if (!isMounted) {
            return;
          }
          try {
            await signalRService.initConnection(true);
            if (isMounted) {
              setIsConnected(signalRService.isConnected());
            }

            const originalOn = signalRService.on.bind(signalRService);

            signalRService.on = (eventName, callback) => {
              originalOn(eventName, (...args) => {
                console.log(
                  `📩 [ALL EVENTS] Event: ${eventName}`,
                  JSON.stringify(args)
                );
                callback(...args);
              });
            };

            signalRService.on("BannerUpdated", async (data) => {
              switch (data.typeUsing) {
                case "Theme":
                  await handleUpdateThemeBanners(data);
                  break;
                case "Popup":
                  await handleUpdatePopupBanners(data);
                  break;
              }
            });

            // signalRService.on("BalanceUpdated", (data) => {
            //   switch (data.typeUsing) {
            //     case "balance":
            //       handleBalanceUpdate(data);
            //       break;
            //   }
            // });

          } catch (error) {
            console.error("❌ SignalR: Failed to initialize", error);
          }
        }, delay); 

        return () => clearTimeout(timer);
      });

      return task;
    };

    let cleanupTask: any = null;
    start().then((task) => {
      cleanupTask = task;
    });

    return () => {
      isMounted = false;
      if (cleanupTask) {
        cleanupTask.cancel();
      }
      signalRService.stop();
    };
  }, [globalContext]);

  return (
    <SignalRContext.Provider value={{ isConnected }}>
      {children}
    </SignalRContext.Provider>
  );
};
