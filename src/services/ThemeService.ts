import StorageKey from "@/constants/StorageKey";
import StorageService from "@/services/StorageService";
import { useCallback } from "react";

export interface BackgroundOption {
  id: string;
  imageUrl: string;
  linkUrl?: string;
}

export const useThemeService = () => {
  const { getAsyncItem } = StorageService;

  const getBackgroundOptions = useCallback(
    async (
      key: string = StorageKey.ThemeBanners
    ): Promise<BackgroundOption[]> => {
      try {
        const listBackgrounds = await getAsyncItem(key);
        if (!listBackgrounds) {
          return [];
        }
        const backgrounds =
          typeof listBackgrounds === "string"
            ? JSON.parse(listBackgrounds)
            : listBackgrounds;

        if (!Array.isArray(backgrounds)) {
          console.warn(`Backgrounds for key ${key} not found or in wrong format.`);
          return [];
        }
        return backgrounds.map((item) => ({
          id: item.id || item.imgsource,
          imageUrl: item.imgsource,
          linkUrl: item.linkUrl || item.linkurl,
        }));
      } catch (error) {
        console.error(`Error getting background options for key ${key}:`, error);
        return [];
      }
    },
    [getAsyncItem]
  );

  return {
    getBackgroundOptions,
  };
};
