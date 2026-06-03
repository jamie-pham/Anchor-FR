import React, { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    // Dynamically import notifications only on native (not supported on web)
    import('expo-notifications').then((Notifications) => {
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification.request.content.data;
        if (data?.alertId) {
          router.push('/(tabs)/alerts');
        }
      });
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
