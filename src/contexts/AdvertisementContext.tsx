import AdvertisementModal from "@/components/modals/AdvertisementModal";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  Advertisement,
  useAdvertisementService,
} from "../services/AdvertisementService";

interface AdvertisementContextType {
  showAdForScreen: (screenName: string) => void;
}

const AdvertisementContext = createContext<AdvertisementContextType | undefined>(
  undefined
);

const ONE_TIME_AD_SCREENS = ["Brand", "Home"];
const REPEATED_AD_SCREENS = ["LoanProduct", "PromotionScreen"];

export const AdvertisementProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [lastShownScreen, setLastShownScreen] = useState<string | null>(null);
  const [shownOneTimeScreens, setShownOneTimeScreens] = useState<string[]>([]);

  const { getAdvertisement } = useAdvertisementService();

  const showAdForScreen = useCallback(
    async (screenName: string) => {
      setLastShownScreen(screenName);
      if (screenName === lastShownScreen) return;

      const isOneTimeAdScreen = ONE_TIME_AD_SCREENS.includes(screenName);
      const isRepeatAdScreen = REPEATED_AD_SCREENS.includes(screenName);

      if (isOneTimeAdScreen && !shownOneTimeScreens.includes(screenName)) {
        const advertisement = await getAdvertisement(screenName);
        if (advertisement) {
          setAd(advertisement);
          setIsVisible(true);
          setLastShownScreen(screenName);
          setShownOneTimeScreens((prev) => [...prev, screenName]);
        }
        return;
      }

      if (isRepeatAdScreen) {
        const advertisement = await getAdvertisement(screenName);
        if (advertisement) {
          setAd(advertisement);
          setIsVisible(true);
          setLastShownScreen(screenName);
        }
      }
    },
    [getAdvertisement, lastShownScreen, shownOneTimeScreens]
  );

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setAd(null);
  }, []);

  return (
    <AdvertisementContext.Provider value={{ showAdForScreen }}>
      {children}
      {ad && (
        <AdvertisementModal
          visible={isVisible}
          imageUrl={ad.imageUrl}
          onClose={handleClose}
        />
      )}
    </AdvertisementContext.Provider>
  );
};

export const useAdvertisement = () => {
  const context = useContext(AdvertisementContext);
  if (!context) {
    throw new Error(
      "useAdvertisement must be used within an AdvertisementProvider"
    );
  }
  return context;
};
