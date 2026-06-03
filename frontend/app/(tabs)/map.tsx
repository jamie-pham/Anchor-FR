import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../../hooks/useLocation';
import { useAlerts } from '../../hooks/useAlerts';
import EmergencyBadge from '../../components/EmergencyBadge';
import {
  colors,
  fontSizes,
  getFontSize,
  spacing,
  borderRadius,
  riskColors,
  emergencyIcons,
  emergencyLabels,
  MIN_TOUCH_SIZE,
  shadows,
} from '../../constants/theme';
import { EmergencyType, RiskLevel } from '../../types';

// Note: expo-maps / react-native-maps requires native build configuration.
// This screen provides a styled placeholder with risk overlay indicators
// that will be wired to MapView once the native module is linked.

interface RiskOverlayMarker {
  type: EmergencyType;
  level: RiskLevel;
  score: number;
  lat: number;
  lng: number;
  label: string;
}

export default function MapScreen() {
  const [largeText] = useState(false);
  const { location, locationName } = useLocation();
  const { riskScores, loading, refresh, refreshing } = useAlerts(location);

  const bodySize = getFontSize(fontSizes.sm, largeText);
  const smallSize = getFontSize(fontSizes.xs, largeText);

  // Build overlay markers from risk scores
  const markers: RiskOverlayMarker[] = Object.entries(riskScores)
    .filter(([, score]) => score.score >= 20)
    .map(([type, score]) => {
      // Offset each risk indicator slightly so they don't stack
      const offsets: Record<EmergencyType, [number, number]> = {
        wildfire: [0.08, 0.07],
        flood: [-0.05, 0.04],
        earthquake: [0.06, -0.08],
        storm: [-0.09, -0.06],
        heat: [0.03, 0.1],
        tsunami: [-0.07, 0.09],
      };
      const [latOff, lngOff] = offsets[type as EmergencyType] || [0, 0];
      return {
        type: type as EmergencyType,
        level: score.level,
        score: score.score,
        lat: (location?.lat ?? 0) + latOff,
        lng: (location?.lng ?? 0) + lngOff,
        label: emergencyLabels[type as EmergencyType],
      };
    });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          {/* Simulated grid lines */}
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`h${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 14}%` as any }]} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`v${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 14}%` as any }]} />
          ))}
        </View>

        {/* Simulated terrain shapes */}
        <View style={[styles.terrainBlob, { top: '15%', left: '10%', width: 80, height: 50, borderRadius: 40 }]} />
        <View style={[styles.terrainBlob, { top: '60%', right: '15%', width: 100, height: 60, borderRadius: 50 }]} />
        <View style={[styles.terrainBlob, { bottom: '20%', left: '30%', width: 60, height: 40, borderRadius: 30 }]} />

        {/* User location marker */}
        {location && (
          <View style={styles.userMarkerContainer}>
            <View style={styles.userMarkerPulse} />
            <View style={styles.userMarker} />
            <Text style={styles.userMarkerLabel}>You</Text>
          </View>
        )}

        {/* Risk overlay markers */}
        {markers.map((marker, index) => (
          <View
            key={marker.type}
            style={[
              styles.riskMarker,
              {
                top: `${30 + index * 10}%` as any,
                left: `${20 + index * 12}%` as any,
                borderColor: riskColors[marker.level],
                backgroundColor: `${riskColors[marker.level]}25`,
              },
            ]}
            accessibilityRole="text"
            accessibilityLabel={`${marker.label}: ${marker.level} risk`}
          >
            <Text style={styles.riskMarkerIcon}>{emergencyIcons[marker.type]}</Text>
          </View>
        ))}

        {/* Map placeholder label */}
        <View style={styles.mapOverlayLabel}>
          <Text style={[styles.mapOverlayText, { fontSize: smallSize }]}>
            Interactive map — requires native build
          </Text>
        </View>
      </View>

      {/* Location bar */}
      <View style={styles.locationBar}>
        <Text style={styles.locationIcon} accessibilityHidden>📍</Text>
        <Text style={[styles.locationText, { fontSize: bodySize }]} numberOfLines={1}>
          {locationName || 'Locating…'}
        </Text>
        <TouchableOpacity
          onPress={refresh}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel="Refresh map"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={styles.refreshText}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Risk legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendTitle, { fontSize: smallSize }]}>Active Hazards</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : markers.length === 0 ? (
          <Text style={[styles.legendEmpty, { fontSize: smallSize }]}>
            No hazards detected nearby
          </Text>
        ) : (
          markers.map(marker => (
            <View key={marker.type} style={styles.legendItem}>
              <Text style={styles.legendIcon}>{emergencyIcons[marker.type]}</Text>
              <Text style={[styles.legendLabel, { fontSize: smallSize }]}>{marker.label}</Text>
              <View style={styles.legendBadgeWrap}>
                <EmergencyBadge level={marker.level} compact largeText={largeText} />
              </View>
              <Text style={[styles.legendScore, { fontSize: smallSize, color: riskColors[marker.level] }]}>
                {marker.score}
              </Text>
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#0D1520',
    position: 'relative',
    overflow: 'hidden',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.4,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.border,
    opacity: 0.4,
  },
  terrainBlob: {
    position: 'absolute',
    backgroundColor: '#1A2535',
    opacity: 0.6,
  },
  userMarkerContainer: {
    position: 'absolute',
    top: '45%',
    left: '48%',
    alignItems: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.accent}30`,
    top: -10,
    left: -10,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.text,
  },
  userMarkerLabel: {
    color: colors.text,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    marginTop: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  riskMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskMarkerIcon: {
    fontSize: 18,
  },
  mapOverlayLabel: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  mapOverlayText: {
    color: colors.textSecondary,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    minHeight: MIN_TOUCH_SIZE,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  refreshButton: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    color: colors.accent,
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
  legend: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendTitle: {
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  legendEmpty: {
    color: colors.textSecondary,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: 32,
  },
  legendIcon: {
    fontSize: 18,
  },
  legendLabel: {
    color: colors.text,
    flex: 1,
  },
  legendBadgeWrap: {
    marginRight: spacing.xs,
  },
  legendScore: {
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'right',
  },
});
