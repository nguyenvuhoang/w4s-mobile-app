import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

export interface FullDeviceInfo {
  device_id: string;
  device_type: string;
  os_version: string;
  os_name: string | null;
  app_version: string;
  device_name: string;
  model_id?: string | null;
  model_name?: string | null;
  brand?: string | null;
  manufacturer?: string | null;
  total_memory?: number | null;
  is_emulator: boolean;
}

export const getFullDeviceInfo = async (): Promise<FullDeviceInfo> => {
  const isEmulator = !Device.isDevice;

  const deviceId =
    Platform.OS === "ios"
      ? Device.modelId ?? "unknown_ios"
      : Device.osBuildId ?? "unknown_android";

  const deviceType = Platform.OS === "ios" ? "IOS" : "ANDROID";

  const deviceName =
    Device.deviceName ||
    `${Device.brand ?? "Unknown"} ${Device.modelName ?? Device.designName ?? ""}`.trim();

  const info: FullDeviceInfo = {
    device_id: deviceId,
    device_type: deviceType,
    os_version: Device.osVersion ?? "unknown",
    os_name: Device.osName ?? null,
    app_version: Constants.expoConfig?.version ?? "unknown",
    device_name: deviceName,
    model_id: Device.modelId ?? null,
    model_name: Device.modelName ?? null,
    brand: Device.brand ?? null,
    manufacturer: Device.manufacturer ?? null,
    total_memory: Device.totalMemory ?? null,
    is_emulator: isEmulator,
  };

  return info;
};
