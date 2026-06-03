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

export interface CheckAlertsResponse {
  alerts: Alert[];
  overallRisk: RiskLevel;
  overallScore: number;
  checkedAt: string;
}

export interface RiskScoreResponse {
  scores: Record<EmergencyType, RiskScore>;
  overall: { level: RiskLevel; score: number };
  calculatedAt: string;
  location: Coordinates;
}

export type AlertThreshold = 'HIGH' | 'MEDIUM' | 'LOW';

export interface UserSettings {
  alertThreshold: AlertThreshold;
  largeTextMode: boolean;
  locationName: string;
  emergencyContact: string;
  language: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  alertThreshold: 'MEDIUM',
  largeTextMode: false,
  locationName: '',
  emergencyContact: '',
  language: 'English',
};
