
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

  // async executeReloadCache(): Promise<BaseResponseModel> {
  //   return await apiService.executeWorkflow(
  //     WORKFLOWCODE.MB_RELOAD_CACHE,
  //     {},
  //     false,
  //     true
  //   );
  // },

  // /**
  //  * Get system configuration
  //  */
  // async getSystemConfig(): Promise<BaseResponseModel> {
  //   return await apiService.executeWorkflow(
  //     WORKFLOWCODE.MB_GET_SYSTEM_CONFIG,
  //     {},
  //     false,
  //     true
  //   );
  // },

  // /**
  //  * Update system settings
  //  */
  // async updateSystemSettings(settings: Record<string, any>): Promise<BaseResponseModel> {
  //   return await apiService.executeWorkflow(
  //     WORKFLOWCODE.MB_UPDATE_SYSTEM_SETTINGS,
  //     settings,
  //     false,
  //     true
  //   );
  // },
};
