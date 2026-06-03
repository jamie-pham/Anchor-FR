import { Platform } from 'react-native';

// expo-notifications is not supported on web — guard every import
const isNative = Platform.OS !== 'web';

async function getNotifications() {
  if (!isNative) return null;
  return import('expo-notifications');
}

// Set up foreground handler on native only
if (isNative) {
  getNotifications().then((Notifications) => {
    if (!Notifications) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  });
}

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const Notifications = await getNotifications();
  if (!Notifications) return;

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

export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;

  await setupNotificationChannels();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return tokenData.data;
  } catch {
    return null;
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  delaySeconds = 1
): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: 'default' },
    trigger: { seconds: delaySeconds } as any,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getDeliveredNotifications(): Promise<any[]> {
  const Notifications = await getNotifications();
  if (!Notifications) return [];
  return Notifications.getPresentedNotificationsAsync();
}

export async function clearAllDeliveredNotifications(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.dismissAllNotificationsAsync();
}

export function addNotificationReceivedListener(listener: (n: any) => void): any {
  if (!isNative) return { remove: () => {} };
  let sub: any = null;
  getNotifications().then((N) => {
    if (N) sub = N.addNotificationReceivedListener(listener);
  });
  return { remove: () => sub?.remove() };
}

export function addNotificationResponseListener(listener: (r: any) => void): any {
  if (!isNative) return { remove: () => {} };
  let sub: any = null;
  getNotifications().then((N) => {
    if (N) sub = N.addNotificationResponseReceivedListener(listener);
  });
  return { remove: () => sub?.remove() };
}
