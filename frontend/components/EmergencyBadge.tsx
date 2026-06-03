import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel } from '../types';
import { colors, riskColors, fontSizes, getFontSize, borderRadius, spacing } from '../constants/theme';

interface EmergencyBadgeProps {
  level: RiskLevel;
  largeText?: boolean;
  compact?: boolean;
}

const LEVEL_LABELS: Record<RiskLevel, string> = {
  HIGH: 'HIGH RISK',
  MEDIUM: 'MEDIUM RISK',
  LOW: 'LOW RISK',
};

const LEVEL_ICONS: Record<RiskLevel, string> = {
  HIGH: '🚨',
  MEDIUM: '⚠️',
  LOW: 'ℹ️',
};

export default function EmergencyBadge({ level, largeText = false, compact = false }: EmergencyBadgeProps) {
  const badgeColor = riskColors[level];
  const fontSize = getFontSize(compact ? fontSizes.xs : fontSizes.sm, largeText);

  return (
    <View
      style={[
        styles.badge,
        { borderColor: badgeColor, backgroundColor: `${badgeColor}20` },
        compact && styles.compact,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Risk level: ${level}`}
    >
      <Text style={[styles.icon, compact && styles.iconCompact]}>
        {LEVEL_ICONS[level]}
      </Text>
      <Text
        style={[
          styles.label,
          { color: badgeColor, fontSize },
        ]}
      >
        {compact ? level : LEVEL_LABELS[level]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    gap: 4,
  },
  compact: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  icon: {
    fontSize: 14,
  },
  iconCompact: {
    fontSize: 11,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
