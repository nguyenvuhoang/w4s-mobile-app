import StorageKey from "@/constants/StorageKey";
import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";
import StorageService from "@/services/StorageService";

export const notificationRepository = {
  async getNotifications(
    userCode: string,
    pageIndex: number,
    pageSize: number
  ): Promise<BaseResponseModel> {
    const channelId = await StorageService.getAsyncItem(StorageKey.channelId);

    return await apiService.executeWorkflow(
      WORKFLOWCODE.MB_GET_NOTIFICATIONS,
      {
        usercode: userCode,
        appType: channelId,
        pageindex: pageIndex.toString(),
        pagesize: pageSize.toString(),
      },
      false,
      true
    );
  },

  async updateReadNotificationByCategory(
    userCode: string,
    category: string
  ): Promise<BaseResponseModel> {
    return await apiService.executeWorkflowNew(
      WORKFLOWCODE.MB_UPDATE_READ_NOTIFICATION,
      {
        userCode: userCode,
        Category: category,
      },
      false
    );
  },
};
