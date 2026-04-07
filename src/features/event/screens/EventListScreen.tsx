import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import BottomActionModal, {
  ActionItem,
} from "@/components/modals/BottomActionModal";
import STORAGE_KEY from "@/constants/StorageKey";
import { useNotification } from "@/contexts/NotificationContext";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Event } from "@/features/event/types/Event";
import StorageService from "@/services/StorageService";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useEvent } from "../hooks/useEvent";

type TabType = "ACTIVE" | "COMPLETED";

interface EventListScreenProps {
  onSelectEvent?: (event: Event) => void;
}

const EventListScreen: React.FC<EventListScreenProps> = ({ onSelectEvent }) => {
  const { colors } = useAppTheme();
  const { showNotification } = useNotification();

  // ✅ Lấy mode từ route params
  const params = useLocalSearchParams();
  const mode = (params.mode as "select" | "manage") || "manage";

  console.log("[EventListScreen] params:", params);
  console.log("[EventListScreen] mode:", mode);

  const [activeTab, setActiveTab] = useState<TabType>("ACTIVE");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // ✅ NEW HOOK - Fetch all và filter client-side
  const {
    allEvents,
    activeEvents,
    completedEvents,
    loading,
    error,
    fetchAllEvents,
    refetch,
    deleteEvent,
    updateEvent,
  } = useEvent();
  const insets = useSafeAreaInsets();

  // ✅ Computed events dựa vào activeTab (client-side filter)
  const events = useMemo(() => {
    const filtered = activeTab === "ACTIVE" ? activeEvents : completedEvents;
    console.log("[EventListScreen] Filtered events for tab:", activeTab);
    console.log("[EventListScreen] Count:", filtered.length);
    return filtered;
  }, [activeTab, activeEvents, completedEvents]);

  useFocusEffect(
    useCallback(() => {
      console.log("[EventListScreen] Fetching all events");
      fetchAllEvents();
      return () => { };
    }, [fetchAllEvents])
  );

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    console.log("[EventListScreen] Switching tab to:", tab);
    setActiveTab(tab);
  };

  const handleRefresh = () => {
    console.log("[EventListScreen] Refreshing all events");
    refetch();
  };

  const handleCreateEvent = () => {
    router.push("/(protected)/event/create-event");
  };

  const handleEventPress = async (event: Event) => {
    if (mode === "select") {
      await StorageService.setAsyncItem(
        STORAGE_KEY.TEMP_EVENT_STORAGE,
        JSON.stringify({
          eventId: event.id,
          eventName: event.title,
          icon: event.icon,
          color: event.color,
        })
      );
      router.back();
      return;
    } else {
      // Mode manage: mở modal options
      console.log("Selected event for management:", event);
      setSelectedEvent(event);
      setShowActionModal(true);
    }
  };

  // ✅ Action handlers
  const handleEditEvent = () => {
    setShowActionModal(false);
    if (!selectedEvent) return;

    setTimeout(() => {
      router.push({
        pathname: "/(protected)/event/edit-event",
        params: { id: selectedEvent.id.toString() },
      });
    }, 300);
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    setShowActionModal(false);

    setTimeout(() => {
      showNotification(
        `Bạn có chắc muốn xóa sự kiện "${selectedEvent.title}"?`,
        "warning",
        undefined,
        undefined,
        async () => {
          try {
            const success = await deleteEvent(selectedEvent.id);
            if (success) {
              showNotification("Đã xóa sự kiện thành công", "success");
            }
          } catch (error) {
            console.error("[EventListScreen] Delete failed:", error);
            showNotification(
              "Không thể xóa sự kiện. Vui lòng thử lại.",
              "error"
            );
          }
        }
      );
    }, 300);
  };

  const handleCompleteEvent = () => {
    if (!selectedEvent) return;
    setShowActionModal(false);

    setTimeout(() => {
      showNotification(
        `Bạn có chắc muốn đánh dấu sự kiện "${selectedEvent.title}" là đã hoàn thành?`,
        "warning",
        undefined,
        undefined,
        async () => {
          try {
            const payload = {
              ...selectedEvent,
              id: selectedEvent.id,
              wallet_id: selectedEvent.wallet_id,
              status: "COMPLETED" as const,
            };
            const success = await updateEvent(payload as any);
            if (success) {
              showNotification("Đã hoàn thành sự kiện", "success");
            }
          } catch (error) {
            console.error("[EventListScreen] Complete failed:", error);
            showNotification(
              "Không thể cập nhật sự kiện. Vui lòng thử lại.",
              "error"
            );
          }
        }
      );
    }, 300);
  };

  const handleReactivateEvent = () => {
    if (!selectedEvent) return;
    setShowActionModal(false);

    setTimeout(() => {
      showNotification(
        `Bạn có chắc muốn kích hoạt lại sự kiện "${selectedEvent.title}"?`,
        "warning",
        undefined,
        undefined,
        async () => {
          try {
            const payload = {
              ...selectedEvent,
              id: selectedEvent.id,
              wallet_id: selectedEvent.wallet_id,
              status: "ACTIVE" as const,
            };
            const success = await updateEvent(payload as any);
            if (success) {
              showNotification(
                "Đã kích hoạt lại sự kiện thành công",
                "success"
              );
            }
          } catch (error) {
            console.error("[EventListScreen] Reactivate failed:", error);
            showNotification(
              "Không thể cập nhật sự kiện. Vui lòng thử lại.",
              "error"
            );
          }
        }
      );
    }, 300);
  };

  const handleTransactionHistory = () => {
    setShowActionModal(false);
    if (!selectedEvent) return;

    setTimeout(() => {
      router.push({
        pathname: "/(protected)/event/transaction-history",
        params: { id: selectedEvent.id.toString() }
      });
    }, 300);
  };

  // ✅ Dynamic actions based on selected event
  const eventActions: ActionItem[] = useMemo(
    () => [
      {
        id: "edit",
        icon: "create-outline",
        label: "Chỉnh sửa",
        onPress: handleEditEvent,
      },
      {
        id: "history",
        icon: "receipt-outline",
        label: "Lịch sử giao dịch",
        onPress: handleTransactionHistory,
      },
      {
        id: "complete",
        icon: "checkmark-circle-outline",
        label: "Hoàn thành",
        onPress: handleCompleteEvent,
        hide: selectedEvent?.status === "COMPLETED",
      },
      {
        id: "reactivate",
        icon: "refresh-outline",
        label: "Kích hoạt lại",
        onPress: handleReactivateEvent,
        hide: selectedEvent?.status === "ACTIVE",
      },
      {
        id: "delete",
        icon: "trash-outline",
        label: "Xóa sự kiện",
        onPress: handleDeleteEvent,
        destructive: true,
      },
    ],
    [selectedEvent]
  );

  const renderEventItem = ({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onPress={() => handleEventPress(item)}
      colors={colors}
      mode={mode}
    />
  );

  const renderEmptyState = () => {
    if (loading && allEvents.length === 0) return null;

    return (
      <View style={styles.emptyContainer}>
        <FontAwesome6
          name="calendar-xmark"
          size={normalize(64)}
          color={colors.icon}
        />
        <CustomText
          style={[styles.emptyText, { color: colors.icon }]}
          type="semiBold"
        >
          {activeTab === "ACTIVE"
            ? "Chưa có sự kiện đang diễn ra"
            : "Chưa có sự kiện đã kết thúc"}
        </CustomText>
      </View>
    );
  };

  const renderFooter = () => {
    // Không còn pagination, chỉ hiện loading khi fetch all
    if (!loading) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  };

  const renderHeader = () => {
    // ✅ Chỉ hiện tabs khi ở mode manage
    if (mode === "select") {
      return null;
    }

    return (
      <View
        style={[styles.tabContainer, { backgroundColor: colors.background }]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "ACTIVE" && [
              styles.activeTab,
              { backgroundColor: colors.tint },
            ],
          ]}
          onPress={() => handleTabChange("ACTIVE")}
          activeOpacity={0.7}
        >
          <CustomText
            style={[
              styles.tabText,
              { color: activeTab === "ACTIVE" ? "#fff" : colors.text },
            ]}
            type="semiBold"
          >
            Đang diễn ra ({activeEvents.length})
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "COMPLETED" && [
              styles.activeTab,
              { backgroundColor: colors.tint },
            ],
          ]}
          onPress={() => handleTabChange("COMPLETED")}
          activeOpacity={0.7}
        >
          <CustomText
            style={[
              styles.tabText,
              { color: activeTab === "COMPLETED" ? "#fff" : colors.text },
            ]}
            type="semiBold"
          >
            Đã kết thúc ({completedEvents.length})
          </CustomText>
        </TouchableOpacity>
      </View>
    );
  };

  /* -------------------- UI STATES -------------------- */

  if (loading && allEvents.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "bottom"]}
      >
        <AppHeader
          title={mode === "select" ? "Chọn sự kiện" : "Sự kiện"}
          showBackButton
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText
            style={{ marginTop: normalize(12), color: colors.text }}
            type="regular"
          >
            Đang tải...
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <AppHeader
        title={mode === "select" ? "Chọn sự kiện" : "Sự kiện"}
        showBackButton
      />

      {/* Tabs - Only in manage mode */}
      {renderHeader()}

      {/* Event List */}
      {error ? (
        <View style={styles.errorContainer}>
          <FontAwesome6
            name="circle-exclamation"
            size={normalize(48)}
            color={colors.error}
          />
          <CustomText
            style={[styles.errorText, { color: colors.error }]}
            type="semiBold"
          >
            {error}
          </CustomText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={handleRefresh}
          >
            <CustomText style={styles.retryButtonText} type="bold">
              Thử lại
            </CustomText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => `event-${item.id}-${activeTab}`}
          contentContainerStyle={[
            styles.listContent,
            events.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Create Button */}
      <TouchableOpacity
        style={[
          styles.createButton,
          {
            backgroundColor: colors.tint,
            bottom: insets.bottom > 0 ? insets.bottom + hp(1) : hp(3),
          },
        ]}
        onPress={handleCreateEvent}
      >
        <CustomText style={styles.createButtonText} type="bold">
          Tạo sự kiện
        </CustomText>
      </TouchableOpacity>

      {/* -------------------- ACTION MODAL -------------------- */}
      <BottomActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={selectedEvent?.title}
        subtitle={
          selectedEvent?.status === "ACTIVE" ? "Đang diễn ra" : "Đã kết thúc"
        }
        actions={eventActions}
        colors={colors}
        cancelText="Hủy"
      />
    </SafeAreaView>
  );
};

