// src/features/settings/hooks/useChangePassword.ts
import StorageKey from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { settingRepository } from "@/services/repositories";
import StorageService from "@/services/StorageService";
import { encrypt } from "@/utils/Utils";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { useSettingService } from "./useSettingService";

interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export const useChangePassword = () => {
  const { showNotification } = useNotification();
  const { handleLogout } = useSettingService();
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex =
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!?.*_-])[A-Za-z0-9@#$%^&+=!?.*_-]{8,20}$/;

  // Validate form
  useEffect(() => {
    setValid(
      password !== "" &&
        newPassword !== "" &&
        confirmPassword !== "" &&
        newPassword === confirmPassword &&
        passwordRegex.test(newPassword)
    );
  }, [password, newPassword, confirmPassword]);

  const changePassword = async (params: ChangePasswordParams) => {
    try {
      setLoading(true);

      if (newPassword === password) {
        Alert.alert(t("common.error"), t("auth.new_password_same_as_old"));
        return {
          success: false,
          message: t("auth.new_password_same_as_old"),
        };
      }

      if (!passwordRegex.test(newPassword)) {
        Alert.alert(t("common.error"), t("auth.password_not_secure"));
        return {
          success: false,
          message: t("auth.password_not_secure"),
        };
      }
      const appInfo = await StorageService.getAsyncItem(StorageKey.appInfo);
      const userName = JSON.parse(appInfo).login_name;
      const response = await settingRepository.changePassword(
        encrypt(userName + "_" + params.currentPassword),
        encrypt(userName + "_" + params.newPassword)
      );

      if (response.isSuccess()) {
        await StorageService.setAsyncItem(
          StorageKey.isVerifyFirstLogin,
          "true"
        );
        showNotification(
          t("auth.change_password_success"),
          "success",
          undefined,
          undefined,
          undefined,
          () => {
            //   isIdleLogoutRef.current = true;
            handleLogout();
          }
        );
      } else {
        throw new Error(t("auth.current_password_incorrect"));
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    password,
    setPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    valid,
    loading,
    changePassword,
  };
};
