import axios from 'axios';
import { Alert, RiskLevel } from '../types';

// Expo Push Notification API
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/
const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'default' | 'normal' | 'high';
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

export interface PushReceipt {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

export interface PushResult {
  token: string;
  receipt: PushReceipt;
}

function riskLevelToChannelId(level: RiskLevel): string {
  switch (level) {
    case 'HIGH': return 'anchor-high-risk';
    case 'MEDIUM': return 'anchor-medium-risk';
    case 'LOW': return 'anchor-low-risk';
  }
}

function riskLevelToEmoji(level: RiskLevel): string {
  switch (level) {
    case 'HIGH': return '🚨';
    case 'MEDIUM': return '⚠️';
    case 'LOW': return 'ℹ️';
  }
}

export function buildPushMessage(alert: Alert, deviceToken: string): PushMessage {
  const emoji = riskLevelToEmoji(alert.riskLevel);
  const channelId = riskLevelToChannelId(alert.riskLevel);

  return {
    to: deviceToken,
    title: `${emoji} ${alert.riskLevel} ${alert.emergencyType.toUpperCase()} ALERT`,
    body: alert.headline,
    data: {
      alertId: alert.id,
      emergencyType: alert.emergencyType,
      riskLevel: alert.riskLevel,
      riskScore: alert.riskScore,
    },
    priority: alert.riskLevel === 'HIGH' ? 'high' : 'normal',
    sound: 'default',
    channelId,
  };
}

export async function sendPushNotification(
  alert: Alert,
  deviceToken: string
): Promise<PushResult> {
  const message = buildPushMessage(alert, deviceToken);

  try {
    const response = await axios.post<{ data: PushReceipt[] }>(
      EXPO_PUSH_API,
      [message],
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      }
    );

    const receipt = response.data.data[0];
    return { token: deviceToken, receipt };
  } catch (error) {
    const err = error as Error;
    return {
      token: deviceToken,
      receipt: { status: 'error', message: err.message },
    };
  }
}

export async function sendBulkPushNotifications(
  alert: Alert,
  deviceTokens: string[]
): Promise<PushResult[]> {
  const messages = deviceTokens.map(token => buildPushMessage(alert, token));

  // Expo allows up to 100 messages per request
  const chunks: PushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  const results: PushResult[] = [];

  for (const chunk of chunks) {
    try {
      const response = await axios.post<{ data: PushReceipt[] }>(
        EXPO_PUSH_API,
        chunk,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
        }
      );

      const receipts = response.data.data;
      chunk.forEach((msg, i) => {
        results.push({ token: msg.to, receipt: receipts[i] });
      });
    } catch (error) {
      const err = error as Error;
      chunk.forEach(msg => {
        results.push({
          token: msg.to,
          receipt: { status: 'error', message: err.message },
        });
      });
    }
  }

  return results;
}
