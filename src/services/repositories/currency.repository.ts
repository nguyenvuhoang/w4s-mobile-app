import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export interface Currency {
  currency_id: string;
  short_currency_id: string;
  currency_name: string;
  currency_number: number;
  status_of_currency: string; 
  display_order: number;
  symbol: string;
}

export interface CurrencySearchParams {
  search_text?: string;
  page_index: number;
  page_size: number;
}

export const currencyRepository = {

  async getCurrencies(
    params: CurrencySearchParams
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_SIMPLE_SEARCH_CURRENCY,
        {
          search_text: params.search_text || "",
          page_index: params.page_index,
          page_size: params.page_size,
        },
        false,
        true
      );
    } catch (error) {
      console.error('[currencyRepository] Error fetching currencies:', error);
      throw error;
    }
  },

  // TODO: Add more methods if needed
  // async createCurrency(data: any): Promise<BaseResponseModel> {
  //   return await apiService.executeWorkflow(
  //     WORKFLOWCODE.MB_CREATE_CURRENCY,
  //     data,
  //     false
  //   );
  // },

  // async updateCurrency(currencyId: string, data: any): Promise<BaseResponseModel> {
  //   return await apiService.executeWorkflow(
  //     WORKFLOWCODE.MB_UPDATE_CURRENCY,
  //     { currency_id: currencyId, ...data },
  //     false
  //   );
  // },

  // async deleteCurrency(currencyId: string): Promise<BaseResponseModel> {
  //   return await apiService.executeWorkflow(
  //     WORKFLOWCODE.MB_DELETE_CURRENCY,
  //     { currency_id: currencyId },
  //     false
  //   );
  // },
};