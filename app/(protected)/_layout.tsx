import FloatingButton from "@/components/floating/FloatingButton";
import { router, Stack, usePathname } from "expo-router";
import { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function ProtectedLayout() {
  const pathname = usePathname();

  // Danh sách màn hình cần ẩn FloatingButton
  const hideButtonScreens = useMemo(() => ["/ai-chat", "/ai-chat/history"], []);

  // Check xem có cần ẩn button không
  const shouldHideButton = useMemo(() => {
    const result = hideButtonScreens.some((screen) =>
      pathname.includes(screen)
    );
    return result;
  }, [pathname, hideButtonScreens]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="add-transaction"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 300,
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="create-budget"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 300,
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="change-password"
          options={{
            presentation: "modal",
            animation: "slide_from_right",
          }}
        />

        <Stack.Screen
          name="select-category"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 300,
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="select-currency"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 300,
            headerShown: false,
          }}
        />

        {/* ✅ THÊM AI-CHAT ROUTES */}
        <Stack.Screen name="ai-chat" options={{ headerShown: false }} />
      </Stack>

      {/* {console.log('🎨 Rendering FloatingButton:', !shouldHideButton)} */}

      {/* ✅ FloatingButton - Ẩn trong các màn hình cụ thể */}
      {!shouldHideButton && (
        <FloatingButton
          imageSource={require("@assets/images/ai-assistant.png")}
          size={50}
          snapToEdge={true}
          onPress={() => {
            console.log("AI Assistant button pressed!");
            router.push("/(protected)/ai-chat");
          }}
        />
      )}
    </GestureHandlerRootView>
  );
}
