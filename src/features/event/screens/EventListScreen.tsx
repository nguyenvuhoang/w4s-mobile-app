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
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const { showNotification } = useNotification();

  /** Parses multi-language JSON string e.g. {"vi": "...", "en": "..."} */
  const parseLocalizedName = useCallback((nameStr: string): string => {
    if (!nameStr) return "";
    if (!nameStr.startsWith("{")) return nameStr; // Not JSON
    try {
      const parsed = JSON.parse(nameStr);
      return parsed[i18n.language] || parsed.vi || parsed.en || nameStr;
    } catch {
      return nameStr;
    }
  }, [i18n.language]);

  // ✅ Lấy mode từ route params
  const params = useLocalSearchParams();
  const mode = (params.mode as "select" | "manage") || "manage";

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
    return activeTab === "ACTIVE" ? activeEvents : completedEvents;
  }, [activeTab, activeEvents, completedEvents]);

  useFocusEffect(
    useCallback(() => {
      fetchAllEvents();
      return () => { };
    }, [fetchAllEvents])
  );

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateEvent = () => {
    router.push("/(protected)/event/create-event");
  };

  const handleEventPress = async (event: Event) => {
    const localizedTitle = parseLocalizedName(event.title);
    if (mode === "select") {
      await StorageService.setAsyncItem(
        STORAGE_KEY.TEMP_EVENT_STORAGE,
        JSON.stringify({
          eventId: event.id,
          eventName: localizedTitle,
          icon: event.icon,
          color: event.color,
        })
      );
      router.back();
      return;
    } else {
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

    const localizedTitle = parseLocalizedName(selectedEvent.title);
    setTimeout(() => {
      showNotification(
        t("event.confirm_delete", { title: localizedTitle }),
        "warning",
        undefined,
        undefined,
        async () => {
          try {
            const success = await deleteEvent(selectedEvent.id);
            if (success) {
              showNotification(t("event.delete_success"), "success");
            }
          } catch (error) {
            console.error("[EventListScreen] Delete failed:", error);
            showNotification(t("event.delete_failed"), "error");
          }
        }
      );
    }, 300);
  };

  const handleCompleteEvent = () => {
    if (!selectedEvent) return;
    setShowActionModal(false);

    const localizedTitle = parseLocalizedName(selectedEvent.title);
    setTimeout(() => {
      showNotification(
        t("event.confirm_complete", { title: localizedTitle }),
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
              showNotification(t("event.complete_success"), "success");
            }
          } catch (error) {
            console.error("[EventListScreen] Complete failed:", error);
            showNotification(t("event.update_failed"), "error");
          }
        }
      );
    }, 300);
  };

  const handleReactivateEvent = () => {
    if (!selectedEvent) return;
    setShowActionModal(false);

    const localizedTitle = parseLocalizedName(selectedEvent.title);
    setTimeout(() => {
      showNotification(
        t("event.confirm_reactivate", { title: localizedTitle }),
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
              showNotification(t("event.reactivate_success"), "success");
            }
          } catch (error) {
            console.error("[EventListScreen] Reactivate failed:", error);
            showNotification(t("event.update_failed"), "error");
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
        label: t("common.edit"),
        onPress: handleEditEvent,
      },
      {
        id: "history",
        icon: "receipt-outline",
        label: t("event.transaction_history",),
        onPress: handleTransactionHistory,
      },
      {
        id: "complete",
        icon: "checkmark-circle-outline",
        label: t("event.complete_event"),
        onPress: handleCompleteEvent,
        hide: selectedEvent?.status === "COMPLETED",
      },
      {
        id: "reactivate",
        icon: "refresh-outline",
        label: t("event.reactivate_event"),
        onPress: handleReactivateEvent,
        hide: selectedEvent?.status === "ACTIVE",
      },
      {
        id: "delete",
        icon: "trash-outline",
        label: t("event.delete_event"),
        onPress: handleDeleteEvent,
        destructive: true,
      },
    ],
    [selectedEvent, t]
  );

  const renderEventItem = ({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onPress={() => handleEventPress(item)}
      colors={colors}
      mode={mode}
      t={t}
      language={i18n.language}
      parseLocalizedName={parseLocalizedName}
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
            ? t("event.empty_active")
            : t("event.empty_completed")}
        </CustomText>
      </View>
    );
  };

  const renderFooter = () => {
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
            {t("event.active_count", { count: activeEvents.length })}
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
            {t("event.completed_count", { count: completedEvents.length })}
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
          title={mode === "select" ? t("event.select_title") : t("event.title")}
          showBackButton
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText
            style={{ marginTop: normalize(12), color: colors.text }}
            type="regular"
          >
            {t("common.loading")}
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
        title={mode === "select" ? t("event.select_title") : t("event.title")}
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
              {t("common.retry")}
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
          {t("event.create_event")}
        </CustomText>
      </TouchableOpacity>

      {/* -------------------- ACTION MODAL -------------------- */}
      <BottomActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={selectedEvent ? parseLocalizedName(selectedEvent.title) : ""}
        subtitle={
          selectedEvent?.status === "ACTIVE" ? t("event.ongoing") : t("event.finished")
        }
        actions={eventActions}
        colors={colors}
        cancelText={t("common.cancel")}
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
  t: any;
  language: string;
  parseLocalizedName: (s: string) => string;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  colors,
  mode,
  t,
  language,
  parseLocalizedName,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
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
      return t("event.overdue_days", { days: Math.abs(diffDays) });
    } else if (diffDays === 0) {
      return t("event.today");
    } else if (diffDays === 1) {
      return t("event.tomorrow");
    } else {
      return t("event.days_remaining", { days: diffDays });
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
            {parseLocalizedName(event.title)}
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
