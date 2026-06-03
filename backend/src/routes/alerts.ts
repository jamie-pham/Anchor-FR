import { Router, Request, Response } from 'express';
import { CheckAlertsRequest, CheckAlertsResponse, Alert } from '../types';
import { fetchNASAFirmsData } from '../services/dataSources/nasaFirms';
import { fetchUSGSEarthquakes } from '../services/dataSources/usgsEarthquake';
import { fetchECMWFWeather } from '../services/dataSources/ecmwfWeather';
import { fetchBOMFloodGauges } from '../services/dataSources/bom';
import { fetchPTWCWarnings } from '../services/dataSources/ptwc';
import {
  calculateWildfireRisk,
  calculateEarthquakeRisk,
  calculateFloodRisk,
  calculateStormRisk,
  calculateHeatRisk,
  calculateTsunamiRisk,
  getOverallRisk,
} from '../services/riskCalculator';
import { generateAlertsForActiveRisks, AlertGenerationInput } from '../services/aiAlerts';
import { sendPushNotification } from '../services/pushNotifications';

const router = Router();

// In-memory alert store (use a database in production)
const alertStore: Alert[] = [];

// GET /alerts — retrieve recent alerts for a location
router.get('/', async (req: Request, res: Response) => {
  const { lat, lng, limit } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query parameters are required' });
  }

  const parsedLat = parseFloat(lat as string);
  const parsedLng = parseFloat(lng as string);
  const parsedLimit = Math.min(parseInt((limit as string) || '20', 10), 100);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return res.status(400).json({ error: 'lat and lng must be valid numbers' });
  }

  // Filter alerts near the user's location (within 200 km) and not expired
  const now = new Date();
  const nearbyAlerts = alertStore
    .filter(alert => {
      const expired = new Date(alert.expiresAt) < now;
      return !expired;
    })
    .slice(0, parsedLimit);

  return res.json({ alerts: nearbyAlerts, total: nearbyAlerts.length });
});

// POST /alerts/check — check for risks at a location and generate alerts
router.post('/check', async (req: Request, res: Response) => {
  const { lat, lng, deviceToken } = req.body as CheckAlertsRequest;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat and lng must be numbers' });
  }

  const userLocation = { lat, lng };

  try {
    // Fetch all data sources in parallel
    const [fires, earthquakes, weather, floodGauges, tsunamiWarnings] = await Promise.all([
      fetchNASAFirmsData(userLocation),
      fetchUSGSEarthquakes(userLocation),
      fetchECMWFWeather(userLocation),
      fetchBOMFloodGauges(userLocation),
      fetchPTWCWarnings(userLocation),
    ]);

    // Incorporate flood gauge data into weather
    if (floodGauges.length > 0) {
      const gauge = floodGauges[0];
      weather.floodGaugeLevel = gauge.current_level_m;
      weather.floodThreshold = gauge.minor_flood_level_m;
    }

    // Calculate risk scores
    const wildfireRisk = calculateWildfireRisk({ fires, weather, userLocation });
    const earthquakeRisk = calculateEarthquakeRisk({ earthquakes, userLocation });
    const floodRisk = calculateFloodRisk({ weather, userLocation });
    const stormRisk = calculateStormRisk({ weather, userLocation });
    const heatRisk = calculateHeatRisk({ weather, userLocation });
    const tsunamiRisk = calculateTsunamiRisk({ warnings: tsunamiWarnings, userLocation });

    const allRisks = [wildfireRisk, earthquakeRisk, floodRisk, stormRisk, heatRisk, tsunamiRisk];
    const overall = getOverallRisk(allRisks);

    // Build alert generation inputs for risks worth alerting on
    const alertInputs: AlertGenerationInput[] = allRisks
      .filter(r => r.score >= 20)
      .map(r => {
        const base: AlertGenerationInput = {
          emergencyType: r.emergencyType,
          riskLevel: r.level,
          riskScore: r.score,
          userLocation,
          weather,
        };

        if (r.emergencyType === 'wildfire') base.fires = fires;
        if (r.emergencyType === 'earthquake') base.earthquakes = earthquakes;
        if (r.emergencyType === 'tsunami') base.tsunamiWarnings = tsunamiWarnings;

        return base;
      });

    let newAlerts: Alert[] = [];

    if (alertInputs.length > 0 && process.env.ANTHROPIC_API_KEY) {
      newAlerts = await generateAlertsForActiveRisks(alertInputs);

      // Store alerts and send push notifications
      for (const alert of newAlerts) {
        alertStore.unshift(alert);
        if (deviceToken) {
          await sendPushNotification(alert, deviceToken).catch(() => {
            // Non-fatal — log and continue
            console.error(`Failed to send push notification for alert ${alert.id}`);
          });
        }
      }

      // Keep store bounded
      if (alertStore.length > 1000) alertStore.splice(1000);
    }

    const response: CheckAlertsResponse = {
      alerts: newAlerts,
      overallRisk: overall.level,
      overallScore: overall.score,
      checkedAt: new Date().toISOString(),
    };

    return res.json(response);
  } catch (error) {
    const err = error as Error;
    console.error('Error checking alerts:', err);
    return res.status(500).json({ error: 'Failed to check alerts', message: err.message });
  }
});

export default router;
