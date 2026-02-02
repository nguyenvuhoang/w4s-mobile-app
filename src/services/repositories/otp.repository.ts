import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export const otpRepository = {
  async generateOTP(payload: {
    phonenumber: string;
    purpose: string;
    withoutsession?: boolean;
    type?: string;
  }): Promise<BaseResponseModel> {
    const workflowId = payload.withoutsession
      ? WORKFLOWCODE.WF_MB_GENERATEOTP_WITHOUT_LOGIN
      : WORKFLOWCODE.WF_MB_GENERATEOTP;

    return await apiService.executeWorkflow(
      workflowId,
      {
        phone_number: payload.phonenumber,
        purpose: payload.purpose,
        type: payload.type,
      },
      false,
      true
    );
  },

  async verifySMSOTP(payload: {
    phonenumber: string;
    purpose: string;
    otpcode: string;
    verifyotpcode: string;
    usercode?: string;
    type?: string;
  }): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.WF_MB_VERIFY_SMSOTP,
      {
        phone_number: payload.phonenumber,
        purpose: payload.purpose,
        otp: payload.otpcode,
        verifyotpcode: payload.verifyotpcode,
        usercode: payload.usercode,
        type: payload.type,
      },
      false,
      true
    );
  },

  async verifySmartOTP(payload: {
    usercode: string;
    otpcode: string;
    purpose: string;
  }): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.WF_MB_VERIFY_SMSOTP,
      payload,
      false,
      true
    );
  },
};
