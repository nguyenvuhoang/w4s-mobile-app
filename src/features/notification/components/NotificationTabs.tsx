import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { NotificationCategory } from "../types/notification.type";

const TABS: NotificationCategory[] = ["SYSTEM", "PROMOTION", "BALANCE"];

export const NotificationTabs = ({
  value,
  onChange,
}: {
  value: NotificationCategory;
  onChange: (v: NotificationCategory) => void;
}) => {
  return (
    <View style={{ flexDirection: "row" }}>
      {TABS.map((tab) => (
        <TouchableOpacity key={tab} onPress={() => onChange(tab)}>
          <Text style={{ fontWeight: value === tab ? "700" : "400" }}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
