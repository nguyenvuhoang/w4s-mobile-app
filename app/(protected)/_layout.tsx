import { Redirect, Stack } from 'expo-router';

export default function ProtectedLayout() {
  const isAuthenticated = false; // Replace with actual token check

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-transaction"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}
