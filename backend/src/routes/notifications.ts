import { Router, Request, Response } from 'express';
import { Alert } from '../types';
import { sendPushNotification, sendBulkPushNotifications } from '../services/pushNotifications';

const router = Router();

// In-memory device token registry (use a database in production)
const deviceRegistry = new Map<string, { token: string; lat: number; lng: number; registeredAt: string }>();

// POST /notifications/register — register a device token
router.post('/register', (req: Request, res: Response) => {
  const { deviceToken, lat, lng } = req.body as { deviceToken: string; lat: number; lng: number };

  if (!deviceToken) {
    return res.status(400).json({ error: 'deviceToken is required' });
  }

  deviceRegistry.set(deviceToken, {
    token: deviceToken,
    lat: lat ?? 0,
    lng: lng ?? 0,
    registeredAt: new Date().toISOString(),
  });

  return res.json({ success: true, message: 'Device token registered' });
});

// DELETE /notifications/register/:token — unregister a device token
router.delete('/register/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const existed = deviceRegistry.delete(token);
  return res.json({ success: true, removed: existed });
});

// POST /notifications/send — send a notification to a specific device (internal use)
router.post('/send', async (req: Request, res: Response) => {
  const { alert, deviceToken } = req.body as { alert: Alert; deviceToken: string };

  if (!alert || !deviceToken) {
    return res.status(400).json({ error: 'alert and deviceToken are required' });
  }

  try {
    const result = await sendPushNotification(alert, deviceToken);
    return res.json(result);
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: 'Failed to send notification', message: err.message });
  }
});

// POST /notifications/broadcast — send to all registered devices in a region
router.post('/broadcast', async (req: Request, res: Response) => {
  const { alert, lat, lng, radiusKm } = req.body as {
    alert: Alert;
    lat: number;
    lng: number;
    radiusKm: number;
  };

  if (!alert) {
    return res.status(400).json({ error: 'alert is required' });
  }

  const radius = radiusKm || 100;
  const tokens: string[] = [];

  // Filter devices within radius (simplified — use spatial DB in production)
  for (const device of deviceRegistry.values()) {
    const dLat = device.lat - lat;
    const dLng = device.lng - lng;
    const distApprox = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // rough km
    if (distApprox <= radius) {
      tokens.push(device.token);
    }
  }

  if (tokens.length === 0) {
    return res.json({ success: true, sent: 0, message: 'No devices in range' });
  }

  try {
    const results = await sendBulkPushNotifications(alert, tokens);
    const succeeded = results.filter(r => r.receipt.status === 'ok').length;
    return res.json({ success: true, sent: succeeded, total: results.length });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: 'Broadcast failed', message: err.message });
  }
});

export default router;
