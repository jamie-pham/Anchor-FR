import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '../services/notifications';
import { registerDevice } from '../services/api';
import { Coordinates } from '../types';

export interface PushNotificationState {
  token: string | null;
  permissionGranted: boolean;
  lastNotification: Notifications.Notification | null;
  error: string | null;
}

export function usePushNotifications(location: Coordinates | null) {
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    permissionGranted: false,
    lastNotification: null,
    error: null,
  });

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const token = await registerForPushNotifications();
        if (cancelled) return;

        if (token) {
          setState(prev => ({ ...prev, token, permissionGranted: true }));

          // Register token with backend
          if (location) {
            await registerDevice(token, location.lat, location.lng).catch((err) => {
              console.warn('[Push] Failed to register device with backend:', err.message);
            });
          }
        } else {
          setState(prev => ({ ...prev, permissionGranted: false }));
        }
      } catch (error) {
        if (cancelled) return;
        const err = error as Error;
        setState(prev => ({ ...prev, error: err.message }));
      }
    }

    setup();

    // Listen for foreground notifications
    notificationListener.current = addNotificationReceivedListener((notification) => {
      setState(prev => ({ ...prev, lastNotification: notification }));
    });

    // Listen for user tapping a notification
    responseListener.current = addNotificationResponseListener((response) => {
      const notification = response.notification;
      setState(prev => ({ ...prev, lastNotification: notification }));
      // Navigation handled in _layout.tsx
    });

    return () => {
      cancelled = true;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [location]);

  return state;
}
