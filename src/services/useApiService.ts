import { authRepository } from "./repositories/auth.repository";
import { notificationRepository } from "./repositories/notification.repository";
import { systemRepository } from "./repositories/system.repository";

export const useApiService = () => {
  return {
    notification: notificationRepository,
    auth: authRepository,
    system: systemRepository,
  };
};
