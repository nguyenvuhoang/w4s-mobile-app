import StorageKey from "@/constants/StorageKey";
import StorageService from "@/services/StorageService";

export interface Advertisement {
  imageUrl: string;
}

export const useAdvertisementService = () => {
  const { getAsyncItem } = StorageService;
  const getAdvertisement = async (
    screen: string
  ): Promise<Advertisement | null> => {
    const listBannerPopup = await getAsyncItem(StorageKey.PopupBanners);
    const banners =
      typeof listBannerPopup === "string"
        ? JSON.parse(listBannerPopup)
        : listBannerPopup;

    if (!Array.isArray(banners)) return null;

    const banner = banners.find((item) => item.position === screen);

    if (!banner) return null;

    return {
      imageUrl: banner.imgsource,
    };
  };

  return {
    getAdvertisement,
  };
};
