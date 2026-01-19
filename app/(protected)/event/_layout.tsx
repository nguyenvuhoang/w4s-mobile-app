import { Stack } from "expo-router";

export default function EventLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="event-list"
        options={{
          title: "Sự kiện",
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "Tạo sự kiện",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Chi tiết sự kiện",
        }}
      />
    </Stack>
  );
}
