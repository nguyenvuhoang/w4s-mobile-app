import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen
        name="start"
        options={{
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="intro"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="forgotPassword"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="quick-login"
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
