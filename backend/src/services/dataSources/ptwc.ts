// Pacific Tsunami Warning Centre (PTWC) API
// Real API: https://ptwc.weather.gov/ptwc/text.php?id=pacific.TSUPAC
// GeoJSON feed: https://www.tsunami.gov/events/PAAQ/2024/index.xml
// CAP (Common Alerting Protocol): https://www.tsunami.gov/cap/
// Docs: https://ptwc.weather.gov/

import { TsunamiWarning, Coordinates } from '../../types';
import { haversineDistanceKm } from './nasaFirms';

export async function fetchPTWCWarnings(location: Coordinates): Promise<TsunamiWarning[]> {
  // In production:
  // const url = 'https://www.tsunami.gov/events/PAAQ/index.json';
  // const response = await axios.get(url);
  // return parsePTWCResponse(response.data, location);

  // Mock data — no active tsunami warnings (normal state)
  // To simulate a warning, this would return:
  const mockWarnings: TsunamiWarning[] = [];

  // Example of what an active warning would look like:
  // {
  //   id: 'PAAQ2024001',
  //   issueTime: new Date().toISOString(),
  //   originTime: new Date(Date.now() - 1800000).toISOString(),
  //   magnitude: 8.1,
  //   depth: 25,
  //   epicenterLat: location.lat - 2.5,
  //   epicenterLng: location.lng + 3.0,
  //   maximumWaveHeight: 2.4,
  //   eta: 45,
  //   warningLevel: 'WARNING',
  //   affectedCoasts: ['New South Wales Coast', 'Queensland Coast'],
  // }

  return mockWarnings;
}

export function calculateTsunamiRiskScore(
  warning: TsunamiWarning,
  userLocation: Coordinates
): number {
  const distanceKm = haversineDistanceKm(
    userLocation.lat, userLocation.lng,
    warning.epicenterLat, warning.epicenterLng
  );

  // Wave height factor (0-40 pts)
  let waveScore = 0;
  if (warning.maximumWaveHeight >= 5) waveScore = 40;
  else if (warning.maximumWaveHeight >= 3) waveScore = 30;
  else if (warning.maximumWaveHeight >= 1) waveScore = 20;
  else waveScore = 10;

  // Distance factor (0-30 pts) — closer = more dangerous
  let distScore = 0;
  if (distanceKm <= 50) distScore = 30;
  else if (distanceKm <= 100) distScore = 25;
  else if (distanceKm <= 200) distScore = 15;
  else if (distanceKm <= 500) distScore = 5;
  else distScore = 0;

  // Time factor (0-30 pts) — less time = more urgent
  let timeScore = 0;
  if (warning.eta <= 15) timeScore = 30;
  else if (warning.eta <= 30) timeScore = 25;
  else if (warning.eta <= 60) timeScore = 15;
  else if (warning.eta <= 120) timeScore = 8;
  else timeScore = 2;

  return Math.min(100, waveScore + distScore + timeScore);
}
