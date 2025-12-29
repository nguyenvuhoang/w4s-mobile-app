import React from "react";
import { Text, View } from "react-native";
import { NotificationItemModel } from "../types/notification.type";

export const NotificationItem = ({ item }: { item: NotificationItemModel }) => {
  return (
    <View style={{ padding: 12, opacity: item.isRead ? 0.5 : 1 }}>
      <Text style={{ fontWeight: "600" }}>{item.title}</Text>
      <Text>{item.message}</Text>
      <Text style={{ fontSize: 12 }}>{item.datetime}</Text>
    </View>
  );
};
