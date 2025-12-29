import { apiClient } from "./ApiClient";
import { BaseRequestModel, BaseResponseModel } from "./models/ClientModel";

/**
 * Core API Service - Không dùng React hooks
 * Pure functions để gọi API
 */
class ApiService {
  /**
   * Send request to API
   */
  async sendRequest(
    apiName: string,
    data: any,
    isShowLoading: boolean = true,
    useMicro: boolean = false,
    workflowid?: string
  ): Promise<BaseResponseModel> {
    try {
      if (isShowLoading) {
        (window as any).showLoading?.();
      }

      const request = new BaseRequestModel(
        workflowid,
        apiName,
        data,
        false,
        useMicro
      );
      const response = await apiClient.post1(request);

      console.log("REQUEST == ", JSON.stringify(request));
      console.log("RESPONSE == ", JSON.stringify(response));

      // Handle invalid session will be done at repository or hook level
      return response;
    } finally {
      if (isShowLoading) {
        (window as any).hideLoading?.();
      }
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowId: string,
    data: any,
    isShowLoading: boolean = false,
    useMicro: boolean = true
  ): Promise<BaseResponseModel> {
    return await this.sendRequest(
      "cbs_workflow_execute",
      data,
      isShowLoading,
      useMicro,
      workflowId
    );
  }

  async executeWorkflowNew(
    workflowId: string,
    data: any,
    isShowLoading?: boolean,
    useMicro: boolean = true
  ): Promise<BaseResponseModel> {
    return await this.sendRequest(
      "cbs_workflow_execute",
      data,
      isShowLoading,
      useMicro,
      workflowId
    );
  }
}

// Export singleton instance
export const apiService = new ApiService();
