import { COMMAND_NAME } from "@/constants/CommandName";
import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export const authRepository = {
  // ===== Auth =====
  async login(
    username: string,
    encryptedPassword: string,
    fcmToken?: string
  ): Promise<BaseResponseModel> {
    return await apiService.executeWorkflowNew(
      WORKFLOWCODE.WF_MB_LOGIN,
      {
        login_name: username,
        password: encryptedPassword,
        push_id: fcmToken || "",
      },
      false,
      true
    );
  },

  async register(payload: {
    username: string;
    firstname?: string;
    middlename?: string;
    lastname: string;
    gender: number;
    address: string;
    email: string;
    phone: string;
    status: string;
    userlevel: string;
    birthday: string;
    currentstatus: string;
    contracttype: string;
    reason?: string;
    usertype: string;
  }): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.WF_MB_CREATE_USER,
      {
        username: payload.username,
        firstname: payload.firstname || "",
        middlename: payload.middlename || "",
        lastname: payload.lastname,
        gender: payload.gender,
        address: payload.address,
        email: payload.email,
        phone: payload.phone,
        status: payload.status,
        userlevel: payload.userlevel,
        birthday: payload.birthday,
        currentstatus: payload.currentstatus,
        contracttype: payload.contracttype,
        reason: payload.reason || "",
        usertype: payload.usertype,
      },
      false,
      true
    );
  },

  async logout(username: string): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.WF_MB_LOGOUT,
      { login_name: username },
      false,
      true
    );
  },

  async loginBiometric(refreshToken: string): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.WF_MB_REFRESH_TOKEN,
      { refresh_token: refreshToken },
      false,
      true
    );
  },

  // ===== Password =====
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

  // async changePassword(
  //   userCode: string,
  //   oldPassword: string,
  //   newPassword: string
  // ): Promise<BaseResponseModel> {
  //   return await apiService.executeWorkflow(
  //     WORKFLOWCODE.WF_MB_CHANGE_PASSWORD,
  //     {
  //       usercode: userCode,
  //       old_password: oldPassword,
  //       new_password: newPassword,
  //     },
  //     false,
  //     true
  //   );
  // },

  // ===== OTP =====
  async generateOTP(payload: {
    phonenumber: string;
    purpose: string;
    withoutsession?: boolean;
  }): Promise<BaseResponseModel> {
    const workflowId = payload.withoutsession
      ? WORKFLOWCODE.MB_GENERATEOTP_WITHOUT_LOGIN
      : WORKFLOWCODE.MB_GENERATEOTP;

    return await apiService.executeWorkflow(
      workflowId,
      {
        phonenumber: payload.phonenumber,
        purpose: payload.purpose,
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
  }): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.MB_VERIFY_SMSOTP,
      {
        phonenumber: payload.phonenumber,
        purpose: payload.purpose,
        otpcode: payload.otpcode,
        verifyotpcode: payload.verifyotpcode,
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
      WORKFLOWCODE.MB_VERIFY_SMSOTP,
      payload,
      false,
      true
    );
  },

  // ===== Device =====
  async verifyChangeDevice(payload: {
    usercode: string;
    phone: string;
    dateofbirth: string;
    licenseid: string;
    licensetype: string;
    push_id: string;
  }): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.MB_CHANGE_DEVICE,
      payload,
      false,
      true
    );
  },

  // ===== User Info & Status =====
  async getAppInfo(): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.WF_MB_APP_INFO,
      {},
      false,
      true
    );
  },

  async getStatusLogin(usercode: string): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.WF_MB_GET_USER_STATUS_LOGIN,
      { usercode },
      false,
      true
    );
  },

  // ===== Search Data =====
  async getPhoneByUserName(
    userName: string,
    channelId: string
  ): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.MB_EXECUTE_SQL_FROM_CTH_WITHOUT_LOGIN,
      {
        commandname: COMMAND_NAME.getPhoneByUserName,
        searchtext: "",
        issearch: true,
        pagesize: 1,
        pageindex: 0,
        parameters: { id: userName, channel: channelId },
      },
      false,
      true
    );
  },

  async getPhoneByUserCode(
    userCode: string,
    channelId: string
  ): Promise<BaseResponseModel> {
    return await apiService.executeWorkflow(
      WORKFLOWCODE.MB_EXECUTE_SQL_FROM_CTH_WITHOUT_LOGIN,
      {
        commandname: COMMAND_NAME.getPhoneByUserCode,
        searchtext: "",
        issearch: true,
        pagesize: 1,
        pageindex: 0,
        parameters: { id: userCode, channel: channelId },
      },
      false,
      true
    );
  },

  // ===== Update Data (generic update) =====
  async updateData({
    commandname,
    parameters = {},
    withoutsession,
    workflowid,
  }: {
    commandname: string;
    parameters?: Record<string, any>;
    withoutsession?: boolean;
    workflowid?: string;
  }): Promise<BaseResponseModel> {
    const code =
      workflowid ??
      (withoutsession
        ? WORKFLOWCODE.MB_EXECUTE_SQL_WITHOUT_LOGIN
        : WORKFLOWCODE.WF_MB_EXECUTE_SQL_FROM_W4S);

    return await apiService.executeWorkflow(
      code,
      {
        commandname,
        issearch: false,
        parameters,
      },
      false,
      true
    );
  },

  async getSearchData({
    workflowid,
    searchtext,
    commandname,
    pageindex,
    pagesize,
    withoutsession,
    parameters = {},
  }: {
    workflowid?: string;
    searchtext: string;
    commandname: string;
    pageindex: number;
    pagesize: number;
    withoutsession?: boolean;
    parameters?: Record<string, any>;
  }): Promise<BaseResponseModel> {
    const code =
      workflowid ??
      (withoutsession
        ? WORKFLOWCODE.MB_EXECUTE_SQL_WITHOUT_LOGIN
        : WORKFLOWCODE.WF_MB_EXECUTE_SQL_FROM_W4S);

    return await apiService.executeWorkflowNew(
      code,
      {
        commandname: commandname,
        issearch: true,
        pageindex: pageindex,
        pagesize: pagesize,
        parameters: {
          searchtext: searchtext,
          ...parameters,
        },
      },
      false
    );
  },
};
