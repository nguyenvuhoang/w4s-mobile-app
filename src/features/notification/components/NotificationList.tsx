import React from "react";
import { ActivityIndicator, FlatList } from "react-native";
import { NotificationItemModel } from "../types/notification.type";
import { NotificationItem } from "./NotificationItem";

export const NotificationList = ({
  data,
  loadingMore,
  onLoadMore,
}: {
  data: NotificationItemModel[];
  loadingMore: boolean;
  onLoadMore: () => void;
}) => {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NotificationItem item={item} />}
      onEndReached={onLoadMore}
      ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
    />
  );
};
