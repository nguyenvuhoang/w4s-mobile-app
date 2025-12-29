export type ConfirmTransactionParams = {
  transactioncode: string;
  sourceaccount: string;
  receiveraccount: string;
  amount: string | number;
  purpose: string;
  description: string;
};

export interface NotificationType {
  message: string;
  transactiondata: ConfirmTransactionParams;
  data: any;
  isread: boolean;
  datetime: string;
  isshowbutton: boolean;
  templateid: string;
  id: number;
  isprocessed: boolean;
  title: string;
};

export interface ApiNotification {
  NotificationID: number;
  NotificationCategory: string;
  NotificationType: string;
  Description: string;
  Body: string;
  DateTime: string;
  IsRead: number;
  TotalCount: number;
};

export interface NotificationResponse {
  totalcount: number;
  totalpages: number;
  haspreviouspage: boolean;
  hasnextpage: boolean;
  items: NotificationType[];
}

export type NotificationScreenParams = {
  sourceScreen?: string;
};

export type NotificationServiceParams = {
  params?: any;
};

export type NotificationTypeMessageReceived = {
  body: string;
  title: string;
}
