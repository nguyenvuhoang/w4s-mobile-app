import { FontAwesome6 } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { copyToClipboard } from "@/utils/Utils";
import { isTablet, normalize } from "@/utils/layout";

const { width } = Dimensions.get("window");
const MODAL_WIDTH = isTablet ? width * 0.55 : width * 0.85;

type NotificationModalProps = {
  visible: boolean;
  onClose: () => void;
  message: unknown;
  type: "warning" | "error" | "success";
  errorCode?: string;
  errorDetails?: string;
  executionId?: string;
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
  executionId,
  nextAction,
  onAgree,
  onReload,
  isReload,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const appVersion = Constants.expoConfig?.version ?? "?";
  const updateId = Updates.updateId ? Updates.updateId.slice(0, 8) : "dev";

  const title =
    type === "error"
      ? (t("common.error"))
      : type === "warning"
        ? (t("common.warning"))
        : (t("common.success"));

  const iconName =
    type === "warning"
      ? "circle-exclamation"
      : type === "error"
        ? "circle-xmark"
        : "circle-check";

  const iconColor =
    type === "warning" ? "#FFA500" : type === "error" ? "#FF3B30" : "#34C759";

  const resolveMessage = (msg: unknown) => {
    if (typeof msg === "string") return msg;
    if (msg instanceof Error) return msg.message;
    try {
      return JSON.stringify(msg);
    } catch {
      return "Unknown error";
    }
  };

  const showTwoButtons = type === "warning" && (onAgree || nextAction);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* ICON */}
          <View style={styles.iconWrapper}>
            <FontAwesome6
              name={iconName}
              size={normalize(44)}
              color={iconColor}
            />
          </View>

          {/* TITLE */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          {/* MESSAGE */}
          <Text style={[styles.message, { color: colors.text }]}>
            {resolveMessage(message)}
          </Text>

          {errorDetails && (
            <Text style={[styles.detail, { color: colors.icon }]}>
              {errorDetails}
            </Text>
          )}

          {errorCode && (
            <Text style={[styles.detail, { color: colors.icon }]}>
              {t("common.errorCode")}: {errorCode}
            </Text>
          )}

          {executionId ? (
            <TouchableOpacity onPress={() => copyToClipboard(executionId)} activeOpacity={0.6}>
              <Text style={[styles.version, { color: colors.text }]}>
                {`${appVersion} (${updateId}) - ${executionId.slice(-12)}`}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.version, { color: colors.text }]}>
              {`${appVersion} (${updateId})`}
            </Text>
          )}

          {/* ACTIONS */}
          {showTwoButtons ? (
            <View style={styles.twoButtonRow}>
              <View style={styles.sideSpace} />

              <TouchableOpacity
                style={[styles.button, styles.outlineButton, { borderColor: colors.tint }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.outlineText, { color: colors.tint }]}>
                  {t("common.reject")}
                </Text>
              </TouchableOpacity>

              <View style={styles.middleSpace} />

              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { backgroundColor: colors.tint }]}
                onPress={() => {
                  onClose();
                  onAgree?.();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryText}>
                  {t("common.agree")}
                </Text>
              </TouchableOpacity>

              <View style={styles.sideSpace} />
            </View>
          ) : (
            <View style={styles.singleButtonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  styles.singleButton,
                  { backgroundColor: colors.tint }
                ]}
                onPress={() => {
                  onClose();
                  onReload?.();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryText}>
                  {isReload
                    ? t("common.reload")
                    : t("common.close")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default NotificationModal;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    width: MODAL_WIDTH,
    borderRadius: 20,
    padding: normalize(20),
    alignItems: "center",
  },

  iconWrapper: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize(12),
  },

  title: {
    fontSize: normalize(18),
    fontFamily: Fonts.bold,
    marginBottom: normalize(8),
    textAlign: "center",
  },

  message: {
    fontSize: normalize(16),
    fontFamily: Fonts.medium,
    textAlign: "center",
    marginBottom: normalize(8),
  },

  detail: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    textAlign: "center",
  },

  version: {
    fontSize: normalize(12),
    opacity: 0.6,
    marginTop: normalize(8),
  },

  /* BUTTONS */

  twoButtonRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: normalize(24),
    alignItems: "center",
  },

  sideSpace: {
    width: "10%",
  },

  middleSpace: {
    width: "10%",
  },

  button: {
    width: "35%",
    height: normalize(42),
    borderRadius: normalize(10),
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButton: {
    backgroundColor: "#2563EB",
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: "#2563EB",
  },

  primaryText: {
    color: "#fff",
    fontFamily: Fonts.medium,
    fontSize: normalize(16),
  },

  outlineText: {
    color: "#2563EB",
    fontFamily: Fonts.medium,
    fontSize: normalize(16),
  },

  singleButtonRow: {
    width: "100%",
    marginTop: normalize(24),
    alignItems: "center",
  },

  singleButton: {
    width: "60%",
  },
});
