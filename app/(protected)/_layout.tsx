import { Stack } from 'expo-router';

export default function ProtectedLayout() {
  return (
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
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 300,
          headerShown: false,
        }}
      />

      <Stack.Screen 
        name="create-budget"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 300,
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="select-wallet-type"
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          animationDuration: 300,
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="create-wallet-details"
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          animationDuration: 300,
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="select-wallet-color"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 300,
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="select-wallet-icon"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 300,
          headerShown: false,
        }}
      />
    </Stack>
  );
}