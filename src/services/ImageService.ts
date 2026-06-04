import { COMMAND_NAME } from "@/constants/CommandName";
import { useApiService } from "./useApiService";

export const useImageService = () => {
  const { auth } = useApiService();

  const searchBannerImage = async (
    typeUsing: string,
    position: string,
    pageindex: number,
    pagesize: number,
  ): Promise<any[]> => {
    try {
      const response = await auth.getSearchData({
        commandname: COMMAND_NAME.SearchBannerByTypeUsingAndPosion,
        searchtext: "",
        pageindex: pageindex,
        pagesize: pagesize,
        parameters: {
          typeusing: typeUsing,
          position: position
        }
      });
      if (response.isSuccess()) {
        const rawData = response.getValue("items") as any[]; 
        return rawData || [];
      } else {
        console.warn(`searchBannerImage API call failed: ${response.getError()}`);
        return []; 
      }
    } catch (error) {
      console.error("searchBannerImage error:", error);
      return [];
    }
    
  };

  return {
    searchBannerImage,
  };
};
