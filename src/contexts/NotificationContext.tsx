import React, { createContext, useContext } from "react";
import NotificationModal from "../components/modals/NotificationModal";
import useNotificationModal from "../hooks/useNotificationModal";

// Khai báo type cho context
type NotificationContextType = ReturnType<typeof useNotificationModal>;

// Tạo context với giá trị mặc định là undefined
export const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Provider
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const notificationModal = useNotificationModal();
  const {
    modalVisible,
    modalMessage,
    modalType,
    errorCode,
    errorDetails,
    nextAction,
    onReload,
    isReload,
    hideNotification,
    onAgree,
  } = notificationModal;

  return (
    <NotificationContext.Provider value={notificationModal}>
      {children}
      <NotificationModal
        visible={modalVisible}
        onClose={hideNotification}
        message={modalMessage}
        type={modalType}
        errorCode={errorCode}
        errorDetails={errorDetails}
        nextAction={nextAction}
        onReload={onReload}
        isReload={isReload}
        onAgree={onAgree}
      />
    </NotificationContext.Provider>
  );
};

// Custom hook để dùng context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};