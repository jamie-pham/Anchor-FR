import { Router, Request, Response } from 'express';
import {
  WildfireRiskInput,
  EarthquakeRiskInput,
  FloodRiskInput,
  StormRiskInput,
  HeatRiskInput,
  TsunamiRiskInput,
} from '../types';
import {
  calculateWildfireRisk,
  calculateEarthquakeRisk,
  calculateFloodRisk,
  calculateStormRisk,
  calculateHeatRisk,
  calculateTsunamiRisk,
  getOverallRisk,
} from '../services/riskCalculator';
import { fetchNASAFirmsData } from '../services/dataSources/nasaFirms';
import { fetchUSGSEarthquakes } from '../services/dataSources/usgsEarthquake';
import { fetchECMWFWeather } from '../services/dataSources/ecmwfWeather';
import { fetchPTWCWarnings } from '../services/dataSources/ptwc';

const router = Router();

// POST /risk/calculate — calculate all risk scores for a location
router.post('/calculate', async (req: Request, res: Response) => {
  const { lat, lng } = req.body as { lat: number; lng: number };

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const userLocation = { lat, lng };

  try {
    const [fires, earthquakes, weather, tsunamiWarnings] = await Promise.all([
      fetchNASAFirmsData(userLocation),
      fetchUSGSEarthquakes(userLocation),
      fetchECMWFWeather(userLocation),
      fetchPTWCWarnings(userLocation),
    ]);

    const wildfireInput: WildfireRiskInput = { fires, weather, userLocation };
    const earthquakeInput: EarthquakeRiskInput = { earthquakes, userLocation };
    const floodInput: FloodRiskInput = { weather, userLocation };
    const stormInput: StormRiskInput = { weather, userLocation };
    const heatInput: HeatRiskInput = { weather, userLocation };
    const tsunamiInput: TsunamiRiskInput = { warnings: tsunamiWarnings, userLocation };

    const scores = {
      wildfire: calculateWildfireRisk(wildfireInput),
      earthquake: calculateEarthquakeRisk(earthquakeInput),
      flood: calculateFloodRisk(floodInput),
      storm: calculateStormRisk(stormInput),
      heat: calculateHeatRisk(heatInput),
      tsunami: calculateTsunamiRisk(tsunamiInput),
    };

    const overall = getOverallRisk(Object.values(scores));

    return res.json({
      scores,
      overall,
      calculatedAt: new Date().toISOString(),
      location: userLocation,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: 'Failed to calculate risk', message: err.message });
  }
});

// GET /risk/calculate — calculate risk scores via query params
router.get('/calculate', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query parameters are required' });
  }

  const parsedLat = parseFloat(lat as string);
  const parsedLng = parseFloat(lng as string);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return res.status(400).json({ error: 'lat and lng must be valid numbers' });
  }

  req.body = { lat: parsedLat, lng: parsedLng };
  return router.handle(req, res, () => {});
});

export default router;
