// NASA FIRMS VIIRS Active Fire Data
// Real API: https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/{lat},{lng},{radius}/{days}
// Docs: https://firms.modaps.eosdis.nasa.gov/api/

import { FIRMSFireData, Coordinates } from '../../types';

export async function fetchNASAFirmsData(location: Coordinates, radiusKm: number = 100): Promise<FIRMSFireData[]> {
  // In production, use the NASA FIRMS API:
  // const apiKey = process.env.NASA_FIRMS_API_KEY;
  // const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/${location.lng-1},${location.lat-1},${location.lng+1},${location.lat+1}/1`;
  // const response = await axios.get(url);
  // return parseCSV(response.data);

  // Mock data structurally accurate to FIRMS VIIRS NRT response
  const mockFires: FIRMSFireData[] = [
    {
      latitude: location.lat + 0.08,
      longitude: location.lng + 0.07,
      brightness: 342.5,
      scan: 0.39,
      track: 0.36,
      acq_date: new Date().toISOString().split('T')[0],
      acq_time: '0120',
      satellite: 'N',
      confidence: 85,
      version: '2.0NRT',
      bright_t31: 294.3,
      frp: 18.7,
      daynight: 'D',
    },
    {
      latitude: location.lat + 0.12,
      longitude: location.lng + 0.10,
      brightness: 378.2,
      scan: 0.41,
      track: 0.38,
      acq_date: new Date().toISOString().split('T')[0],
      acq_time: '0122',
      satellite: 'N',
      confidence: 92,
      version: '2.0NRT',
      bright_t31: 298.1,
      frp: 34.2,
      daynight: 'D',
    },
  ];

  // Filter fires within radius
  return mockFires.filter(fire => {
    const dist = haversineDistanceKm(
      location.lat, location.lng,
      fire.latitude, fire.longitude
    );
    return dist <= radiusKm;
  });
}

export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function bearingDegrees(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const dLng = toRad(toLng - fromLng);
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  return bearing;
}
