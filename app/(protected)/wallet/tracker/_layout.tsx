import { Stack } from 'expo-router';

export default function TrackerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* chọn loại tracker */}
      <Stack.Screen
        name="select-subtype"
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />

      {/* tạo ví nợ */}
      <Stack.Screen
        name="create-debt"
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />

      {/* tạo ví tiết kiệm */}
      <Stack.Screen
        name="create-saving"
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />

      {/* tạo ví cơ bản */}
      <Stack.Screen
        name="create-basic"
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </Stack>
  );
}
