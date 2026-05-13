// BottomActionModal.tsx
// Using @gorhom/bottom-sheet inside standard Modal to guarantee full screen overlay

import CustomText from "@/components/base/CustomText";
import { normalize, wp } from "@/utils/layout";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ActionItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  destructive?: boolean;
  hide?: boolean;
}

interface BottomActionModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: ActionItem[];
  colors: any;
  cancelText?: string;
  hasBottomNav?: boolean;
}

const BottomActionModal: React.FC<BottomActionModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  actions,
  colors,
  cancelText = "Hủy",
  hasBottomNav = false,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const visibleActions = actions.filter((action) => !action.hide);

  // Snap points
  const snapPoints = useMemo(() => ["50%"], []);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  // Handle sheet changes
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  // Không render khi không visible
  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          onChange={handleSheetChange}
          backgroundStyle={{ backgroundColor: colors.card }}
          handleIndicatorStyle={{ backgroundColor: colors.icon }}
          bottomInset={0}
        >
          <BottomSheetView
            style={[
              styles.contentContainer,
              { paddingBottom: Math.max(insets.bottom, normalize(34)) }
            ]}
          >
            {/* Header */}
            {(title || subtitle) && (
              <View style={styles.modalHeader}>
                {title && (
                  <CustomText
                    style={[styles.modalTitle, { color: colors.text }]}
                    type="bold"
                  >
                    {title}
                  </CustomText>
                )}
                {subtitle && (
                  <CustomText
                    style={[styles.modalSubtitle, { color: colors.icon }]}
                    type="regular"
                  >
                    {subtitle}
                  </CustomText>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              {visibleActions.map((action, index) => {
                const isLast = index === visibleActions.length - 1;
                const textColor = action.destructive
                  ? "#FF3B30"
                  : action.color || colors.text;

                return (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.modalActionItem,
                      {
                        borderBottomWidth: isLast ? 0 : 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={action.onPress}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={action.icon}
                      size={normalize(22)}
                      color={textColor}
                    />
                    <CustomText
                      style={[styles.modalActionText, { color: textColor }]}
                      type="medium"
                    >
                      {action.label}
                    </CustomText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[
                styles.modalCancelButton,
                { backgroundColor: colors.background },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <CustomText
                style={[styles.modalCancelText, { color: colors.text }]}
                type="semiBold"
              >
                {cancelText}
              </CustomText>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: wp(5),
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: normalize(24),
  },
  modalTitle: {
    fontSize: normalize(18),
  },
  modalSubtitle: {
    fontSize: normalize(14),
    marginTop: normalize(4),
  },
  modalActions: {
    marginBottom: normalize(12),
  },
  modalActionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    paddingVertical: normalize(16),
  },
  modalActionText: {
    fontSize: normalize(16),
  },
  modalCancelButton: {
    paddingVertical: normalize(16),
    borderRadius: normalize(12),
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: normalize(16),
  },
});

export default BottomActionModal;