import React, { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Handle notification taps that open the app
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.alertId) {
        // Navigate to alerts tab when tapping a notification
        router.push('/(tabs)/alerts');
      }
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700', color: colors.text },
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
