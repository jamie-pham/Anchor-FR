import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationChannels {
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
}

/**
 * Set up Android notification channels
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('anchor-high-risk', {
    name: 'High Risk Alerts',
    description: 'Immediate life-safety emergency alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#D32F2F',
    sound: 'default',
    bypassDnd: true,
  });

  await Notifications.setNotificationChannelAsync('anchor-medium-risk', {
    name: 'Medium Risk Alerts',
    description: 'Elevated risk alerts requiring attention',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#F57C00',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('anchor-low-risk', {
    name: 'Low Risk Alerts',
    description: 'Informational alerts about nearby hazards',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#388E3C',
  });
}

/**
 * Request notification permissions and return the Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Set up channels first (Android)
  await setupNotificationChannels();

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return tokenData.data;
  } catch (error) {
    console.error('[Notifications] Failed to get push token:', error);
    return null;
  }
}

/**
 * Schedule a local notification (for testing / offline scenarios)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  delaySeconds = 1
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: { seconds: delaySeconds },
  });
  return id;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all delivered (received) notifications
 */
export async function getDeliveredNotifications(): Promise<Notifications.Notification[]> {
  return Notifications.getPresentedNotificationsAsync();
}

/**
 * Clear all delivered notifications from the tray
 */
export async function clearAllDeliveredNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

export type NotificationListener = (notification: Notifications.Notification) => void;
export type ResponseListener = (response: Notifications.NotificationResponse) => void;

/**
 * Add a listener for incoming notifications while app is foregrounded
 */
export function addNotificationReceivedListener(listener: NotificationListener): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add a listener for when the user taps a notification
 */
export function addNotificationResponseListener(listener: ResponseListener): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}
