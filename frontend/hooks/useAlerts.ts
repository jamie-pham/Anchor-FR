import { useState, useCallback, useRef } from 'react';
import { Alert as AppAlert, CheckAlertsResponse, RiskLevel, RiskScoreResponse, EmergencyType, RiskScore } from '../types';
import { checkAlerts, fetchAlerts, calculateRisk } from '../services/api';
import { Coordinates } from '../types';

export interface AlertsState {
  alerts: AppAlert[];
  riskScores: Partial<Record<EmergencyType, RiskScore>>;
  overallRisk: RiskLevel;
  overallScore: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useAlerts(location: Coordinates | null, deviceToken?: string | null) {
  const [state, setState] = useState<AlertsState>({
    alerts: [],
    riskScores: {},
    overallRisk: 'LOW',
    overallScore: 0,
    loading: false,
    refreshing: false,
    error: null,
    lastChecked: null,
  });

  const isChecking = useRef(false);

  const checkForAlerts = useCallback(async (isRefresh = false) => {
    if (!location || isChecking.current) return;
    isChecking.current = true;

    setState(prev => ({
      ...prev,
      loading: !isRefresh,
      refreshing: isRefresh,
      error: null,
    }));

    try {
      const [checkResponse, riskResponse] = await Promise.all([
        checkAlerts({
          lat: location.lat,
          lng: location.lng,
          deviceToken: deviceToken ?? undefined,
        }),
        calculateRisk(location.lat, location.lng),
      ]);

      setState(prev => ({
        ...prev,
        alerts: checkResponse.alerts,
        riskScores: riskResponse.scores,
        overallRisk: checkResponse.overallRisk,
        overallScore: checkResponse.overallScore,
        loading: false,
        refreshing: false,
        lastChecked: new Date(),
      }));
    } catch (error) {
      const err = error as Error;
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: `Failed to check for alerts: ${err.message}`,
      }));
    } finally {
      isChecking.current = false;
    }
  }, [location, deviceToken]);

  const refresh = useCallback(() => checkForAlerts(true), [checkForAlerts]);

  const loadAlerts = useCallback(async () => {
    if (!location) return;
    try {
      const alerts = await fetchAlerts(location.lat, location.lng);
      setState(prev => ({ ...prev, alerts }));
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, [location]);

  return {
    ...state,
    checkForAlerts,
    refresh,
    loadAlerts,
  };
}
