import CustomButton from "@/components/base/CustomButton";
import { performNavigationByName } from "@/core/navigation/performNavigationByName";
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/theme';
import { isTablet, normalize } from "@/utils/layout";
import { FontAwesome6 } from '@expo/vector-icons';
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { t } from "i18next";
import React from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const MODAL_WIDTH = isTablet ? width * 0.55 : width * 0.85;
const MODAL_HEIGHT = 250;

type NotificationModalProps = {
  visible: boolean;
  onClose: () => void;
  message: unknown;
  type: "warning" | "error" | "success";
  errorCode?: string;
  errorDetails?: string;
  nextAction?: string;
  onAgree?: () => void;
  onReload?: () => void;
  isReload?: boolean;
};

const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  message,
  type,
  errorCode,
  errorDetails,
  nextAction,
  onAgree,
  onReload,
  isReload,
}) => {
  const { colors } = useAppTheme();

  const appVersion = Constants.expoConfig?.version || "?";
  const shortUpdateId = Updates.updateId
    ? Updates.updateId.slice(0, 8)
    : "dev";

  const getIconName = () => {
    switch (type) {
      case "warning": return "circle-exclamation"; 
      case "error": return "circle-xmark";
      case "success": return "circle-check";
      default: return "circle-info";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "warning": return "#FFA500";
      case "error": return "#FF0000";
      case "success": return "#008000";
      default: return colors.tint;
    }
  };

  const resolveMessage = (msg: unknown): string => {
    if (typeof msg === "string") return msg;
    if (msg instanceof Error) return msg.message;
    try {
      return JSON.stringify(msg);
    } catch {
      return "Unknown error";
    }
  };

  const iconColor = getIconColor();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]}>
          
          {/* Icon Header */}
          <View style={styles.iconContainer}>
            <FontAwesome6 
              name={getIconName()}
              size={normalize(50)}
              color={iconColor}
            />
          </View>

          {/* Title */}
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {type === "error"
              ? (t("common.error") || "Error")
              : type === "warning"
              ? (t("common.warning") || "Warning")
              : (t("common.success") || "Success")}
          </Text>

          {/* Content */}
          <Text style={[styles.modalText, { color: colors.text }]}>
            {resolveMessage(message)}
          </Text>

          {errorDetails && (
            <Text style={[styles.errorDetails, { color: colors.icon }]}>{errorDetails}</Text>
          )}

          {errorCode && (
            <Text style={[styles.errorCode, { color: colors.icon }]}>
               {t("common.errorCode")}: {errorCode}
            </Text>
          )}

          <Text style={[styles.versionText, { color: colors.icon, opacity: 0.7 }]}>
            {`${appVersion} (${shortUpdateId})`}
          </Text>

          {/* Action Buttons */}
          <View
            style={[
              styles.buttonContainer,
              type === "error" && styles.buttonContainerCentered,
            ]}
          >
            {type === "warning" && (onAgree || nextAction) ? (
              <>
                <CustomButton
                  title={t("common.reject") || "Reject"}
                  onPress={onClose}
                  style={styles.btnHalf}
                  variant="outline" // Dùng variant outline mới cho đẹp
                  textType="medium"
                />
                <CustomButton
                  title={t("common.agree") || "Agree"}
                  onPress={() => {
                    onClose();
                    if (onAgree) {
                      onAgree();
                    } else if (nextAction) {
                      performNavigationByName(nextAction);
                    }
                  }}
                  style={styles.btnHalf}
                  variant="contained"
                  useGradient={true}
                  textType="medium"
                />
              </>
            ) : (
              <CustomButton
                title={
                  isReload
                    ? (t("common.reload") || "Reload")
                    : (t("common.close") || "Close")
                }
                onPress={() => {
                  onClose();
                  if (onReload) onReload();
                }}
                style={styles.btnClose}
                variant="contained"
                useGradient={true}
                textType="medium"
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: MODAL_WIDTH,
    maxWidth: MODAL_WIDTH,
    minHeight: MODAL_HEIGHT,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    width: normalize(60), // Tăng nhẹ kích thước
    height: normalize(60),
    borderRadius: normalize(30),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize(15),
    backgroundColor: "white",
    // Shadow icon
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  modalTitle: {
    textAlign: "center",
    fontSize: normalize(18),
    fontFamily: Fonts.family.bold, // Dùng font Bold cho title
    marginBottom: 10,
  },
  modalText: {
    textAlign: "center",
    fontSize: normalize(16),
    marginBottom: normalize(10),
    fontFamily: Fonts.family.medium,
  },
  errorDetails: {
    textAlign: "center",
    fontSize: normalize(14),
    marginBottom: normalize(5),
    fontFamily: Fonts.family.regular,
  },
  errorCode: {
    textAlign: "center",
    fontSize: normalize(14),
    fontFamily: Fonts.family.regular,
  },
  versionText: {
    textAlign: "center",
    fontSize: normalize(12),
    marginTop: normalize(10),
    fontFamily: Fonts.family.regular,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: normalize(20),
    gap: normalize(15), // Gap giúp tách nút ra
  },
  buttonContainerCentered: {
    justifyContent: "center",
  },
  // Style cho nút
  btnHalf: {
    flex: 1, // Để 2 nút chia đều 50-50
    minWidth: normalize(100),
  },
  btnClose: {
    minWidth: normalize(120),
    paddingHorizontal: normalize(30),
  }
});

export default NotificationModal;
