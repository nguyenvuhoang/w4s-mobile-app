import { BaseResponseModel } from "@/core/api/models/ClientModel";
import { useRef, useState } from "react";

type ModalType = "warning" | "error" | "success";

const useNotificationModal = () => {
  const hasShown = useRef(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<ModalType>("warning");
  const [errorCode, setErrorCode] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [executionId, setExecutionId] = useState("");
  const [nextAction, setNextAction] = useState<string>("");

  const [callback, setCallback] = useState<(() => void) | undefined>(undefined);
  const [onAgree, setOnAgree] = useState<(() => void) | undefined>(undefined);
  const [onReject, setOnReject] = useState<(() => void) | undefined>(undefined);
  const [onReload, setOnReload] = useState<(() => void) | undefined>(undefined);
  const [isReload, setIsReload] = useState(false);

  const showNotification = (
    message: string,
    type: ModalType,
    code?: string,
    action?: string,
    agree?: () => void,
    cb?: () => void,
    onReloadCb?: () => void,
    reject?: () => void,
    details?: string,
    execId?: string
  ) => {
    if (hasShown.current) return;

    setModalMessage(message);
    setModalType(type);
    setErrorCode(code || "");
    setErrorDetails(details || "");
    const finalExecId = execId || (type === "error" || type === "warning" ? (global as any).latestExecutionId : "");
    setExecutionId(finalExecId || "");
    setNextAction(action || "");
    setOnAgree(() => agree || undefined);
    setOnReject(() => reject || undefined);
    setCallback(() => cb || undefined);
    setOnReload(() => onReloadCb || undefined);
    setIsReload(!!onReloadCb);
    setModalVisible(true);
    hasShown.current = true;
  };

  const showNotificationAPI = (
    data: BaseResponseModel,
    cb?: () => void,
    onReloadCb?: () => void
  ) => {
    if (hasShown.current) return;

    setModalMessage(data.getError());
    setModalType(data.isSuccess() ? "success" : "error");
    setErrorCode(data.getErrorCode() || "");
    setErrorDetails("");
    const execId = data.getExecutionId() || (global as any).latestExecutionId || "";
    setExecutionId(execId);
    setNextAction(data.getNextAction() || "");
    setCallback(() => cb || undefined);
    setOnAgree(undefined);
    setOnReload(() => onReloadCb || undefined);
    setIsReload(!!onReloadCb);
    setModalVisible(true);
    hasShown.current = true;
  };

  const hideNotification = () => {
    setModalVisible(false);
    hasShown.current = false;
    setErrorDetails("");
    setExecutionId("");
    (global as any).latestExecutionId = "";

    if (onReject) {
      const tempReject = onReject;
      setOnReject(undefined); 
      tempReject();
      return; 
    }

    if (callback) {
      const temp = callback;
      setCallback(undefined);
      temp();
    }

    if (onReload) {
      const tempReload = onReload;
      setOnReload(undefined);
      tempReload();
    }
    setOnAgree(undefined);
    setOnReload(undefined);
    setIsReload(false);
  };

  return {
    modalVisible,
    modalMessage,
    modalType,
    errorCode,
    errorDetails,
    executionId,
    nextAction,
    onReload,
    isReload,
    callback,
    onAgree,
    onReject, 
    showNotification,
    showNotificationAPI,
    hideNotification,
  };
};

export default useNotificationModal;
