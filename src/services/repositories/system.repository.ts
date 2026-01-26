import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService, BaseResponseModel } from "@/core/api";

export const systemRepository = {
  // ===== App =====
  getAppInfo: async () => {},
  systemLoadApp: async () => {},
  reloadCache: async () => {},

  // ===== Language =====
  fetchTranslations: async () => {},
  getLanguageVersion: async () => {},

  // ===== Common =====
  getCommandMenu: async () => {},

  /**
   * Update user's default currency
   */
  async updateAppSettings(
    userCode: string,
    value: string,
  ): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.WF_MB_UPDATE_CURRENCY_CODE,
      {
        user_code: userCode,
        currency_code: value,
      },
      false,
      true
    );
  },
};

