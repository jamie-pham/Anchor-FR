import axios from 'axios';
import { CheckAlertsResponse, RiskScoreResponse, Alert } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      console.error(`[API] Error: ${message}`);
    }
    return Promise.reject(error);
  }
);

export interface CheckAlertsParams {
  lat: number;
  lng: number;
  deviceToken?: string;
}

/**
 * Check for active alerts at a location
 */
export async function checkAlerts(params: CheckAlertsParams): Promise<CheckAlertsResponse> {
  const response = await apiClient.post<CheckAlertsResponse>('/alerts/check', params);
  return response.data;
}

/**
 * Fetch recent alerts for a location
 */
export async function fetchAlerts(lat: number, lng: number, limit = 20): Promise<Alert[]> {
  const response = await apiClient.get<{ alerts: Alert[]; total: number }>('/alerts', {
    params: { lat, lng, limit },
  });
  return response.data.alerts;
}

/**
 * Calculate risk scores for a location without generating full alerts
 */
export async function calculateRisk(lat: number, lng: number): Promise<RiskScoreResponse> {
  const response = await apiClient.post<RiskScoreResponse>('/risk/calculate', { lat, lng });
  return response.data;
}

/**
 * Register device push notification token
 */
export async function registerDevice(deviceToken: string, lat: number, lng: number): Promise<void> {
  await apiClient.post('/notifications/register', { deviceToken, lat, lng });
}

/**
 * Unregister device push notification token
 */
export async function unregisterDevice(deviceToken: string): Promise<void> {
  await apiClient.delete(`/notifications/register/${encodeURIComponent(deviceToken)}`);
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; version: string }> {
  const response = await apiClient.get<{ status: string; version: string }>('/health');
  return response.data;
}

export default apiClient;
