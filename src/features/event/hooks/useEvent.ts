import { AppConfig } from "@/config/AppConfig";
import StorageKey from "@/constants/StorageKey";
import { Event } from "@/features/event/types/Event";
import {
  CreateEventPayload,
  eventRepository,
  EventSearchParams,
  UpdateEventParams,
} from "@/services/repositories/event.repository";
import StorageService from "@/services/StorageService";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 9999;

interface UseEventOptions {
  autoFetch?: boolean;
  forceRefresh?: boolean;
}

// Session cache - chỉ tồn tại trong runtime, mất khi tắt app
let sessionCache: {
  events: Event[];
  timestamp: number;
} | null = null;

export const useEvent = (options: UseEventOptions = {}) => {
  const { autoFetch = true, forceRefresh = false } = options;

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch ALL events from API once
   */
  const fetchAllEvents = useCallback(async (skipCache = false) => {
    // Kiểm tra cache nếu không skipCache
    if (!skipCache && sessionCache) {
      const isExpired =
        Date.now() - sessionCache.timestamp > AppConfig.CACHE.CATEGORY_TIMEOUT;

      if (!isExpired) {
        console.log("[useEvent] Using cached data");
        setAllEvents(sessionCache.events);
        return;
      } else {
        console.log("[useEvent] Cache expired, fetching new data");
      }
    }

    try {
      setLoading(true);
      setError(null);
      const userCode = await StorageService.getItem(StorageKey.userCode);
      if (!userCode) {
        throw new Error('Missing user code');
      }

      const params: EventSearchParams = {
        userCode: userCode,
        status: "",
        event_type: "",
        wallet_id: undefined,
        from_date: "",
        to_date: "",
        search_text: "",
        page_index: 1,
        page_size: PAGE_SIZE,
      };

      console.log("[useEvent] Fetching ALL events");

      const response = await eventRepository.getEvents(params);

      if (response.isSuccess() && response.data) {
        const items = response.data.items || [];

        console.log("[useEvent] Fetched all events:", {
          total: items.length,
          active: items.filter((e: Event) => e.status === "ACTIVE").length,
          completed: items.filter((e: Event) => e.status === "COMPLETED")
            .length,
        });

        // Cache data
        sessionCache = {
          events: items,
          timestamp: Date.now(),
        };

        setAllEvents(items);
        console.log("[useEvent] Data fetched and cached");
      } else {
        throw new Error(response.message || "Không thể tải danh sách sự kiện");
      }
    } catch (err) {
      console.error("[useEvent] Fetch events failed:", err);
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách sự kiện"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(
    async (payload: CreateEventPayload) => {
      try {
        setError(null);
        setLoading(true);
        console.log("[useEvent] Creating event payload:", payload);

        const response = await eventRepository.createEvent(payload);

        if (!response.isSuccess()) {
          throw new Error(response.message || "Tạo sự kiện thất bại");
        }

        // Clear cache và refresh lại sau khi tạo
        console.log("[useEvent] Event created, clearing cache and refreshing");
        sessionCache = null;
        await fetchAllEvents(true);

        return true;
      } catch (err) {
        console.error("[useEvent] Create event failed:", err);
        setError(err instanceof Error ? err.message : "Không thể tạo sự kiện");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchAllEvents]
  );

  const deleteEvent = useCallback(
    async (eventId: number) => {
      try {
        setError(null);
        setLoading(true);
        console.log("[useEvent] Deleting event:", eventId);

        const response = await eventRepository.deleteWalletEvent(eventId);

        if (!response.isSuccess()) {
          throw new Error(response.message || "Xóa sự kiện thất bại");
        }

        // Clear cache và refresh lại sau khi xóa
        console.log("[useEvent] Event deleted, clearing cache and refreshing");
        sessionCache = null;
        await fetchAllEvents(true);

        return true;
      } catch (err) {
        console.error("[useEvent] Delete event failed:", err);
        setError(err instanceof Error ? err.message : "Không thể xóa sự kiện");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchAllEvents]
  );

  const updateEvent = useCallback(
    async (payload: any) => {
      try {
        setError(null);
        setLoading(true);

        const repoPayload: UpdateEventParams = {
          id: payload.id,
          wallet_id: payload.wallet_id,
          title: payload.title,
          description: payload.description,
          color: payload.color,
          icon: payload.icon,
          end_on_utc:
            payload.end_on_utc instanceof Date
              ? payload.end_on_utc.toISOString().split(".")[0]
              : payload.end_on_utc,
          status: payload.status,
        };

        console.log("[useEvent] Updating event payload:", repoPayload);

        const response = await eventRepository.updateWalletEvent(repoPayload);

        if (!response.isSuccess()) {
          throw new Error(response.message || "Cập nhật sự kiện thất bại");
        }

        // Clear cache và refresh lại sau khi cập nhật
        console.log("[useEvent] Event updated, clearing cache and refreshing");
        sessionCache = null;
        await fetchAllEvents(true);

        return true;
      } catch (err) {
        console.error("[useEvent] Update event failed:", err);
        setError(
          err instanceof Error ? err.message : "Không thể cập nhật sự kiện"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchAllEvents]
  );

  /**
   * Force refresh - bỏ qua cache
   */
  const refetch = useCallback(() => {
    console.log("[useEvent] Force refresh");
    fetchAllEvents(true);
  }, [fetchAllEvents]);

  /**
   * Clear cache manually
   */
  const clearCache = useCallback(() => {
    console.log("[useEvent] Cache cleared");
    sessionCache = null;
  }, []);

  /**
   * Filter events by status (client-side)
   */
  const getEventsByStatus = useCallback(
    (status: "ACTIVE" | "COMPLETED") => {
      return allEvents.filter((event) => event.status === status);
    },
    [allEvents]
  );

  /**
   * Get active events
   */
  const activeEvents = useMemo(() => {
    return allEvents.filter((event) => event.status === "ACTIVE");
  }, [allEvents]);

  /**
   * Get completed events
   */
  const completedEvents = useMemo(() => {
    return allEvents.filter((event) => event.status === "COMPLETED");
  }, [allEvents]);

  // Auto fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchAllEvents(forceRefresh);
    } else {
      console.log(
        "[useEvent] NOT calling fetchAllEvents. autoFetch:",
        autoFetch
      );
    }
  }, [autoFetch, forceRefresh, fetchAllEvents]);

  return {
    allEvents,
    activeEvents,
    completedEvents,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchAllEvents, // Deprecated - dùng refetch thay thế
    refetch,
    clearCache,
    getEventsByStatus,
  };
};
