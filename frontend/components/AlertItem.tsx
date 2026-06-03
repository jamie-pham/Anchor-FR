import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Alert } from '../types';
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

interface AlertItemProps {
  alert: Alert;
  largeText?: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export default function AlertItem({ alert, largeText = false }: AlertItemProps) {
  const [expanded, setExpanded] = useState(false);

  const icon = emergencyIcons[alert.emergencyType];
  const label = emergencyLabels[alert.emergencyType];
  const levelColor = riskColors[alert.riskLevel];
  const bgColor = riskBackgroundColors[alert.riskLevel];

  const headlineSize = getFontSize(fontSizes.md, largeText);
  const bodySize = getFontSize(fontSizes.sm, largeText);
  const smallSize = getFontSize(fontSizes.xs, largeText);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${label} alert: ${alert.headline}. Risk level ${alert.riskLevel}. Tap to ${expanded ? 'collapse' : 'expand'}.`}
      style={styles.touchable}
    >
      <View
        style={[
          styles.container,
          { borderLeftColor: levelColor, backgroundColor: bgColor },
          expanded && styles.containerExpanded,
        ]}
      >
        {/* Header row */}
        <View style={styles.header}>
          <Text style={styles.icon} accessibilityHidden>{icon}</Text>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.typeLabel, { fontSize: smallSize, color: levelColor }]}>
                {label.toUpperCase()}
              </Text>
              <Text style={[styles.timestamp, { fontSize: smallSize }]}>
                {formatRelativeTime(alert.createdAt)}
              </Text>
            </View>
            <Text style={[styles.headline, { fontSize: headlineSize }]} numberOfLines={expanded ? undefined : 2}>
              {alert.headline}
            </Text>
          </View>
        </View>

        {/* Badge */}
        <View style={styles.badgeRow}>
          <EmergencyBadge level={alert.riskLevel} largeText={largeText} compact />
          <Text style={[styles.expandHint, { fontSize: smallSize }]}>
            {expanded ? 'Tap to close' : 'Tap for details'}
          </Text>
        </View>

        {/* Expanded content */}
        {expanded && (
          <View style={styles.expandedContent}>
            <Text style={[styles.explanation, { fontSize: bodySize }]}>
              {alert.explanation}
            </Text>

            <Text style={[styles.actionsHeader, { fontSize: bodySize }]}>
              What to do now:
            </Text>
            {alert.actions.map((action, index) => (
              <View key={index} style={styles.actionItem}>
                <View style={[styles.actionNumber, { backgroundColor: levelColor }]}>
                  <Text style={styles.actionNumberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.actionText, { fontSize: bodySize }]}>{action}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    minHeight: MIN_TOUCH_SIZE,
    marginBottom: spacing.sm,
  },
  container: {
    borderLeftWidth: 4,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.small,
    backgroundColor: colors.surface,
  },
  containerExpanded: {
    ...shadows.medium,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 28,
    marginTop: 2,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timestamp: {
    color: colors.textSecondary,
  },
  headline: {
    color: colors.text,
    fontWeight: '600',
    lineHeight: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  expandHint: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  explanation: {
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  actionsHeader: {
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  actionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  actionNumberText: {
    color: colors.text,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  actionText: {
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
});
