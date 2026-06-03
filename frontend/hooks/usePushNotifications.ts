import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
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
  lastNotification: any | null;
  error: string | null;
}

export function usePushNotifications(location: Coordinates | null) {
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    permissionGranted: false,
    lastNotification: null,
    error: null,
  });

  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let cancelled = false;

    async function setup() {
      try {
        const token = await registerForPushNotifications();
        if (cancelled) return;
        if (token) {
          setState(prev => ({ ...prev, token, permissionGranted: true }));
          if (location) {
            await registerDevice(token, location.lat, location.lng).catch((err) => {
              console.warn('[Push] Failed to register device:', err.message);
            });
          }
        } else {
          setState(prev => ({ ...prev, permissionGranted: false }));
        }
      } catch (error) {
        if (cancelled) return;
        setState(prev => ({ ...prev, error: (error as Error).message }));
      }
    }

    setup();

    notificationListener.current = addNotificationReceivedListener((notification) => {
      setState(prev => ({ ...prev, lastNotification: notification }));
    });

    responseListener.current = addNotificationResponseListener((response) => {
      setState(prev => ({ ...prev, lastNotification: response.notification }));
    });

    return () => {
      cancelled = true;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [location]);

  return state;
}
