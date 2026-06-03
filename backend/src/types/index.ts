export type EmergencyType = 'wildfire' | 'flood' | 'earthquake' | 'storm' | 'heat' | 'tsunami';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RiskScore {
  score: number;
  level: RiskLevel;
  emergencyType: EmergencyType;
}

export interface AlertAction {
  step: number;
  text: string;
}

export interface Alert {
  id: string;
  emergencyType: EmergencyType;
  riskLevel: RiskLevel;
  riskScore: number;
  headline: string;
  explanation: string;
  actions: string[];
  location: Coordinates;
  createdAt: string;
  expiresAt: string;
}

export interface CheckAlertsRequest {
  lat: number;
  lng: number;
  deviceToken?: string;
}

export interface CheckAlertsResponse {
  alerts: Alert[];
  overallRisk: RiskLevel;
  overallScore: number;
  checkedAt: string;
}

// NASA FIRMS types
export interface FIRMSFireData {
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  confidence: number;
  version: string;
  bright_t31: number;
  frp: number;
  daynight: string;
}

// USGS Earthquake types
export interface USGSEarthquakeFeature {
  type: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz: number | null;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number]; // [lng, lat, depth]
  };
  id: string;
}

export interface USGSEarthquakeResponse {
  type: string;
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSEarthquakeFeature[];
}

// Weather types (ECMWF / BOM)
export interface WeatherData {
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // percentage
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGust: number; // km/h
  precipitation24h: number; // mm
  uvIndex: number;
  stormCategory: number | null;
  stormDistance: number | null; // km
  floodGaugeLevel: number | null; // metres
  floodThreshold: number | null; // metres
  inFloodPlain: boolean;
  heatIndexForecast: number; // hours above 40°C forecast
  weatherCode: string;
  description: string;
}

// PTWC types
export interface TsunamiWarning {
  id: string;
  issueTime: string;
  originTime: string;
  magnitude: number;
  depth: number; // km
  epicenterLat: number;
  epicenterLng: number;
  maximumWaveHeight: number; // metres
  eta: number; // minutes to arrival
  warningLevel: 'WARNING' | 'WATCH' | 'ADVISORY' | 'INFORMATION';
  affectedCoasts: string[];
}

// Risk input data
export interface WildfireRiskInput {
  fires: FIRMSFireData[];
  weather: WeatherData;
  userLocation: Coordinates;
}

export interface EarthquakeRiskInput {
  earthquakes: USGSEarthquakeFeature[];
  userLocation: Coordinates;
}

export interface FloodRiskInput {
  weather: WeatherData;
  userLocation: Coordinates;
}

export interface StormRiskInput {
  weather: WeatherData;
  userLocation: Coordinates;
}

export interface HeatRiskInput {
  weather: WeatherData;
  userLocation: Coordinates;
}

export interface TsunamiRiskInput {
  warnings: TsunamiWarning[];
  userLocation: Coordinates;
}
