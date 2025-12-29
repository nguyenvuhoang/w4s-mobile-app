export type NotificationCategory = 'SYSTEM' | 'PROMOTION' | 'BALANCE';

export interface NotificationItemModel {
  id: string;
  title: string;
  message: string;
  datetime: string;
  isRead: boolean;
  category: NotificationCategory;
  templateid?: string;
  data?: any;
}

export interface NotificationData {
  items: NotificationItemModel[];
  unreadCount: number;
  hasMore: boolean;
}