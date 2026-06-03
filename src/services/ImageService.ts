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
    // Mockup data for testing since server does not support SearchBannerByTypeUsingAndPosion yet
    // return [
    //   {
    //     id: "home-1",
    //     imgsource: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
    //     typeusing: "Home",
    //     linkUrl: "https://wealth4s.vn/"
    //   },
    //   {
    //     id: "popup-1",
    //     imgsource: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60",
    //     typeusing: "Popup"
    //   },
    //   {
    //     id: "statistic-1",
    //     imgsource: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
    //     typeusing: "Statistic"
    //   },
    //   {
    //     id: "statistic-2",
    //     imgsource: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60",
    //     typeusing: "Statistic"
    //   },
    //   {
    //     id: "report-1",
    //     imgsource: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60",
    //     typeusing: "Report"
    //   },
    //   {
    //     id: "report-2",
    //     imgsource: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
    //     typeusing: "Report"
    //   }
    // ];
    
    try {
      const response = await auth.getSearchData({
        commandname: COMMAND_NAME.SearchBannerByTypeUsingAndPosion,
        searchtext: "",
        pageindex: pageindex,
        pagesize: pagesize,
        withoutsession: true,
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
