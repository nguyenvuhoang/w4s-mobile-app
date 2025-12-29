import { apiClient } from "./ApiClient";
import { BaseResponseModel, SimpleRequestModel } from "./models/ClientModel";

class ApiService {
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

      // ✅ Luôn dùng SimpleRequestModel
      const requestPayload = new SimpleRequestModel(workflowid || "", data);
      
      console.log("REQUEST == ", JSON.stringify(requestPayload));
      const response = await apiClient.post1(requestPayload);
      console.log("RESPONSE == ", JSON.stringify(response));

      return response;
    } finally {
      if (isShowLoading) {
        (window as any).hideLoading?.();
      }
    }
  }

  async executeWorkflow(
    workflowId: string,
    data: any,
    isShowLoading: boolean = false,
    useMicro: boolean = false
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
    useMicro: boolean = false
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

export const apiService = new ApiService();