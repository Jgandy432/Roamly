import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TripProvider } from "@/context/TripContext";
import { Colors } from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" options={{ gestureEnabled: false }} />
      <Stack.Screen name="explore" />
      <Stack.Screen name="my-trips" />
      <Stack.Screen name="create-trip" />
      <Stack.Screen name="trip" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TripProvider>
          <RootLayoutNav />
        </TripProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
