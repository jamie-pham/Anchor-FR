import {
  RiskLevel,
  RiskScore,
  WildfireRiskInput,
  EarthquakeRiskInput,
  FloodRiskInput,
  StormRiskInput,
  HeatRiskInput,
  TsunamiRiskInput,
  EmergencyType,
} from '../types';
import { haversineDistanceKm, bearingDegrees } from './dataSources/nasaFirms';
import { calculateTsunamiRiskScore } from './dataSources/ptwc';

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Wildfire risk score (0–100)
 * - Distance component (0–40 pts)
 * - Wind factor (0–30 pts, boosted if wind blowing toward user)
 * - Heat/humidity factor (0–30 pts)
 */
export function calculateWildfireRisk(input: WildfireRiskInput): RiskScore {
  const { fires, weather, userLocation } = input;

  if (fires.length === 0) {
    return { score: 0, level: 'LOW', emergencyType: 'wildfire' };
  }

  let maxScore = 0;

  for (const fire of fires) {
    const distKm = haversineDistanceKm(
      userLocation.lat, userLocation.lng,
      fire.latitude, fire.longitude
    );

    // Distance component (0–40 pts)
    let distScore: number;
    if (distKm <= 5) distScore = 40;
    else if (distKm <= 10) distScore = 35;
    else if (distKm <= 20) distScore = 28;
    else if (distKm <= 40) distScore = 18;
    else if (distKm <= 70) distScore = 10;
    else if (distKm <= 100) distScore = 4;
    else distScore = 0;

    // Wind factor (0–30 pts)
    // Check if wind is blowing toward the user from the fire direction
    const bearingToFire = bearingDegrees(userLocation.lat, userLocation.lng, fire.latitude, fire.longitude);
    const windComingFrom = (weather.windDirection + 180) % 360; // wind direction = where it's coming FROM
    const angleDiff = Math.abs(((windComingFrom - bearingToFire + 540) % 360) - 180);
    const windTowardUser = angleDiff < 45; // wind broadly pointing fire toward user

    let windScore: number;
    if (weather.windSpeed >= 60) windScore = 25;
    else if (weather.windSpeed >= 40) windScore = 18;
    else if (weather.windSpeed >= 25) windScore = 12;
    else if (weather.windSpeed >= 15) windScore = 7;
    else windScore = 3;

    if (windTowardUser) windScore = Math.min(30, windScore + 8);

    // Heat/humidity factor (0–30 pts)
    let heatScore = 0;
    if (weather.temperature >= 40) heatScore += 15;
    else if (weather.temperature >= 35) heatScore += 10;
    else if (weather.temperature >= 30) heatScore += 5;

    if (weather.humidity <= 10) heatScore += 15;
    else if (weather.humidity <= 20) heatScore += 10;
    else if (weather.humidity <= 30) heatScore += 5;

    heatScore = Math.min(30, heatScore);

    const total = Math.min(100, distScore + windScore + heatScore);
    if (total > maxScore) maxScore = total;
  }

  return { score: maxScore, level: scoreToLevel(maxScore), emergencyType: 'wildfire' };
}

/**
 * Earthquake risk score (0–100)
 * Score = (magnitude * 10) * (1 / max(distance, 1)) * depth_modifier, capped at 100
 */
export function calculateEarthquakeRisk(input: EarthquakeRiskInput): RiskScore {
  const { earthquakes, userLocation } = input;

  if (earthquakes.length === 0) {
    return { score: 0, level: 'LOW', emergencyType: 'earthquake' };
  }

  let maxScore = 0;

  for (const eq of earthquakes) {
    const [lng, lat, depth] = eq.geometry.coordinates;
    const distKm = haversineDistanceKm(userLocation.lat, userLocation.lng, lat, lng);

    // Depth modifier — shallow earthquakes are more destructive
    let depthModifier: number;
    if (depth <= 10) depthModifier = 1.5;
    else if (depth <= 30) depthModifier = 1.2;
    else if (depth <= 70) depthModifier = 1.0;
    else if (depth <= 150) depthModifier = 0.7;
    else depthModifier = 0.4;

    const rawScore = (eq.properties.mag * 10) * (1 / Math.max(distKm, 1)) * depthModifier * 100;
    const score = Math.min(100, Math.round(rawScore));
    if (score > maxScore) maxScore = score;
  }

  return { score: maxScore, level: scoreToLevel(maxScore), emergencyType: 'earthquake' };
}

/**
 * Flood risk score (0–100)
 * Factors: gauge level vs threshold, rainfall, flood plain status
 */
