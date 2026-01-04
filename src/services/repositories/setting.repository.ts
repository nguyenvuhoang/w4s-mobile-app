import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export const settingRepository = {

  async verifyForgotPassword(
    username: string,
    idCard: string,
    phone: string,
    email: string
  ): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.MB_VERIFY_OTP_RESET_PASSWORD,
      {
        username,
        idcard: idCard,
        phone,
        email,
      },
      false,
      true
    );
  },

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.WF_MB_CHANGE_PASSWORD,
      {
        oldPassword: oldPassword,
        password: newPassword,
      },
      false,
      true
    );
  },
}
