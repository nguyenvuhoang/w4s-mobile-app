/**
 * Event Repository
 * Repository for handling event-related API calls using executeWorkflow
 */

import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { BaseResponseModel } from "@/core/api/models/ClientModel";

export interface EventSearchParams {
  status?: string;
  event_type?: string;
  wallet_id?: number;
  from_date?: string;
  to_date?: string;
  search_text?: string;
  page_index: number;
  page_size: number;
}

export interface CreateEventPayload {
  end_date: string;
  wallet_id: number[];
  event_color: string;
  event_icon: string;
  event_name: string;
}

export interface UpdateEventParams {
  event_id: number;
  title?: string;
  description?: string;
  location?: string;
  color?: string;
  icon?: string;
  start_on_utc?: string;
  end_on_utc?: string;
  is_all_day?: boolean;
  event_type?: string;
  status?: string;
}

export const eventRepository = {
  /**
   * Get events list
   */
  async getEvents(params: EventSearchParams): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_RETRIEVE_WALLET_EVENT,
        {
          search_text: params.search_text || "",
          page_index: params.page_index,
          page_size: params.page_size,
        },
        false,
        true
      );
    } catch (error) {
      console.error("[eventRepository] Error fetching events:", error);
      throw error;
    }
  },

  /**
   * Get event by ID
   */
  //   async getEventById(eventId: number): Promise<BaseResponseModel> {
  //     try {
  //       return await apiService.executeWorkflow(
  //         WORKFLOWCODE.WF_EVENT_GET_DETAIL,
  //         {
  //           event_id: eventId,
  //         },
  //         false,
  //         true
  //       );
  //     } catch (error) {
  //       console.error("[eventRepository] Error fetching event detail:", error);
  //       throw error;
  //     }
  //   },

  /**
   * Create new event
   */
  async createEvent(data: CreateEventPayload): Promise<BaseResponseModel> {
    try {
      return await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_CREATE_WALLET_EVENT,
        {
          end_date: data.end_date,
          wallet_id: data.wallet_id,
          event_color: data.event_color,
          event_icon: data.event_icon,
          event_name: data.event_name,
        },
        false
      );
    } catch (error) {
      console.error("[eventRepository] Error creating event:", error);
      throw error;
    }
  },

  /**
   * Update event
   */
  //   async updateEvent(params: UpdateEventParams): Promise<BaseResponseModel> {
  //     try {
  //       return await apiService.executeWorkflow(
  //         WORKFLOWCODE.WF_EVENT_UPDATE,
  //         {
  //           event_id: params.event_id,
  //           title: params.title,
  //           description: params.description,
  //           location: params.location,
  //           color: params.color,
  //           icon: params.icon,
  //           start_on_utc: params.start_on_utc,
  //           end_on_utc: params.end_on_utc,
  //           is_all_day: params.is_all_day,
  //           event_type: params.event_type,
  //           status: params.status,
  //         },
  //         false
  //       );
  //     } catch (error) {
  //       console.error("[eventRepository] Error updating event:", error);
  //       throw error;
  //     }
  //   },

  /**
   * Delete event
   */
  //   async deleteEvent(eventId: number): Promise<BaseResponseModel> {
  //     try {
  //       return await apiService.executeWorkflow(
  //         WORKFLOWCODE.WF_EVENT_DELETE,
  //         {
  //           event_id: eventId,
  //         },
  //         false
  //       );
  //     } catch (error) {
  //       console.error("[eventRepository] Error deleting event:", error);
  //       throw error;
  //     }
  //   },

  /**
   * Complete event (update status to COMPLETED)
   */
  //   async completeEvent(eventId: number): Promise<BaseResponseModel> {
  //     try {
  //       return await apiService.executeWorkflow(
  //         WORKFLOWCODE.WF_EVENT_UPDATE,
  //         {
  //           event_id: eventId,
  //           status: "COMPLETED",
  //         },
  //         false
  //       );
  //     } catch (error) {
  //       console.error("[eventRepository] Error completing event:", error);
  //       throw error;
  //     }
  //   },

  /**
   * Reactivate event (update status to ACTIVE)
   */
  //   async reactivateEvent(eventId: number): Promise<BaseResponseModel> {
  //     try {
  //       return await apiService.executeWorkflow(
  //         WORKFLOWCODE.WF_EVENT_UPDATE,
  //         {
  //           event_id: eventId,
  //           status: "ACTIVE",
  //         },
  //         false
  //       );
  //     } catch (error) {
  //       console.error("[eventRepository] Error reactivating event:", error);
  //       throw error;
  //     }
  //   },
};