// Event Card Component
interface EventCardProps {
  event: Event;
  onPress: () => void;
  colors: any;
  mode: "select" | "manage";
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  colors,
  mode,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Đã quá ${Math.abs(diffDays)} ngày`;
    } else if (diffDays === 0) {
      return "Hôm nay";
    } else if (diffDays === 1) {
      return "Ngày mai";
    } else {
      return `Còn ${diffDays} ngày`;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.eventCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.eventCardLeft}>
        <View style={[styles.eventIcon, { backgroundColor: event.color }]}>
          <FontAwesome6
            name={event.icon as any}
            size={normalize(24)}
            color="#fff"
          />
        </View>
        <View style={styles.eventInfo}>
          <CustomText
            style={[styles.eventTitle, { color: colors.text }]}
            type="bold"
            numberOfLines={1}
          >
            {event.title}
          </CustomText>
          <CustomText
            style={[styles.eventDate, { color: colors.icon }]}
            type="regular"
          >
            {formatDate(event.start_on_utc)} - {formatDate(event.end_on_utc)}
          </CustomText>
          {event.status === "ACTIVE" && (
            <CustomText
              style={[styles.eventDaysRemaining, { color: colors.tint }]}
              type="semiBold"
            >
              {getDaysRemaining(event.end_on_utc)}
            </CustomText>
          )}
        </View>
      </View>
      {mode === "manage" && (
        <FontAwesome6
          name="chevron-right"
          size={normalize(16)}
          color={colors.icon}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    gap: normalize(12),
  },
  tab: {
    flex: 1,
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: normalize(15),
  },
  listContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(10),
  },
  emptyListContent: {
    flexGrow: 1,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: normalize(16),
    borderRadius: normalize(16),
    marginBottom: normalize(12),
    borderWidth: 1,
  },
  eventCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  eventIcon: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(16),
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(12),
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: normalize(16),
    marginBottom: normalize(4),
  },
  eventDate: {
    fontSize: normalize(13),
    marginBottom: normalize(4),
  },
  eventDaysRemaining: {
    fontSize: normalize(13),
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(10),
  },
  emptyText: {
    fontSize: normalize(16),
    marginTop: normalize(16),
    marginBottom: normalize(24),
  },
  emptyButton: {
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
  },
  emptyButtonText: {
    fontSize: normalize(15),
    color: "#fff",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(10),
  },
  errorText: {
    fontSize: normalize(16),
    marginTop: normalize(16),
    marginBottom: normalize(24),
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
  },
  retryButtonText: {
    fontSize: normalize(15),
    color: "#fff",
  },
  footerLoader: {
    paddingVertical: normalize(16),
    alignItems: "center",
  },
  createButton: {
    position: "absolute",
    bottom: hp(3),
    left: wp(5),
    right: wp(5),
    paddingVertical: normalize(16),
    borderRadius: normalize(16),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonText: {
    fontSize: normalize(16),
    color: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(10),
  },
});

export default EventListScreen;
