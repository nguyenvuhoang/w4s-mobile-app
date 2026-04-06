/**
 * Event Model
 * Types and interfaces for Event feature
 */

export type EventType = "GENERAL" | "WEDDING" | "BIRTHDAY" | "TRAVEL" | "OTHER";
export type EventStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Event {
  id: number;
  wallet_id: number;
  title: string;
  description: string | null;
  location: string | null;
  color: string;
  icon: string;
  start_on_utc: string;
  end_on_utc: string;
  is_all_day: boolean;
  event_type: EventType;
  status: EventStatus;
  planned_amount: number;
  currency_code: string;
  category_id: number;
  budget_id: number;
  reminder_minutes: number;
  reminder_on_utc: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  recurrence_group_id: string | null;
  reference_type: string | null;
  reference_id: number | null;
}

export interface EventListResponse {
  items: Event[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateEventDTO {
  wallet_id: number;
  title: string;
  description?: string;
  location?: string;
  color: string;
  icon: string;
  start_on_utc: string;
  end_on_utc: string;
  is_all_day?: boolean;
  event_type?: EventType;
}

export interface UpdateEventDTO {
  id: number;
  title?: string;
  description?: string;
  location?: string;
  color?: string;
  icon?: string;
  start_on_utc?: string;
  end_on_utc?: string;
  is_all_day?: boolean;
  event_type?: EventType;
  status?: EventStatus;
}

export interface EventFilters {
  status?: EventStatus;
  event_type?: EventType;
  wallet_id?: number;
  from_date?: string;
  to_date?: string;
}
