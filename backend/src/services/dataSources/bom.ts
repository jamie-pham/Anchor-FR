// Australian Bureau of Meteorology (BOM) API
// Real API: http://www.bom.gov.au/fwo/{state_code}/{station_id}.json
// Fire Weather: http://www.bom.gov.au/australia/meteye/ (scrape or IDX products)
// Flood Gauges: http://www.bom.gov.au/waterdata/ (WISKI REST API)
// Real-time weather: http://reg.bom.gov.au/fwo/IDV60901/IDV60901.95936.json
// Docs: http://www.bom.gov.au/catalogue/anon-ftp.shtml

import { WeatherData, Coordinates } from '../../types';

export interface BOMStationObservation {
  sort_order: number;
  wmo: number;
  name: string;
  history_product: string;
  local_date_time: string;
  local_date_time_full: string;
  aifstime_utc: string;
  lat: number;
  lon: number;
  apparent_t: number;
  cloud: string;
  cloud_base_m: number | null;
  cloud_oktas: number | null;
  cloud_type: string | null;
  cloud_type_id: string | null;
  delta_t: number;
  gust_kmh: number;
  gust_kt: number;
  air_temp: number;
  dewpt: number;
  press: number;
  press_msl: number;
  press_qnh: number;
  press_tend: string;
  rain_trace: string;
  rel_hum: number;
  sea_state: string | null;
  swell_dir_worded: string | null;
  swell_height: number | null;
  swell_period: number | null;
  vis_km: string;
  weather: string | null;
  wind_dir: string;
  wind_spd_kmh: number;
  wind_spd_kt: number;
}

export interface BOMFloodGauge {
  station_id: string;
  station_name: string;
  river: string;
  lat: number;
  lon: number;
  current_level_m: number;
  minor_flood_level_m: number;
  moderate_flood_level_m: number;
  major_flood_level_m: number;
  trend: 'rising' | 'steady' | 'falling';
  last_updated: string;
}

export async function fetchBOMWeather(location: Coordinates): Promise<WeatherData> {
  // In production, find nearest BOM station and fetch:
  // const nearestStation = await findNearestBOMStation(location);
  // const url = `http://reg.bom.gov.au/fwo/${nearestStation.stateCode}/${nearestStation.productId}.json`;
  // const response = await axios.get(url, { headers: { 'User-Agent': 'AnchorEmergencyApp/1.0' } });
  // const obs = response.data.observations.data[0];
  // return transformBOMObservation(obs);

  // Mock BOM observation for New South Wales coastal location
  const mockObservation: BOMStationObservation = {
    sort_order: 0,
    wmo: 95936,
    name: 'Sydney (Observatory Hill)',
    history_product: 'IDV60901',
    local_date_time: new Date().toLocaleString('en-AU'),
    local_date_time_full: new Date().toISOString(),
    aifstime_utc: new Date().toISOString(),
    lat: location.lat,
    lon: location.lng,
    apparent_t: 41.2,
    cloud: 'Clear',
    cloud_base_m: null,
    cloud_oktas: null,
    cloud_type: null,
    cloud_type_id: null,
    delta_t: 14.2,
    gust_kmh: 68,
    gust_kt: 37,
    air_temp: 38.5,
    dewpt: 8.2,
    press: 1002.4,
    press_msl: 1002.4,
    press_qnh: 1002.4,
    press_tend: 'F',
    rain_trace: '0.0',
    rel_hum: 18,
    sea_state: null,
    swell_dir_worded: null,
    swell_height: null,
    swell_period: null,
    vis_km: '10',
    weather: null,
    wind_dir: 'NW',
    wind_spd_kmh: 47,
    wind_spd_kt: 25,
  };

  return {
    temperature: mockObservation.air_temp,
    feelsLike: mockObservation.apparent_t,
    humidity: mockObservation.rel_hum,
    windSpeed: mockObservation.wind_spd_kmh,
    windDirection: windDirToDegrees(mockObservation.wind_dir),
    windGust: mockObservation.gust_kmh,
    precipitation24h: parseFloat(mockObservation.rain_trace) || 0,
    uvIndex: 11,
    stormCategory: null,
    stormDistance: null,
    floodGaugeLevel: null,
    floodThreshold: null,
    inFloodPlain: false,
    heatIndexForecast: 6,
    weatherCode: 'CLEAR',
    description: `${mockObservation.cloud}, ${mockObservation.wind_dir} winds ${mockObservation.wind_spd_kmh} km/h`,
  };
}

export async function fetchBOMFloodGauges(location: Coordinates, radiusKm: number = 50): Promise<BOMFloodGauge[]> {
  // In production:
  // const url = `https://wiski.bom.gov.au/hydrotelemetry.svc/GetRiverStations?format=json&bbox=${location.lng-0.5},${location.lat-0.5},${location.lng+0.5},${location.lat+0.5}`;
  // const response = await axios.get(url);
  // return response.data.stations;

  // Mock flood gauge data — no active flooding
  return [
    {
      station_id: '210040',
      station_name: 'Hawkesbury River at Windsor',
      river: 'Hawkesbury River',
      lat: location.lat + 0.1,
      lon: location.lng + 0.05,
      current_level_m: 3.2,
      minor_flood_level_m: 8.0,
      moderate_flood_level_m: 10.0,
      major_flood_level_m: 12.0,
      trend: 'steady',
      last_updated: new Date().toISOString(),
    },
  ];
}

function windDirToDegrees(dir: string): number {
  const directions: Record<string, number> = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
    E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
    S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
    W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
  };
  return directions[dir.toUpperCase()] ?? 0;
}
