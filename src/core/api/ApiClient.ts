import { BaseResponseModel } from "@/core/api/models/ClientModel";
import i18n from "@/core/i18n/i18n";
import StorageService from "@/services/StorageService";
import { getFullDeviceInfo } from "@/utils/device/getFullDeviceInfo";
import NetInfo from "@react-native-community/netinfo";
import * as Sentry from "@sentry/react-native";
import axios, { AxiosHeaders, AxiosInstance, AxiosRequestConfig } from "axios";
import { t } from "i18next";

const apiUrl = "/api/v1/gateway";

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 60000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const headers = await this.getHeaders();
        config.headers = AxiosHeaders.from({ ...config.headers, ...headers });
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private async getHeaders() {
    try {
      const netInfo = await NetInfo.fetch();
      const userSession = await StorageService.getUserSession();

      let deviceInfo: any = {
        lang: i18n.language,
        my_ip: "::1",
        network_type: netInfo.type,
        network_status: netInfo.isConnected ? "connected" : "disconnected",
      };

      const deviceInfos = await getFullDeviceInfo();

      deviceInfo = {
        ...deviceInfo,

        // ✅ Thông tin cơ bản
        device_id: deviceInfos.device_id,
        device_type: deviceInfos.device_type,
        os_version: deviceInfos.os_version,
        os_name: deviceInfos.os_name,
        app_version: deviceInfos.app_version,
        device_name: deviceInfos.device_name,

        // ✅ Thông tin phần cứng
        model_id: deviceInfos.model_id,
        model_name: deviceInfos.model_name,
        brand: deviceInfos.brand,
        manufacturer: deviceInfos.manufacturer,
        total_memory: deviceInfos.total_memory,

        // ✅ Phân loại thiết bị
        is_emulator: deviceInfos.is_emulator,
      };

      if (!deviceInfo.device_id) {
        throw new Error("Can not get Device ID!");
      }

      const token = userSession?.token ?? "";
      // console.log(`========Request token==============: ${token}`);
      // console.log(JSON.stringify(deviceInfo));
      return {
        App: "MB",
        Uid: token,
        My_device: JSON.stringify(deviceInfo),
        User_id: 0,
        Lang: i18n.language,
        D: "localhost",
      };
    } catch (ex) {
      throw new Error("A error occur while creating headers");
    }
  }

  private handleApiError(error: any): never {
    let sentryData: any = {
      fullError: JSON.stringify(error),
      baseURL: this.axiosInstance.defaults.baseURL,
      url: error?.config?.url,
      method: error?.config?.method,
      headers: error?.config?.headers,
      data: error?.config?.data,
      code: error?.code,
      message: error?.message,
      responseStatus: error?.response?.status,
      responseData: error?.response?.data,
    };

    Sentry.captureException(error, {
      extra: sentryData,
    });

    if (error?.message === "Device is offline") {
      throw new Error(
        t(
          "errors.networkError",
          "Device is offline. Please check your network connection."
        )
      );
    }

    if (axios.isAxiosError(error)) {
      const code = error.code;
      const message = error.message;
      const baseURL = this.axiosInstance.defaults.baseURL || "NO_BASE_URL";
      if (error.code === "ECONNABORTED") {
        throw new Error(t("errors.networkTimeout"));
      }
      if (error.response) {
        if (error.response.status >= 400 && error.response.status < 500) {
          throw new Error(t("errors.generalClientError"));
        } else if (error.response.status >= 500) {
          throw new Error(t("errors.generalServerError"));
        }
      }
      const errMsg = `[${baseURL}] [${code || "NO_CODE"}] ${message || ""}`;
      throw new Error(errMsg.trim());
    }
    throw new Error(`${t("errors.unknownError")} (${String(error)})`);
  }

  public async post<T>(data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(apiUrl, data);
      const response = await this.axiosInstance.post<T>(apiUrl, data, config);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  public async uploadImage(
    uri: string,
    lang: string,
    folderName?: string,
    customerCode?: string
  ): Promise<any> {
    if (!uri) {
      throw new Error("No file uri provided");
    }

    const fileName = uri.split("/").pop() || `image_${Date.now()}.jpg`;

    const fileType = fileName.endsWith(".png")
      ? "image/png"
      : fileName.endsWith(".jpeg") || fileName.endsWith(".jpg")
        ? "image/jpeg"
        : "application/octet-stream";

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: fileName,
      type: fileType,
    } as any);

    let url =
      this.axiosInstance.defaults.baseURL + "/api/v1/upload";

    const params = new URLSearchParams();
    if (folderName) params.append("folder", folderName);
    if (customerCode) params.append("customercode", customerCode);

    const query = params.toString();
    if (query) url += `?${query}`;


    const headers: HeadersInit = {
      App: "MB",
      Lang: lang,
    };


    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });
    } catch (networkError) {
      console.error("[uploadImage] Network error (fetch failed):", networkError);
      throw networkError;
    }


    let data: any;
    try {
      data = await res.json();
      console.log("[uploadImage] Response data:", JSON.stringify(data));
    } catch (parseError) {
      console.warn("[uploadImage] Failed to parse response as JSON:", parseError);
      data = null;
    }

    if (!res.ok) {
      console.error(`[uploadImage] Upload failed — status: ${res.status}, data:`, JSON.stringify(data));
      throw new Error(`Upload failed (${res.status}): ${JSON.stringify(data)}`);
    }
    return data;
  }

  public async scanInvoice(uri: string): Promise<any> {
    if (!uri) {
      throw new Error("No file uri provided");
    }

    const fileName = uri.split("/").pop() || `invoice_${Date.now()}.jpg`;

    const fileType = fileName.endsWith(".png")
      ? "image/png"
      : fileName.endsWith(".jpeg") || fileName.endsWith(".jpg")
        ? "image/jpeg"
        : "application/octet-stream";

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: fileName,
      type: fileType,
    } as any);

    formData.append("language", "vie");
    formData.append("collect_words", "true");
    formData.append("document_type", "Invoice");
    formData.append("clean_text", "true");

    const url = this.axiosInstance.defaults.baseURL + "/w4s/api/invoice/scan";

    const customHeaders = await this.getHeaders();
    const headers: Record<string, string> = {};
    for (const key in customHeaders) {
      const value = (customHeaders as Record<string, any>)[key];
      headers[key] = String(value);
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    let data: any;
    try {
      data = await res.json();
      console.log("=== Scan Invoice response data:", data);
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(`Scan Invoice failed (${res.status}): ${JSON.stringify(data)}`);
    }
    return data;
  }

  public async voiceTranscribe(transcript: string): Promise<any> {
    if (!transcript?.trim()) {
      throw new Error("Transcript is empty");
    }

    const url = this.axiosInstance.defaults.baseURL + "/w4s/api/transaction/voice";

    const customHeaders = await this.getHeaders();
    const stringHeaders: Record<string, string> = {};
    for (const key in customHeaders) {
      stringHeaders[key] = String((customHeaders as Record<string, any>)[key]);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...stringHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript, lang: "vi" }),
    });

    let data: any;
    try {
      data = await res.json();
      console.log("=== Voice Transcribe response:", data);
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(`Voice transcribe failed (${res.status}): ${JSON.stringify(data)}`);
    }
    return data;
  }

  public async post1(
    data?: any,
    config?: AxiosRequestConfig,
    retries: number = 1,
    timeout: number = 15000
  ): Promise<BaseResponseModel> {
    config = { ...config, timeout };

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      const offlineError = new Error("Device is offline");
      this.handleApiError(offlineError);
    }

    let lastError: any = null;

    try {
      const fullUrl = `${this.axiosInstance.defaults.baseURL}${apiUrl}`;
      const response = await this.axiosInstance.post(fullUrl, data, config);
      const baseResponse = new BaseResponseModel(response.data);
      if (baseResponse.hasErrors()) {
        const errorInfo = baseResponse.errors.find((e: any) =>
          e.info?.includes("SYS_BANK_INACTIVE")
        );
        if (errorInfo) {
          throw new Error(t("errors.SYS_BANK_INACTIVE"));
        }
      }

      return baseResponse;
    } catch (error: any) {
      lastError = error;

      const isNetworkError =
        error.isAxiosError && error.message === "Network Error";

      if (!isNetworkError) {
        console.log("Axios failed (not network error):", error.message);
        this.handleApiError(error);
      }

      console.log("Axios Network Error -> fallback sang fetch:", error);
    }

    // Fallback sang fetch
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const customHeaders = await this.getHeaders();
      const stringHeaders: Record<string, string> = {};
      for (const key in customHeaders) {
        const value = (customHeaders as Record<string, any>)[key];
        stringHeaders[key] = String(value);
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...stringHeaders,
      };

      if (config?.headers) {
        const configHeaders = config.headers;
        for (const key in configHeaders) {
          const value = configHeaders[key];
          if (value !== null && value !== undefined) {
            headers[key] = String(value);
          }
        }
      }

      const fullUrl = `${this.axiosInstance.defaults.baseURL}${apiUrl}`;
      console.log("Fetch fallback URL:", fullUrl);

      const fetchRes = await fetch(fullUrl, {
        method: "POST",
        signal: controller.signal,
        headers,
        body: JSON.stringify(data),
      });

      clearTimeout(id);

      if (!fetchRes.ok) {
        throw new Error(`HTTP ${fetchRes.status}: ${fetchRes.statusText}`);
      }

      const json = await fetchRes.json();
      console.log("Fetch RESPONSE == ", JSON.stringify(json));

      // ✅ SỬA: Truyền toàn bộ json thay vì json.error
      const baseResponse = new BaseResponseModel(json);

      // Kiểm tra lỗi đặc biệt
      if (baseResponse.hasErrors()) {
        const errorInfo = baseResponse.errors.find((e: any) =>
          e.info?.includes("SYS_BANK_INACTIVE")
        );
        if (errorInfo) {
          throw new Error(t("errors.SYS_BANK_INACTIVE"));
        }
      }

      return baseResponse;
    } catch (fetchErr: any) {
      console.log("Fetch fallback cũng fail:", fetchErr.message);
      lastError = fetchErr;
    }

    this.handleApiError(lastError);
  }
}

// ✅ Named export constants
// export const BASE_URL = "https://emicms.jits.com.vn:2611";
export const BASE_URL =
  "https://ungestural-backhandedly-dennise.ngrok-free.dev";
// export const BASE_URL = "https://41d9f501b89c.ngrok-free.app";

// ✅ Named export instance
export const apiClient = new ApiClient(BASE_URL);

// export default apiClient;
