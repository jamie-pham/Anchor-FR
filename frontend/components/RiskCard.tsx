import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { EmergencyType, RiskLevel, RiskScore } from '../types';
import {
  colors,
  riskColors,
  riskBackgroundColors,
  emergencyIcons,
  emergencyLabels,
  fontSizes,
  getFontSize,
  spacing,
  borderRadius,
  shadows,
  MIN_TOUCH_SIZE,
} from '../constants/theme';
import EmergencyBadge from './EmergencyBadge';

interface RiskCardProps {
  emergencyType: EmergencyType;
  riskScore: RiskScore;
  largeText?: boolean;
  onPress?: () => void;
}

function RiskBar({ score, level }: { score: number; level: RiskLevel }) {
  const barColor = riskColors[level];
  return (
    <View style={styles.barContainer} accessibilityLabel={`Risk score: ${score} out of 100`}>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${score}%` as any, backgroundColor: barColor },
          ]}
        />
      </View>
      <Text style={styles.barLabel}>{score}</Text>
    </View>
  );
}

export default function RiskCard({ emergencyType, riskScore, largeText = false, onPress }: RiskCardProps) {
  const { score, level } = riskScore;
  const icon = emergencyIcons[emergencyType];
  const label = emergencyLabels[emergencyType];
  const bgColor = riskBackgroundColors[level];

  const titleSize = getFontSize(fontSizes.md, largeText);
  const subtitleSize = getFontSize(fontSizes.sm, largeText);

  const content = (
    <View
      style={[styles.card, { borderColor: riskColors[level], backgroundColor: bgColor }]}
      accessibilityRole="none"
      accessibilityLabel={`${label}: ${level} risk, score ${score} out of 100`}
    >
      <View style={styles.header}>
        <View style={styles.iconRow}>
          <Text style={styles.icon} accessibilityHidden>{icon}</Text>
          <View>
            <Text style={[styles.title, { fontSize: titleSize }]}>{label}</Text>
            <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
              {level === 'LOW' ? 'No active threat' : `Score: ${score}/100`}
            </Text>
          </View>
        </View>
        <EmergencyBadge level={level} largeText={largeText} compact />
      </View>
      {level !== 'LOW' && (
        <RiskBar score={score} level={level} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${level} risk. Tap for details.`}
        style={styles.touchable}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  touchable: {
    minHeight: MIN_TOUCH_SIZE,
  },
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    color: colors.text,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.round,
  },
  barLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'right',
  },
});
