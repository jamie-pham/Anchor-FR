import { RiskLevel, EmergencyType } from '../types';

export const colors = {
  high: '#D32F2F',
  medium: '#F57C00',
  low: '#388E3C',
  background: '#0A0E1A',
  surface: '#141824',
  surfaceElevated: '#1E2435',
  text: '#FFFFFF',
  textSecondary: '#8892A4',
  accent: '#4A9EFF',
  border: '#2A3245',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  transparent: 'transparent',
};

export const emergencyIcons: Record<EmergencyType, string> = {
  wildfire: '🔥',
  flood: '🌊',
  earthquake: '⚡',
  storm: '⛈',
  heat: '☀️',
  tsunami: '🌊',
};

export const emergencyLabels: Record<EmergencyType, string> = {
  wildfire: 'Wildfire',
  flood: 'Flood',
  earthquake: 'Earthquake',
  storm: 'Severe Storm',
  heat: 'Extreme Heat',
  tsunami: 'Tsunami',
};

export const riskColors: Record<RiskLevel, string> = {
  HIGH: colors.high,
  MEDIUM: colors.medium,
  LOW: colors.low,
};

export const riskBackgroundColors: Record<RiskLevel, string> = {
  HIGH: 'rgba(211, 47, 47, 0.15)',
  MEDIUM: 'rgba(245, 124, 0, 0.15)',
  LOW: 'rgba(56, 142, 60, 0.15)',
};

export const BASE_FONT_SIZE = 17;
export const LARGE_TEXT_MULTIPLIER = 1.25;

export function getFontSize(base: number, largeText: boolean): number {
  return largeText ? Math.round(base * LARGE_TEXT_MULTIPLIER) : base;
}

export const fontSizes = {
  xs: 13,
  sm: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  hero: 40,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const MIN_TOUCH_SIZE = 56;

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};