export function calculateFloodRisk(input: FloodRiskInput): RiskScore {
  const { weather } = input;

  let score = 0;

  // Gauge level factor (0–50 pts)
  if (weather.floodGaugeLevel !== null && weather.floodThreshold !== null) {
    const ratio = weather.floodGaugeLevel / weather.floodThreshold;
    if (ratio >= 1.5) score += 50;
    else if (ratio >= 1.2) score += 40;
    else if (ratio >= 1.0) score += 30;
    else if (ratio >= 0.8) score += 15;
    else if (ratio >= 0.6) score += 5;
  }

  // Rainfall factor (0–30 pts)
  if (weather.precipitation24h >= 100) score += 30;
  else if (weather.precipitation24h >= 60) score += 22;
  else if (weather.precipitation24h >= 30) score += 14;
  else if (weather.precipitation24h >= 15) score += 7;
  else if (weather.precipitation24h >= 5) score += 3;

  // Flood plain factor (0–20 pts)
  if (weather.inFloodPlain) score += 20;

  score = Math.min(100, score);
  return { score, level: scoreToLevel(score), emergencyType: 'flood' };
}

/**
 * Severe storm risk score (0–100)
 * Factors: wind speed, storm category, distance, storm track direction
 */
export function calculateStormRisk(input: StormRiskInput): RiskScore {
  const { weather } = input;

  let score = 0;

  // Wind speed factor (0–40 pts)
  if (weather.windGust >= 120) score += 40;
  else if (weather.windGust >= 90) score += 32;
  else if (weather.windGust >= 70) score += 24;
  else if (weather.windGust >= 50) score += 16;
  else if (weather.windGust >= 35) score += 8;

  // Storm category factor (0–35 pts)
  if (weather.stormCategory !== null) {
    if (weather.stormCategory >= 4) score += 35;
    else if (weather.stormCategory >= 3) score += 28;
    else if (weather.stormCategory >= 2) score += 20;
    else if (weather.stormCategory >= 1) score += 12;
    else score += 5;
  }

  // Storm distance factor (0–25 pts)
  if (weather.stormDistance !== null) {
    if (weather.stormDistance <= 50) score += 25;
    else if (weather.stormDistance <= 100) score += 18;
    else if (weather.stormDistance <= 200) score += 10;
    else if (weather.stormDistance <= 400) score += 4;
  }

  score = Math.min(100, score);
  return { score, level: scoreToLevel(score), emergencyType: 'storm' };
}

/**
 * Extreme heat risk score (0–100)
 * Factors: temperature, heat index, duration forecast
 */
export function calculateHeatRisk(input: HeatRiskInput): RiskScore {
  const { weather } = input;

  let score = 0;

  // Temperature factor (0–40 pts)
  if (weather.temperature >= 46) score += 40;
  else if (weather.temperature >= 42) score += 32;
  else if (weather.temperature >= 38) score += 22;
  else if (weather.temperature >= 35) score += 12;
  else if (weather.temperature >= 32) score += 5;

  // Heat index (feels like) factor (0–30 pts)
  if (weather.feelsLike >= 50) score += 30;
  else if (weather.feelsLike >= 45) score += 24;
  else if (weather.feelsLike >= 40) score += 16;
  else if (weather.feelsLike >= 36) score += 8;

  // Duration forecast (0–30 pts) — hours forecast above 40°C
  if (weather.heatIndexForecast >= 12) score += 30;
  else if (weather.heatIndexForecast >= 8) score += 22;
  else if (weather.heatIndexForecast >= 4) score += 14;
  else if (weather.heatIndexForecast >= 2) score += 7;

  score = Math.min(100, score);
  return { score, level: scoreToLevel(score), emergencyType: 'heat' };
}

/**
 * Tsunami risk score (0–100)
 */
export function calculateTsunamiRisk(input: TsunamiRiskInput): RiskScore {
  const { warnings, userLocation } = input;

  if (warnings.length === 0) {
    return { score: 0, level: 'LOW', emergencyType: 'tsunami' };
  }

  let maxScore = 0;
  for (const warning of warnings) {
    const score = calculateTsunamiRiskScore(warning, userLocation);
    if (score > maxScore) maxScore = score;
  }

  return { score: maxScore, level: scoreToLevel(maxScore), emergencyType: 'tsunami' };
}

export function getOverallRisk(scores: RiskScore[]): { level: RiskLevel; score: number } {
  if (scores.length === 0) return { level: 'LOW', score: 0 };
  const maxScore = Math.max(...scores.map(s => s.score));
  return { level: scoreToLevel(maxScore), score: maxScore };
}

export type EmergencyRiskScores = Record<EmergencyType, RiskScore>;

export function calculateAllRisks(
  wildfireInput: WildfireRiskInput,
  earthquakeInput: EarthquakeRiskInput,
  floodInput: FloodRiskInput,
  stormInput: StormRiskInput,
  heatInput: HeatRiskInput,
  tsunamiInput: TsunamiRiskInput
): EmergencyRiskScores {
  return {
    wildfire: calculateWildfireRisk(wildfireInput),
    earthquake: calculateEarthquakeRisk(earthquakeInput),
    flood: calculateFloodRisk(floodInput),
    storm: calculateStormRisk(stormInput),
    heat: calculateHeatRisk(heatInput),
    tsunami: calculateTsunamiRisk(tsunamiInput),
  };
}
