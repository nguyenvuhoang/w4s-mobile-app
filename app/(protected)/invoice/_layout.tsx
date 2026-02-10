import { Stack } from "expo-router";

export default function invoiceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="invoice-list"
        options={{
          title: "Hóa đơn",
        }}
      />
      <Stack.Screen
        name="create-invoice"
        options={{
          title: "Tạo hóa đơn",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="edit-invoice"
        options={{
          title: "Chỉnh sửa giao dịch định kỳ",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="recurring-list"
        options={{
          title: "Giao dịch định kỳ",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Chi tiết hóa đơn",
        }}
      />
    </Stack>
  );
}
