// src/services/repositories/exchange-rate.repository.ts

import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export interface ExchangeRate {
  rate_date_utc: string;
  currency_code: string;
  currency_name: string;
  buy: number | null;
  transfer: number; // Tỉ giá chuyển đổi so với VNĐ
  sell: number | null;
  source: string;
}

export interface ExchangeRateSearchParams {
  search_text?: string;
  page_index?: number;
  page_size?: number;
}

export const exchangeRateRepository = {
  /**
   * Lấy danh sách tỉ giá quy đổi
   * Tỉ giá được cập nhật vào 9h05 mỗi ngày
   * Tất cả tỉ giá đều so với VNĐ
   */
  async getExchangeRates(
    params: ExchangeRateSearchParams = {}
  ): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_SIMPLE_SEARCH_EXCHANGE_RATE,
        {
          search_text: params.search_text || "",
          page_index: params.page_index || 0,
          page_size: params.page_size || 50,
        },
        false,
        true
      );
    } catch (error) {
      console.error('[exchangeRateRepository] Error fetching exchange rates:', error);
      throw error;
    }
  },
};